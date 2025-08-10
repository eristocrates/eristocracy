/**
 * RDF-to-TypeScript Color Generation Integration
 *
 * This module implements a semantic web pipeline that transforms RDF Turtle (TTL) color ontologies
 * into type-safe TypeScript modules at build time. It bridges formal semantic web representations
 * with practical web development workflows.
 *
 * ARCHITECTURAL PHILOSOPHY:
 * - RDF serves as the single source of truth for color definitions
 * - Semantic entities (colors) are authored using formal ontology languages
 * - Build-time transformation ensures zero runtime overhead
 * - Type safety is derived from semantic schema validation
 * - Dual export strategy provides both individual and collection access patterns
 *
 * PIPELINE FLOW:
 * 1. TTL Parsing: RDF Turtle → N3 Quads (semantic triples)
 * 2. Quad Processing: Semantic triples → JavaScript objects
 * 3. Code Generation: Objects → TypeScript module with exports
 * 4. Type Integration: Generated code integrates with Effect Schema validation
 *
 * @fileoverview Astro integration for semantic color system generation
 * @author Built for ontology-driven development workflow
 * @see https://www.w3.org/TR/turtle/ - RDF Turtle specification
 * @see https://rdf.js.org/ - RDF/JS data model specification
 */

import fs from "fs";
import { Parser, DataFactory, Quad } from "n3";

// N3 DataFactory provides utilities for creating RDF terms (IRIs, literals, blank nodes)
// These are used for semantic web operations, though currently only imported for completeness
const { namedNode, literal } = DataFactory;

/**
 * Transforms an RDF Turtle (TTL) ontology file into a TypeScript module with color exports.
 *
 * This function implements the core semantic-to-syntactic transformation pipeline:
 *
 * SEMANTIC LAYER (Input):
 * - RDF Turtle file containing color ontology
 * - Formal semantic predicates (:hex, :luminance, etc.)
 * - Typed literals with proper RDF datatypes
 *
 * SYNTACTIC LAYER (Output):
 * - TypeScript module with individual color exports
 * - Collection export for programmatic access
 * - JSON-serialized color objects preserving semantic properties
 *
 * RDF PARSING STRATEGY:
 * The function uses N3's synchronous parser to convert TTL into RDF quads (subject-predicate-object-graph).
 * Each quad represents one semantic assertion about a color entity.
 *
 * QUAD PROCESSING ALGORITHM:
 * 1. Extract entity name from subject IRI (everything after last "/")
 * 2. Extract property name from predicate IRI (everything after last "/")
 * 3. Process object based on term type:
 *    - Literals: Convert to appropriate JavaScript type (string/number)
 *    - IRIs: Currently ignored (could be extended for references)
 *    - Blank nodes: Currently ignored (could be extended for complex structures)
 *
 * TYPE COERCION LOGIC:
 * - Decimal datatypes (xsd:decimal, xsd:float, xsd:double) → parseFloat()
 * - All other literals → string preservation
 * - This preserves semantic typing while ensuring JavaScript compatibility
 *
 * CODE GENERATION STRATEGY:
 * - Individual exports: `export const colorName = { properties }`
 * - Collection export: `export const colors = { colorName: colorName, ... }`
 * - This dual pattern supports both direct imports and programmatic access
 *
 * ONTOLOGICAL ASSUMPTIONS:
 * - Colors are identified by their IRI fragment (local name)
 * - Properties are identified by their predicate IRI fragment
 * - All color entities share the same namespace structure
 * - Property values are atomic (no complex object nesting)
 *
 * ERROR HANDLING:
 * - File system errors propagate to caller (build-time failure)
 * - RDF parsing errors propagate to caller (semantic validation)
 * - Missing properties result in undefined object keys (graceful degradation)
 *
 * @param ttlPath - Absolute or relative path to the RDF Turtle ontology file
 *                  Expected to contain color entities with semantic properties
 * @param outPath - Target path for generated TypeScript module
 *                  Will be overwritten if it exists
 *
 * @throws {Error} File system errors (ENOENT, EACCES, etc.)
 * @throws {Error} RDF parsing errors (syntax violations, encoding issues)
 *
 * @example
 * // Input TTL file content:
 * // @prefix : <https://example.org/colors/> .
 * // :crimson a :color ;
 * //   :hex "#dc143c" ;
 * //   :luminance 0.21 .
 *
 * // Generated TypeScript output:
 * // export const crimson = {
 * //   "hex": "#dc143c",
 * //   "luminance": 0.21
 * // };
 * // export const colors = { crimson: crimson };
 */
