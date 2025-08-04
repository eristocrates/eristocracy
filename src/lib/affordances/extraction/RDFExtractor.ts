/**
 * RDF Extraction Tool
 * Synchronizes TypeScript @rdf: annotations with .ttl vocabulary definitions
 * Ensures semantic consistency between code and RDF representations
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export interface RDFAnnotation {
  type: "class" | "property" | "method" | "affordance";
  name: string;
  iri: string;
  comment?: string;
  domain?: string;
  range?: string;
  capabilities?: string[];
  invariants?: Record<string, string>;
}

export interface ExtractionResult {
  annotations: RDFAnnotation[];
  generatedTTL: string;
  warnings: string[];
  synchronizationReport: {
    typescriptCount: number;
    rdfCount: number;
    synchronized: boolean;
    missing: string[];
    extra: string[];
  };
}

/**
 * Extracts RDF annotations from TypeScript files and synchronizes with TTL vocabulary
 */
export class RDFExtractor {
  private baseIRI = "http://eristocracy.dev/affordances#";

  /**
   * Extract annotations from TypeScript source code
   */
  async extractAnnotationsFromTypeScript(
    filePath: string
  ): Promise<RDFAnnotation[]> {
    const source = await readFile(filePath, "utf-8");
    const annotations: RDFAnnotation[] = [];

    // Extract @rdf: annotations
    const rdfAnnotationRegex = /\/\*\*[\s\S]*?\*\//g;
    const commentBlocks = source.match(rdfAnnotationRegex) || [];

    for (const comment of commentBlocks) {
      const annotation = this.parseRDFAnnotation(comment);
      if (annotation) {
        annotations.push(annotation);
      }
    }

    return annotations;
  }

  /**
   * Parse individual RDF annotation from comment block
   */
  private parseRDFAnnotation(comment: string): RDFAnnotation | null {
    const lines = comment
      .split("\n")
      .map((line) => line.trim().replace(/^\*\s?/, ""));

    let annotation: Partial<RDFAnnotation> = {};

    for (const line of lines) {
      // @rdf:class, @rdf:property, @rdf:method
      if (line.startsWith("@rdf:class")) {
        annotation.type = "class";
        annotation.iri = this.extractIRI(line);
      } else if (line.startsWith("@rdf:property")) {
        annotation.type = "property";
        annotation.iri = this.extractIRI(line);
      } else if (line.startsWith("@rdf:method")) {
        annotation.type = "method";
        annotation.iri = this.extractIRI(line);
      } else if (line.startsWith("@affordance:")) {
        annotation.type = "affordance";
        annotation.name = line.replace("@affordance:", "").trim();
        annotation.iri = `${this.baseIRI}${annotation.name}`;
      }

      // @capability: annotations
      else if (line.startsWith("@capability:")) {
        const capability = line.replace("@capability:", "").trim();
        annotation.capabilities = annotation.capabilities || [];
        annotation.capabilities.push(capability);
      }

      // @invariant: annotations
      else if (line.startsWith("@invariant:")) {
        const match = line.match(/@invariant:(\w+)\s+"(.+)"/);
        if (match) {
          annotation.invariants = annotation.invariants || {};
          annotation.invariants[match[1]] = match[2];
        }
      }

      // Regular comments
      else if (line.startsWith("@description:")) {
        annotation.comment = line.replace("@description:", "").trim();
      }
    }

    return annotation.type ? (annotation as RDFAnnotation) : null;
  }

  /**
   * Extract IRI from annotation line
   */
  private extractIRI(line: string): string {
    const match = line.match(/:(\w+)/);
    return match ? `${this.baseIRI}${match[1]}` : "";
  }

  /**
   * Generate TTL content from extracted annotations
   */
  generateTTL(annotations: RDFAnnotation[]): string {
    const prefixes = `@prefix : <${this.baseIRI}> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Generated from TypeScript annotations
# This file is auto-synchronized with source code

`;

    let ttlContent = prefixes;

    // Group by type
    const classes = annotations.filter((a) => a.type === "class");
    const properties = annotations.filter((a) => a.type === "property");
    const affordances = annotations.filter((a) => a.type === "affordance");

    // Generate classes
    if (classes.length > 0) {
      ttlContent += "# === Classes ===\n\n";
      for (const cls of classes) {
        ttlContent += this.generateClassTTL(cls);
      }
    }

    // Generate properties
    if (properties.length > 0) {
      ttlContent += "# === Properties ===\n\n";
      for (const prop of properties) {
        ttlContent += this.generatePropertyTTL(prop);
      }
    }

    // Generate affordances
    if (affordances.length > 0) {
      ttlContent += "# === Affordances ===\n\n";
      for (const affordance of affordances) {
        ttlContent += this.generateAffordanceTTL(affordance);
      }
    }

    return ttlContent;
  }

  private generateClassTTL(annotation: RDFAnnotation): string {
    const localName = annotation.iri.replace(this.baseIRI, ":");
    let ttl = `${localName}\n    a owl:Class ;\n`;

    if (annotation.comment) {
      ttl += `    rdfs:comment "${annotation.comment}" ;\n`;
    }

    ttl += "    .\n\n";
    return ttl;
  }

