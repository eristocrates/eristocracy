/**
 * Affordance System Validator
 * Framework-independent validation of semantic consistency, invariant compliance, and compositional safety
 * Can be integrated with any testing framework or run manually for validation
 */

import { createDataAffordance } from "../DataAffordance.js";
import type {
  DataSource,
  PropertyMapping,
  VisualizationTarget,
} from "../DataAffordance.js";

export interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface ValidationSuite {
  suiteName: string;
  results: ValidationResult[];
  passed: boolean;
  summary: string;
}

/**
 * Core Affordance Validator
 * Validates that affordance implementations comply with semantic contracts
 */
export class AffordanceValidator {
  private results: ValidationResult[] = [];

  constructor(private affordance?: ReturnType<typeof createDataAffordance>) {
    this.affordance = affordance || createDataAffordance({ testMode: true });
  }

  private assert(
    condition: boolean,
    testName: string,
    message: string,
    details?: any
  ): void {
    this.results.push({
      testName,
      passed: condition,
      message: condition ? `✅ ${message}` : `❌ ${message}`,
      details,
    });
  }

  private assertEqual<T>(
    actual: T,
    expected: T,
    testName: string,
    message: string
  ): void {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    this.assert(passed, testName, message, { actual, expected });
  }

  /**
   * Validate Semantic Consistency Invariant
   * "Affordance behavior remains semantically consistent across reconfigurations"
   */
  validateSemanticConsistency(): ValidationSuite {
    const suiteResults: ValidationResult[] = [];

    // Test 1: Affordance identity preservation
    const initialInspection = this.affordance!.inspect();
    this.affordance!.reconfigure({ loading: false, error: null });
    const postReconfigInspection = this.affordance!.inspect();

    this.assertEqual(
      postReconfigInspection.activeCapabilities,
      initialInspection.activeCapabilities,
      "identity_preservation",
      "Capabilities remain consistent across reconfigurations"
    );

    this.assertEqual(
      this.affordance!.contract.affordanceId,
      "DataAffordance",
      "affordance_id_consistency",
      "Affordance ID remains stable"
    );

    // Test 2: Capability surface immutability
    const originalCapabilities = [...this.affordance!.contract.capabilities];
    this.affordance!.reconfigure({ loading: true });

    this.assertEqual(
      this.affordance!.contract.capabilities,
      originalCapabilities,
      "capability_immutability",
      "Capabilities are immutable regardless of state changes"
    );

    return this.createSuite("Semantic Consistency", this.results.slice(-3));
  }

  /**
   * Validate Compositional Safety Invariant
   * "Affordance compositions do not violate individual affordance invariants"
   */
  validateCompositionalSafety(): ValidationSuite {
    const suiteResults: ValidationResult[] = [];

    // Test 1: Complete introspection interface
    const inspection = this.affordance!.inspect();

    this.assert(
      "activeCapabilities" in inspection,
      "introspection_completeness_1",
      "Inspection exposes activeCapabilities"
    );

    this.assert(
      "stateSnapshot" in inspection,
      "introspection_completeness_2",
      "Inspection exposes stateSnapshot"
    );

    this.assert(
      "invariantStatus" in inspection,
      "introspection_completeness_3",
      "Inspection exposes invariantStatus"
    );

    // Test 2: Validation interface completeness
    const validation = this.affordance!.validate();

    this.assert(
      typeof validation.isValid === "boolean",
      "validation_interface_1",
      "Validation returns boolean isValid"
    );

    this.assert(
      Array.isArray(validation.violations),
      "validation_interface_2",
      "Validation returns violations array"
    );

    return this.createSuite("Compositional Safety", this.results.slice(-5));
  }

  /**
   * Validate Data Integrity Invariant
   * "Data transformations preserve semantic meaning"
   */
  validateDataIntegrity(): ValidationSuite {
    const suiteResults: ValidationResult[] = [];

    // Test 1: Semantic preservation through property mapping
    const testData = {
      nodes: [
        {
          id: "test:entity",
          label: "Test Entity",
          type: "http://example.org#Class",
        },
      ],
      links: [],
    };

    const mappings: PropertyMapping[] = [
      { sourceProperty: "id", targetProperty: "id", required: true },
      { sourceProperty: "label", targetProperty: "name" },
      {
        sourceProperty: "type",
        targetProperty: "group",
        transform: (type: string) => type.split("#").pop() || "unknown",
      },
    ];

    const mapped = this.affordance!.contract.methods.map(testData, mappings);

    this.assertEqual(
      mapped.nodes[0].id,
      "test:entity",
      "identity_preservation",
      "Entity identity preserved through mapping"
    );

    this.assertEqual(
      mapped.nodes[0].name,
      "Test Entity",
      "label_mapping",
      "Label correctly mapped to name"
    );

    this.assertEqual(
      mapped.nodes[0].group,
      "Class",
      "semantic_transformation",
      "Type transformed while preserving semantic meaning"
    );

    // Test 2: Referential consistency
    const referentialTestData = {
      nodes: [
        { id: "node1", label: "Node 1" },
        { id: "node2", label: "Node 2" },
      ],
      links: [{ source: "node1", target: "node2", predicate: "connects" }],
    };

    const referentialMappings: PropertyMapping[] = [
      { sourceProperty: "id", targetProperty: "id", required: true },
      { sourceProperty: "label", targetProperty: "name" },
    ];

    const referentialMapped = this.affordance!.contract.methods.map(
      referentialTestData,
      referentialMappings
    );
    const nodeIds = referentialMapped.nodes.map((n: any) => n.id);
    const link = referentialMapped.links[0];

    this.assert(
      nodeIds.includes(link.source) && nodeIds.includes(link.target),
      "referential_consistency",
      "Link references remain valid after transformation"
    );

    return this.createSuite("Data Integrity", this.results.slice(-4));
  }

