# Semantic Naming Guide for Affordance Methods

## Overview

This guide establishes **conceptual boundaries** and **semantic precision** for affordance method naming to eliminate ambiguity and ensure **cognitive clarity**.

## Core Semantic Principles

### **1. Semantic Scope Clarity**

Each method name must indicate:

- **What domain** it operates in (data, visual, spatial, etc.)
- **What transformation** it performs
- **What semantic level** it preserves or changes

### **2. Cognitive Function Mapping**

Method names map directly to **cognitive functions**:

- `ingest` = **cognitive input processing**
- `transform` = **semantic transformation while preserving meaning**
- `map` = **property binding with semantic correspondence**
- `bind` = **final attachment to visualization target**

## Method Semantic Definitions

### **DataAffordance Methods**

#### `ingest(dataSource: DataSource): Promise<RawData>`

**Semantic Scope**: Data input processing
**Cognitive Function**: "Bring external data into the affordance's cognitive domain"
**Distinguishing Features**:

- **Input**: External data source (URI, file, stream)
- **Output**: Raw data in affordance-managed format
- **Semantic Preservation**: Complete (no transformation)
- **Side Effects**: Caching, metrics updates
- **Not Confused With**:
  - `transform` (no semantic change here)
  - `load` (too generic)
  - `fetch` (implies HTTP specificity)

#### `transform(data: RawData, pipeline: TransformPipeline): Promise<TransformedData>`

**Semantic Scope**: Data structure modification
**Cognitive Function**: "Change data structure while preserving semantic meaning"
**Distinguishing Features**:

- **Input**: Raw or partially processed data
- **Output**: Structurally modified but semantically equivalent data
- **Semantic Preservation**: Complete semantic meaning preserved
- **Side Effects**: None (pure transformation)
- **Not Confused With**:
  - `map` (property-level, not structural)
  - `process` (too generic)
  - `convert` (implies format change)

#### `map(data: TransformedData, mappings: PropertyMapping[]): MappedData`

**Semantic Scope**: Property-level semantic binding
**Cognitive Function**: "Create semantic correspondences between source and target properties"
**Distinguishing Features**:

- **Input**: Transformed data + semantic mapping rules
- **Output**: Data with properties mapped to target schema
- **Semantic Preservation**: **Controlled semantic transformation** (may change property names but preserves meaning)
- **Side Effects**: None (pure mapping)
- **Not Confused With**:
  - `transform` (structural vs property-level)
  - `project` (mathematical connotation)
  - `translate` (language connotation)

#### `bind(data: MappedData, target: VisualizationTarget): void`

**Semantic Scope**: Visualization system integration
**Cognitive Function**: "Attach processed data to specific visualization instance"
**Distinguishing Features**:

- **Input**: Fully mapped data + visualization target
- **Output**: None (side effect: data attachment)
- **Semantic Preservation**: Complete (no further transformation)
- **Side Effects**: Event emission, target validation
- **Not Confused With**:
  - `attach` (too physical)
  - `connect` (networking connotation)
  - `assign` (variable assignment connotation)

## Semantic Disambiguation Matrix

| Method      | Domain          | Level         | Semantic Change | Side Effects | Conceptual Metaphor      |
| ----------- | --------------- | ------------- | --------------- | ------------ | ------------------------ |
| `ingest`    | Data Input      | Source→System | None            | Caching      | "Eating/Absorbing"       |
| `transform` | Data Structure  | Structure     | None            | None         | "Shape Change"           |
| `map`       | Data Properties | Property      | Controlled      | None         | "Translation Dictionary" |
| `bind`      | Visualization   | System        | None            | Events       | "Attachment/Connection"  |

## Alternative Names Considered and Rejected

### **For `ingest`**

- ❌ `load` - Too generic, doesn't convey semantic specificity
- ❌ `fetch` - HTTP-specific connotation
- ❌ `import` - Programming language specific
- ✅ `ingest` - Biological metaphor, clear input processing

### **For `transform`**

- ❌ `process` - Too generic
- ❌ `convert` - Implies format change rather than structure
- ❌ `modify` - Implies mutation
- ✅ `transform` - Mathematical precision, semantic preservation implied

### **For `map`**

- ❌ `project` - Mathematical/geometric connotation
- ❌ `translate` - Language/movement connotation
- ❌ `correlate` - Statistical connotation
- ✅ `map` - Clear correspondence between domains

### **For `bind`**

- ❌ `attach` - Too physical/mechanical
- ❌ `connect` - Network/connection connotation
- ❌ `link` - Too abstract
- ✅ `bind` - Programming concept, clear semantic attachment

## Contextual Disambiguation Strategies

### **1. Type-Based Disambiguation**

```typescript
// Clear from types what domain each method operates in
ingest(dataSource: DataSource): Promise<RawData>
transform(data: RawData, pipeline: TransformPipeline): Promise<TransformedData>
map(data: TransformedData, mappings: PropertyMapping[]): MappedData
bind(data: MappedData, target: VisualizationTarget): void
```

### **2. Documentation-Based Disambiguation**

```typescript
/**
 * @semantic_scope Data property correspondence
 * @cognitive_function Create semantic mappings between source and target schemas
 * @preserves_meaning Yes - property names may change, semantic meaning preserved
 * @not_confused_with transform (structural), project (mathematical), translate (linguistic)
 */
map(data: TransformedData, mappings: PropertyMapping[]): MappedData
```

### **3. Usage Pattern Disambiguation**

```typescript
// Clear semantic progression in usage
const rawData = await dataAffordance.ingest(source); // Input processing
const structured = await dataAffordance.transform(rawData, pipeline); // Structure change
const mapped = dataAffordance.map(structured, mappings); // Property correspondence
dataAffordance.bind(mapped, visualizationTarget); // Visualization attachment
```

## Semantic Consistency Rules

### **1. Method Naming Constraints**

- **No overloaded meanings**: Each method name has exactly one semantic interpretation
- **Domain specificity**: Methods clearly indicate their domain of operation
- **Cognitive mapping**: Method names map to recognizable cognitive functions
- **No false friends**: Avoid names that suggest different semantics in other contexts

### **2. Parameter Naming Constraints**

- **Source/Target clarity**: Parameters clearly indicate data flow direction
- **Semantic type names**: `PropertyMapping` not `Mapping`, `DataSource` not `Source`
- **Cognitive role indication**: Parameter names indicate their cognitive role

### **3. Return Type Constraints**

- **Semantic progression**: Return types indicate semantic progression through pipeline
- **State indication**: Types indicate what transformations have been applied
- **Composability**: Return types can be chained through semantic pipeline

## Future Method Naming

When adding new methods to affordances:

1. **Check semantic overlap** with existing methods
2. **Verify cognitive function mapping**
3. **Test for disambiguation** in usage context
4. **Document semantic boundaries** explicitly
5. **Add to this guide** with rationale

## Cross-Affordance Semantic Consistency

Method names should be **semantically consistent across affordances**:

- `SpatialAffordance.transform()` should preserve semantic meaning while changing spatial properties
- `VisualAffordance.map()` should create property correspondences for visual properties
- `PerformanceAffordance.bind()` should attach optimization strategies to rendering targets

**Semantic coherence across the entire affordance system maintains cognitive sovereignty.**