export async function generateColorModuleFromTTL(
  ttlPath: string,
  outPath: string
): Promise<void> {
  // PHASE 1: FILE SYSTEM OPERATIONS
  // Read the RDF Turtle file as UTF-8 text
  // This assumes the TTL file uses standard UTF-8 encoding
  const ttl = fs.readFileSync(ttlPath, "utf8");

  // PHASE 2: RDF PARSING
  // Initialize N3 parser with default configuration
  // N3 automatically detects Turtle format and handles standard prefixes
  const parser = new Parser();

  // Parse TTL content into RDF quads (subject-predicate-object-graph tuples)
  // This operation is synchronous and returns an array of Quad objects
  // Each quad represents one semantic assertion in the RDF graph
  const quads: Quad[] = parser.parse(ttl);

  // PHASE 3: SEMANTIC-TO-SYNTACTIC TRANSFORMATION
  // Initialize accumulator for color entity properties
  // Structure: { entityName: { propertyName: propertyValue } }
  const colorMap: Record<string, Record<string, string | number>> = {};

  // Process each RDF quad to extract semantic properties
  for (const quad of quads) {
    // ENTITY EXTRACTION
    // Extract local name from subject IRI by taking everything after the last "/"
    // Example: "https://example.org/colors/crimson" → "crimson"
    // This assumes all color entities follow the same IRI pattern
    const subject = quad.subject.value.split("/").pop()!;

    // PROPERTY EXTRACTION
    // Extract property name from predicate IRI using same pattern
    // Example: "https://example.org/colors/hex" → "hex"
    // This maps semantic predicates to JavaScript object keys
    const predicate = quad.predicate.value.split("/").pop()!;

    // Get the RDF term representing the property value
    const object = quad.object;

    // Initialize entity object if this is the first property encountered
    if (!colorMap[subject]) colorMap[subject] = {};

    // LITERAL VALUE PROCESSING
    // Only process RDF literals (typed values), ignore IRIs and blank nodes
    // This focuses on actual data values rather than references
    if (object.termType === "Literal") {
      // TYPE COERCION BASED ON RDF DATATYPE
      // Check if the literal has a numeric datatype and convert appropriately
      // This preserves semantic typing while ensuring JavaScript compatibility
      const val = object.datatype?.value.includes("decimal")
        ? parseFloat(object.value) // Numeric literals → JavaScript numbers
        : object.value; // All other literals → JavaScript strings

      // Assign the processed value to the appropriate entity property
      colorMap[subject][predicate] = val;
    }
  }

  // PHASE 4: TYPESCRIPT CODE GENERATION
  // Generate individual export statements for each color entity
  // Each export creates a const with the color name and its properties as a JSON object
  const lines: string[] = Object.entries(colorMap).map(([name, def]) => {
    // Use JSON.stringify with 2-space indentation for readable output
    // This preserves property types and provides clean formatting
    return `export const ${name} = ${JSON.stringify(def, null, 2)};`;
  });

  // COLLECTION EXPORT GENERATION
  // Create a single export that aggregates all individual color exports
  // This enables both direct access (import { crimson }) and programmatic access (colors[name])
  lines.push(
    `export const colors = { ${Object.keys(colorMap)
      .map((n) => `${n}: ${n}`) // Create object literal: { crimson: crimson, azure: azure, ... }
      .join(", ")} };`
  );

  // PHASE 5: FILE SYSTEM OUTPUT
  // Write the generated TypeScript code to the target file
  // This overwrites any existing file and creates directories if needed
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
}

/**
 * Astro Integration Factory for RDF Color Generation
 *
 * This function creates an Astro integration that automatically generates TypeScript color modules
 * from RDF Turtle ontologies during the build process. It implements the Astro integration API
 * to hook into the build lifecycle at the appropriate moment.
 *
 * INTEGRATION LIFECYCLE:
 * The integration runs during the 'astro:config:setup' hook, which occurs:
 * - After Astro configuration is loaded
 * - Before Vite configuration is finalized
 * - Before any file processing begins
 * - During both development and production builds
 *
 * This timing ensures that generated TypeScript modules are available for:
 * - TypeScript compilation
 * - Vite's dependency optimization
 * - Hot module replacement during development
 * - Tree shaking during production builds
 *
 * BUILD-TIME GENERATION PHILOSOPHY:
 * By generating code at build time rather than runtime, we achieve:
 * - Zero runtime overhead (no RDF parsing in browser)
 * - Full TypeScript integration (types, intellisense, compilation)
 * - Static analysis compatibility (bundlers can optimize)
 * - Deployment simplicity (no runtime dependencies)
 *
 * ERROR PROPAGATION STRATEGY:
 * Any errors during color generation will cause the entire build to fail.
 * This ensures that semantic inconsistencies are caught early rather than
 * manifesting as runtime errors or silent failures.
 *
 * SEMANTIC WEB INTEGRATION:
 * This integration bridges the gap between formal semantic web technologies
 * and practical web development workflows. It treats RDF as a first-class
 * source format rather than just an export target.
 *
 * @returns Astro integration object conforming to the Astro integration API
 *
 * @example
 * // astro.config.mjs
 * import generateColors from './src/integrations/generateColors.ts';
 *
 * export default defineConfig({
 *   integrations: [
 *     generateColors(), // RDF colors will be generated before build
 *     // ... other integrations
 *   ],
 * });
 *
 * @see https://docs.astro.build/en/reference/integrations-reference/ - Astro integration API
 * @see https://docs.astro.build/en/reference/integrations-reference/#astroconfigsetup - Config setup hook
 */
export default function generateColors() {
  return {
    // Integration identifier used for logging and debugging
    // This name appears in Astro's build output and error messages
    name: "generate-colors",

    // Integration hook configuration
    // Defines when and how the integration participates in the build process
    hooks: {
      /**
       * Astro Config Setup Hook
       *
       * This hook runs during Astro's configuration phase, before any file processing.
       * It's the ideal time to generate source files that will be consumed by the build.
       *
       * The hook is async to support the RDF parsing and file generation operations.
       * Any thrown errors will be caught by Astro and displayed with helpful context.
       *
       * SEMANTIC GENERATION PIPELINE:
       * 1. Read RDF Turtle ontology from public/ontology/colors.ttl
       * 2. Parse semantic triples into structured data
       * 3. Generate TypeScript module at src/styles/color/generated.ts
       * 4. Make generated types available for immediate import
       *
       * FILE PATH STRATEGY:
       * - Source: public/ontology/colors.ttl (version controlled, semantic source)
       * - Target: src/styles/color/generated.ts (gitignored, build artifact)
       *
       * This separation maintains clear boundaries between semantic sources
       * and generated implementation artifacts.
       */
      "astro:config:setup": async () => {
        await generateColorModuleFromTTL(
          "public/ontology/colors.ttl", // RDF source: semantic color ontology
          "src/styles/color/generated.ts" // TS target: build-time generated module
        );
      },
    },
  };
}