  private generatePropertyTTL(annotation: RDFAnnotation): string {
    const localName = annotation.iri.replace(this.baseIRI, ":");
    let ttl = `${localName}\n    a owl:ObjectProperty ;\n`;

    if (annotation.comment) {
      ttl += `    rdfs:comment "${annotation.comment}" ;\n`;
    }

    ttl += "    .\n\n";
    return ttl;
  }

  private generateAffordanceTTL(annotation: RDFAnnotation): string {
    const localName = annotation.iri.replace(this.baseIRI, ":");
    let ttl = `${localName}\n    a owl:Class ;\n    rdfs:subClassOf :AffordanceContract ;\n`;

    if (annotation.comment) {
      ttl += `    rdfs:comment "${annotation.comment}" ;\n`;
    }

    if (annotation.capabilities) {
      for (const capability of annotation.capabilities) {
        ttl += `    :hasCapability :${capability} ;\n`;
      }
    }

    if (annotation.invariants) {
      for (const [invariant, description] of Object.entries(
        annotation.invariants
      )) {
        ttl += `    :hasInvariant "${description}" ;\n`;
      }
    }

    ttl += "    .\n\n";
    return ttl;
  }

  /**
   * Compare TypeScript annotations with existing TTL file
   */
  async synchronizeWithTTL(
    typescriptPath: string,
    ttlPath: string
  ): Promise<ExtractionResult> {
    const annotations = await this.extractAnnotationsFromTypeScript(
      typescriptPath
    );
    const generatedTTL = this.generateTTL(annotations);

    let existingTTL = "";
    try {
      existingTTL = await readFile(ttlPath, "utf-8");
    } catch (error) {
      console.warn(`TTL file not found: ${ttlPath}, will create new file`);
    }

    // Simple synchronization check (could be more sophisticated)
    const typescriptEntities = annotations
      .map((a) => a.name || a.iri.split("#").pop())
      .filter((name): name is string => Boolean(name));
    const rdfEntities = this.extractEntitiesFromTTL(existingTTL);

    const missing = typescriptEntities.filter((e) => !rdfEntities.includes(e));
    const extra = rdfEntities.filter((e) => !typescriptEntities.includes(e));

    return {
      annotations,
      generatedTTL,
      warnings: [],
      synchronizationReport: {
        typescriptCount: typescriptEntities.length,
        rdfCount: rdfEntities.length,
        synchronized: missing.length === 0 && extra.length === 0,
        missing,
        extra,
      },
    };
  }

  /**
   * Extract entity names from TTL content (simple regex-based)
   */
  private extractEntitiesFromTTL(ttlContent: string): string[] {
    const entities: string[] = [];
    const lines = ttlContent.split("\n");

    for (const line of lines) {
      const match = line.match(/^:(\w+)/);
      if (match) {
        entities.push(match[1]);
      }
    }

    return entities;
  }

  /**
   * Write synchronized TTL file
   */
  async writeSynchronizedTTL(
    result: ExtractionResult,
    outputPath: string
  ): Promise<void> {
    await writeFile(outputPath, result.generatedTTL, "utf-8");

    console.log(`✅ Synchronized TTL written to: ${outputPath}`);
    console.log(`📊 Synchronization Report:`);
    console.log(
      `  TypeScript entities: ${result.synchronizationReport.typescriptCount}`
    );
    console.log(`  RDF entities: ${result.synchronizationReport.rdfCount}`);
    console.log(
      `  Synchronized: ${
        result.synchronizationReport.synchronized ? "✅" : "❌"
      }`
    );

    if (result.synchronizationReport.missing.length > 0) {
      console.log(
        `  Missing in RDF: ${result.synchronizationReport.missing.join(", ")}`
      );
    }

    if (result.synchronizationReport.extra.length > 0) {
      console.log(
        `  Extra in RDF: ${result.synchronizationReport.extra.join(", ")}`
      );
    }
  }
}

/**
 * Convenience function for command-line usage
 */
export async function synchronizeAffordanceVocabulary(): Promise<void> {
  const extractor = new RDFExtractor();

  const typescriptFiles = [
    "src/lib/affordances/types/AffordanceContract.ts",
    "src/lib/affordances/DataAffordance.ts",
  ];

  const ttlPath = "src/lib/affordances/vocabulary/affordances.ttl";

  console.log(
    "🔄 Synchronizing TypeScript annotations with RDF vocabulary...\n"
  );

  for (const tsFile of typescriptFiles) {
    console.log(`📁 Processing: ${tsFile}`);

    try {
      const result = await extractor.synchronizeWithTTL(tsFile, ttlPath);

      if (!result.synchronizationReport.synchronized) {
        console.log(`⚠️  Synchronization issues detected in ${tsFile}`);
        console.log(
          `   Missing: ${result.synchronizationReport.missing.join(", ")}`
        );
        console.log(
          `   Extra: ${result.synchronizationReport.extra.join(", ")}`
        );
      } else {
        console.log(`✅ ${tsFile} is synchronized with RDF vocabulary`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${tsFile}:`, error);
    }
  }

  console.log("\n🎯 Synchronization complete!");
}

// RDFExtractor is already exported above
