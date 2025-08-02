import type { APIRoute } from "astro";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { Parser, Store, DataFactory } from "n3";

// Cache for parsed graph data
const graphCache = new Map();

// Default configuration - easy to extend later
const defaultConfig = {
  predicatesAs: "edges" as "edges" | "nodes",
  literalsAs: "nodes" as "nodes" | "properties",
  displayProperty: "http://www.w3.org/2000/01/rdf-schema#label", // rdfs:label
  includeTypes: true,
  // Full data granularity - ALL edges shown
  showLiteralLinks: true, // Show all literal connections
};

interface GraphNode {
  id: string;
  label?: string;
  type?: string;
  isLiteral?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
  predicate: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    tripleCount: number;
    nodeCount: number;
    linkCount: number;
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    // For now, hardcode arcaea.ttl as requested
    const filename = "arcaea.ttl";
    const filePath = join(process.cwd(), "public", "ontology", filename);

    // Check cache first
    const cacheKey = filename;
    const fileStat = await stat(filePath);
    const fileModTime = fileStat.mtime.getTime();

    const cached = graphCache.get(cacheKey);
    if (cached && cached.modTime >= fileModTime) {
      console.log(`Cache hit for ${filename}`);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Parsing ${filename}...`);

    // Read and parse the RDF file
    const rdfContent = await readFile(filePath, "utf-8");
    const parser = new Parser();
    const store = new Store();

    // Parse triples into store
    const quads = parser.parse(rdfContent);
    store.addQuads(quads);

    // Convert to graph format
    const graphData = await convertToGraph(store, defaultConfig);

    // Cache the result
    graphCache.set(cacheKey, {
      data: graphData,
      modTime: fileModTime,
    });

    console.log(
      `Parsed ${graphData.stats.tripleCount} triples into ${graphData.stats.nodeCount} nodes and ${graphData.stats.linkCount} links`
    );

    return new Response(JSON.stringify(graphData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing RDF data:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process RDF data",
        nodes: [],
        links: [],
        stats: { tripleCount: 0, nodeCount: 0, linkCount: 0 },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

async function convertToGraph(
  store: Store,
  config: typeof defaultConfig
): Promise<GraphData> {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Get all quads from the store
  const quads = store.getQuads(null, null, null, null);

  // First pass: Create all nodes
  for (const quad of quads) {
    const subject = quad.subject.value;
    const object = quad.object.value;
    const isObjectLiteral = quad.object.termType === "Literal";

    // Add subject as node
    if (!nodes.has(subject)) {
      nodes.set(subject, {
        id: subject,
        label: getDisplayLabel(store, subject, config.displayProperty),
        type: getNodeType(store, subject),
        isLiteral: false,
      });
    }

    // Add object as node (skip literals if configured)
    if (
      (config.literalsAs === "nodes" || !isObjectLiteral) &&
      (config.showLiteralLinks || !isObjectLiteral)
    ) {
      if (!nodes.has(object)) {
        nodes.set(object, {
          id: object,
          label: isObjectLiteral
            ? object
            : getDisplayLabel(store, object, config.displayProperty),
          type: isObjectLiteral ? "literal" : getNodeType(store, object),
          isLiteral: isObjectLiteral,
        });
      }
    }
  }

  // Second pass: Create ALL links - full granularity
  for (const quad of quads) {
    const subject = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object.value;
    const isObjectLiteral = quad.object.termType === "Literal";

    // Skip if we're not showing literal links and this is a literal
    if (!config.showLiteralLinks && isObjectLiteral) continue;

    // Skip if object not in nodes
    if (!nodes.has(object)) continue;

    // Always show all links - no simplification
    if (config.predicatesAs === "edges") {
      links.push({
        source: subject,
        target: object,
        label:
          getDisplayLabel(store, predicate, config.displayProperty) ||
          predicate.split(/[#\/]/).pop() ||
          predicate,
        predicate: predicate,
      });
    }
  }

  console.log(
    `Full data: ${quads.length} triples → ${nodes.size} nodes, ${links.length} links`
  );

  return {
    nodes: Array.from(nodes.values()),
    links: links,
    stats: {
      tripleCount: quads.length,
      nodeCount: nodes.size,
      linkCount: links.length,
    },
  };
}

function getDisplayLabel(
  store: Store,
  uri: string,
  labelProperty: string
): string | undefined {
  const labelQuads = store.getQuads(
    DataFactory.namedNode(uri),
    DataFactory.namedNode(labelProperty),
    null,
    null
  );
  if (labelQuads.length > 0) {
    return labelQuads[0].object.value;
  }

  // Fallback to local name
  const localName = uri.split(/[#\/]/).pop();
  return localName && localName !== uri ? localName : undefined;
}

function getNodeType(store: Store, uri: string): string | undefined {
  const typeQuads = store.getQuads(
    DataFactory.namedNode(uri),
    DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    null,
    null
  );

  if (typeQuads.length > 0) {
    const typeUri = typeQuads[0].object.value;
    return typeUri.split(/[#\/]/).pop() || typeUri;
  }

  return undefined;
}
