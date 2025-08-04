import type { APIRoute } from "astro";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { Parser, Store, DataFactory } from "n3";

// Enable server-side rendering for dynamic routes
export const prerender = false;

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
  edgeCount?: number;
  qualifiedName?: string;
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

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Extract filename from path parameters, default to rdf.ttl
    const filename = params.filename || "rdf.ttl";

    console.log("🔍 Debug URL info:");
    console.log("  - Request URL:", request.url);
    console.log("  - Path params:", params);
    console.log("  - Requested filename:", params.filename);
    console.log("  - Final filename:", filename);

    // Validate filename to prevent path traversal attacks
    const allowedFiles = [
      "rdf.ttl",
      "arcaea.ttl",
      "arcaea-one.ttl",
      "semiotic-core.ttl",
      "pizza.ttl",
      "example.ttl",
      "test.ttl",
    ];
    if (!allowedFiles.includes(filename)) {
      return new Response(JSON.stringify({ error: "Invalid filename" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filePath = join(process.cwd(), "public", "ontology", filename);
    console.log("📂 Loading ontology:", filename, "from path:", filePath);

    // TEMPORARY: Clear cache to debug issue
    console.log("🗑️ Clearing cache for debugging");
    graphCache.clear();

    // Check cache first
    const cacheKey = filename;
    const fileStat = await stat(filePath);
    const fileModTime = fileStat.mtime.getTime();
    const fileSize = fileStat.size;

    console.log(
      `📊 File stats for ${filename}: size=${fileSize} bytes, modTime=${fileModTime}`
    );

    const cached = graphCache.get(cacheKey);
    if (cached && cached.modTime >= fileModTime) {
      console.log(`🔄 Cache hit for ${filename}`);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`🔧 Parsing ${filename}... (cache miss or file modified)`);

    // Read and parse the RDF file
    const rdfContent = await readFile(filePath, "utf-8");
    console.log(`📄 Read ${rdfContent.length} characters from ${filename}`);
    console.log(`📝 First 200 chars: ${rdfContent.substring(0, 200)}...`);

    const parser = new Parser();
    const store = new Store();
    const prefixes: Record<string, string> = {};

    // Parse triples into store and extract prefixes
    const quads = parser.parse(rdfContent);
    store.addQuads(quads);

    // Extract prefixes from parsed content by analyzing the triples
    // N3 stores prefixes in the NamedNode values, we can reverse-engineer common ones
    const commonPrefixes = {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      owl: "http://www.w3.org/2002/07/owl#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      dc: "http://purl.org/dc/elements/1.1/",
      dcterms: "http://purl.org/dc/terms/",
      foaf: "http://xmlns.com/foaf/0.1/",
      skos: "http://www.w3.org/2004/02/skos/core#",
    };

    // Auto-detect prefixes from URIs in the data
    const allUris = new Set<string>();
    quads.forEach((quad) => {
      allUris.add(quad.subject.value);
      allUris.add(quad.predicate.value);
      if (quad.object.termType === "NamedNode") {
        allUris.add(quad.object.value);
      }
    });

    // Extract custom prefixes from URIs
    allUris.forEach((uri) => {
      const hashIndex = uri.lastIndexOf("#");
      const slashIndex = uri.lastIndexOf("/");
      const splitIndex = Math.max(hashIndex, slashIndex);

      if (splitIndex > 0) {
        const namespace = uri.substring(0, splitIndex + 1);
        const localName = uri.substring(splitIndex + 1);

        // Skip if already have this namespace or it's too short
        if (
          localName.length > 0 &&
          !Object.values(prefixes).includes(namespace)
        ) {
          // Try to create a reasonable prefix name
          const baseName = namespace
            .replace(/https?:\/\//, "")
            .replace(/[\/\.\-]/g, "_")
            .replace(/_+$/, "");
          const shortName = baseName.split("_").pop() || "ns";

          if (!prefixes[shortName] && !(shortName in commonPrefixes)) {
            prefixes[shortName] = namespace;
          }
        }
      }
    });

    // Merge with common prefixes
    Object.assign(prefixes, commonPrefixes);

    console.log(`🏷️ Using prefixes:`, prefixes);

    // Convert to graph format with enhanced processing
    const graphData = await convertToGraph(store, defaultConfig, prefixes);

    // Cache the result
    graphCache.set(cacheKey, {
      data: graphData,
      modTime: fileModTime,
    });

    console.log(
      `✅ Enhanced parsing complete: ${graphData.stats.tripleCount} triples → ${graphData.stats.nodeCount} nodes, ${graphData.stats.linkCount} links`
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
  config: typeof defaultConfig,
  prefixes: Record<string, string>
): Promise<GraphData> {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Get all quads from the store
  const quads = store.getQuads(null, null, null, null);

  // First pass: Create all nodes with enhanced labeling
  for (const quad of quads) {
    const subject = quad.subject.value;
    const object = quad.object.value;
    const isObjectLiteral = quad.object.termType === "Literal";

    // Add subject as node
    if (!nodes.has(subject)) {
      nodes.set(subject, {
        id: subject,
        label: getDisplayLabel(
          store,
          subject,
          config.displayProperty,
          prefixes
        ),
        type: getNodeType(store, subject, prefixes),
        isLiteral: false,
        edgeCount: 0, // Will be calculated later
        qualifiedName: subject, // Full URI
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
            : getDisplayLabel(store, object, config.displayProperty, prefixes),
          type: isObjectLiteral
            ? "literal"
            : getNodeType(store, object, prefixes),
          isLiteral: isObjectLiteral,
          edgeCount: 0, // Will be calculated later
          qualifiedName: object, // Full URI
        });
      }
    }
  }

  // Second pass: Create ALL links with enhanced labeling
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
          getDisplayLabel(store, predicate, config.displayProperty, prefixes) ||
          createPrefixedName(predicate, prefixes),
        predicate: predicate,
      });
    }
  }

  // Third pass: Calculate edge counts for each node
  const edgeCounts = new Map<string, number>();

  // Count edges for each node (both as source and target)
  for (const link of links) {
    const source = link.source;
    const target = link.target;

    edgeCounts.set(source, (edgeCounts.get(source) || 0) + 1);
    edgeCounts.set(target, (edgeCounts.get(target) || 0) + 1);
  }

  // Update nodes with edge counts
  for (const [nodeId, node] of nodes) {
    node.edgeCount = edgeCounts.get(nodeId) || 0;
  }

  console.log(
    `🧠 Enhanced processing: ${quads.length} triples → ${nodes.size} nodes, ${
      links.length
    } links (with prefixes: ${Object.keys(prefixes).join(", ")})`
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

// Helper function to create prefixed names
function createPrefixedName(
  uri: string,
  prefixes: Record<string, string>
): string {
  // Try to find a matching prefix
  for (const [prefix, namespace] of Object.entries(prefixes)) {
    if (uri.startsWith(namespace)) {
      const localName = uri.substring(namespace.length);
      return `${prefix}:${localName}`;
    }
  }

  // Fallback to local name
  return uri.split(/[#\/]/).pop() || uri;
}

function getDisplayLabel(
  store: Store,
  uri: string,
  labelProperty: string,
  prefixes: Record<string, string>
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

  // Fallback to prefixed name instead of just local name
  return createPrefixedName(uri, prefixes);
}

function getNodeType(
  store: Store,
  uri: string,
  prefixes: Record<string, string>
): string | undefined {
  const typeQuads = store.getQuads(
    DataFactory.namedNode(uri),
    DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    null,
    null
  );

  if (typeQuads.length > 0) {
    const typeUri = typeQuads[0].object.value;
    return createPrefixedName(typeUri, prefixes);
  }

  return undefined;
}