  /**
   * Validate Type Safety Invariant
   * "Type contracts are maintained across transformation pipeline"
   */
  validateTypeSafety(): ValidationSuite {
    // Test 1: Required property enforcement
    try {
      const testData = { nodes: [{ label: "Missing ID" }], links: [] };
      const mappings: PropertyMapping[] = [
        { sourceProperty: "id", targetProperty: "id", required: true },
      ];

      this.affordance!.contract.methods.map(testData, mappings);

      this.assert(
        false,
        "required_property_enforcement",
        "Should throw error for missing required properties"
      );
    } catch (error) {
      this.assert(
        error instanceof Error && error.message.includes("Required property"),
        "required_property_enforcement",
        "Correctly enforces required property mappings"
      );
    }

    // Test 2: Data format validation
    try {
      const invalidData = { invalid: "structure" };
      const target: VisualizationTarget = {
        type: "force_graph",
        expectedFormat: "nodes_links",
        schema: { nodes: ["id"], links: ["source", "target"] },
      };

      this.affordance!.contract.methods.bind(invalidData, target);

      this.assert(
        false,
        "data_format_validation",
        "Should validate data format against visualization target"
      );
    } catch (error) {
      this.assert(
        error instanceof Error && error.message.includes("Data format"),
        "data_format_validation",
        "Correctly validates data format against target schema"
      );
    }

    return this.createSuite("Type Safety", this.results.slice(-2));
  }

  /**
   * Validate Cache Coherence Invariant
   * "Cached data remains synchronized with source data"
   */
  validateCacheCoherence(): ValidationSuite {
    // Test 1: Cache functionality
    this.affordance!.contract.methods.cache("test-key", { data: "test" });

    this.assert(
      this.affordance!.runtimeState.cache.has("test-key"),
      "cache_storage",
      "Data can be stored in cache"
    );

    // Test 2: Cache invalidation
    this.affordance!.contract.methods.invalidateCache("test-key");

    this.assert(
      !this.affordance!.runtimeState.cache.has("test-key"),
      "cache_invalidation",
      "Cache can be manually invalidated"
    );

    // Test 3: Complete cache clear
    this.affordance!.contract.methods.cache("test1", { data: "value1" });
    this.affordance!.contract.methods.cache("test2", { data: "value2" });
    this.affordance!.contract.methods.invalidateCache(); // Clear all

    this.assert(
      this.affordance!.runtimeState.cache.size === 0,
      "cache_clear_all",
      "All cache can be cleared"
    );

    return this.createSuite("Cache Coherence", this.results.slice(-3));
  }

  /**
   * Run complete validation suite
   */
  runCompleteValidation(): {
    suites: ValidationSuite[];
    overallPassed: boolean;
    summary: string;
  } {
    this.results = []; // Reset results

    const suites = [
      this.validateSemanticConsistency(),
      this.validateCompositionalSafety(),
      this.validateDataIntegrity(),
      this.validateTypeSafety(),
      this.validateCacheCoherence(),
    ];

    const totalTests = suites.reduce(
      (sum, suite) => sum + suite.results.length,
      0
    );
    const passedTests = suites.reduce(
      (sum, suite) => sum + suite.results.filter((r) => r.passed).length,
      0
    );
    const overallPassed = passedTests === totalTests;

    return {
      suites,
      overallPassed,
      summary: `${passedTests}/${totalTests} tests passed. ${
        overallPassed
          ? "✅ All invariants satisfied"
          : "❌ Some invariants violated"
      }`,
    };
  }

  private createSuite(
    suiteName: string,
    results: ValidationResult[]
  ): ValidationSuite {
    const passed = results.every((r) => r.passed);
    const passedCount = results.filter((r) => r.passed).length;

    return {
      suiteName,
      results,
      passed,
      summary: `${suiteName}: ${passedCount}/${results.length} tests passed`,
    };
  }
}

/**
 * Convenience function for running validation
 */
export function validateAffordanceSystem(): {
  suites: ValidationSuite[];
  overallPassed: boolean;
  summary: string;
} {
  const validator = new AffordanceValidator();
  return validator.runCompleteValidation();
}

/**
 * Console-friendly validation runner
 */
export function runAffordanceValidation(): void {
  console.log("🔍 Running Affordance System Validation...\n");

  const results = validateAffordanceSystem();

  results.suites.forEach((suite) => {
    console.log(`📋 ${suite.suiteName}:`);
    suite.results.forEach((result) => {
      console.log(`  ${result.message}`);
      if (!result.passed && result.details) {
        console.log(`    Details:`, result.details);
      }
    });
    console.log(`  Summary: ${suite.summary}\n`);
  });

  console.log(`🎯 Overall Result: ${results.summary}`);

  if (!results.overallPassed) {
    console.log(
      "\n⚠️  Some invariants are violated. Check the results above for details."
    );
  } else {
    console.log("\n🎉 All affordance invariants are satisfied!");
  }
}
