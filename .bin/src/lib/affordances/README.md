# Compositional Affordance Architecture

## Overview

This directory contains the implementation of **visualization-agnostic compositional affordances** - a semantic framework for building modular, recomposable visualization systems that maintain epistemic transparency and cognitive sovereignty.

## Architecture Principles

### 🧠 **Cognitive-First Design**

- Each affordance represents a **cognitive function** rather than a technical component
- **Semantic addressability**: Every behavior has a clear conceptual address
- **Epistemic transparency**: All operations are inspectable and explainable
- **Compositional modularity**: Affordances can be independently configured and combined

### 🔗 **Visualization-Agnostic Foundation**

- **No visualization lock-in**: Affordances work across 3D force graphs, 2D networks, scatter plots, etc.
- **Engine abstraction**: Support for Three.js, D3.js, Canvas, WebGPU, and custom renderers
- **Format independence**: RDF, JSON, CSV, real-time streams, and custom data sources
- **Semantic preservation**: Data transformations maintain meaning across visualization types

## Implementation Status

### ✅ **Phase 1: Foundation Complete**

- [x] **AffordanceContract system** - TypeScript interfaces with RDF annotation scaffolding
- [x] **DataAffordance implementation** - Complete with Valtio state management
- [x] **RDF vocabulary definitions** - Semantic ontology for affordance composition
- [x] **Demonstration integration** - Working example with existing systems

### 🔲 **Phase 2: Expansion (Ready for Implementation)**

- [ ] **VisualAffordance** - Material, geometry, and rendering abstraction
- [ ] **SpatialAffordance** - Coordinate systems and navigation
- [ ] **PerformanceAffordance** - Integration with existing optimization work
- [ ] **VisualizationComposer** - Dynamic affordance orchestration

## Directory Structure

```
src/lib/affordances/
├── types/
│   └── AffordanceContract.ts      # Core type definitions and interfaces
├── DataAffordance.ts              # Data ingestion, transformation, binding
├── vocabulary/
│   └── affordances.ttl           # RDF semantic definitions
└── README.md                     # This documentation
```

## Core Components

### **AffordanceContract System**

The foundational type system that ensures compositional safety:

```typescript
interface AffordanceContract<TCapabilities, TState, TMethods> {
  capabilities: TCapabilities[]; // What this affordance can do
  invariants: BehavioralInvariant; // What must remain consistent
  state: TState; // Configurable state properties
  methods: TMethods; // Externally callable functions
  affordanceId: string; // Unique semantic identifier
}
```

### **DataAffordance Implementation**

Complete data processing pipeline with semantic preservation:

- **Ingestion**: RDF, JSON, CSV, streams, APIs
- **Transformation**: Configurable pipeline with validation
- **Mapping**: Property transformation with type safety
- **Binding**: Visualization-agnostic data binding
- **Caching**: Performance optimization with TTL
- **Metrics**: Processing performance tracking

### **RDF Vocabulary**

Semantic definitions enabling:

- **Capability discovery**: `affordance:hasCapability`
- **Invariant validation**: `affordance:hasInvariant`
- **Composition rules**: `affordance:hasCompositionRules`
- **Cognitive functions**: `affordance:hasCognitiveFunction`

## Usage Examples

### **Basic DataAffordance Usage**

```typescript
import { createDataAffordance } from "./affordances/DataAffordance.js";

// Create affordance instance
const dataAffordance = createDataAffordance({
  cacheEnabled: true,
  metricsEnabled: true,
});

// Configure data source
const dataSource = {
  type: "rdf",
  uri: "/api/graph-data/arcaea-one.ttl",
  format: "turtle",
};

// Ingest and transform data
const rawData = await dataAffordance.contract.methods.ingest(dataSource);
const mappedData = dataAffordance.contract.methods.map(
  rawData,
  propertyMappings
);

// Bind to visualization
const target = { type: "force_graph", expectedFormat: "nodes_links" };
dataAffordance.contract.methods.bind(mappedData, target);
```

### **Astro Component Integration**

```astro
---
// Import the demonstration component
import DataVisualization from '../components/affordance/DataVisualization.astro';
---

<DataVisualization
  dataSource="/api/graph-data/arcaea-one.ttl"
  visualizationType="force_graph"
  style="width: 100%; height: 600px;"
/>
```

### **Semantic Introspection**

```typescript
// Runtime inspection of affordance behavior
const inspection = dataAffordance.inspect();
console.log("Active capabilities:", inspection.activeCapabilities);
console.log("Invariant status:", inspection.invariantStatus);
console.log("State snapshot:", inspection.stateSnapshot);
```

## Integration with Existing Systems

### **Valtio State Management**

- **Central state store**: Affordances as atomized state branches
- **Reactive binding**: State changes automatically propagate
- **Introspection**: All state is transparently observable

### **KapsuleWrapper Compatibility**

- **Seamless integration**: Affordances work with existing Kapsule components
- **Event-driven**: Data binding via custom events
- **Non-disruptive**: No changes required to existing visualization code

### **RDF Pipeline Integration**

- **Hybrid approach**: Wraps existing `graph-data.json.ts` logic
- **Semantic preservation**: Maintains RDF semantics through transformations
- **Performance**: Leverages existing caching and optimization

## Design Patterns

### **Compositional Modularity**

```typescript
// Affordances can be combined without coupling
const composition = {
  data: createDataAffordance(dataConfig),
  spatial: createSpatialAffordance(spatialConfig),
  visual: createVisualAffordance(visualConfig),
};
```

### **Semantic Transparency**

```typescript
// Every affordance exposes its complete state and behavior
affordance.inspect(); // Current state and capabilities
affordance.validate(); // Invariant compliance
affordance.reconfigure(changes); // Safe state updates
```

### **Visualization Independence**

```typescript
// Same data affordance works across visualization types
dataAffordance.bind(data, { type: "force_graph" });
dataAffordance.bind(data, { type: "scatter_plot" });
dataAffordance.bind(data, { type: "network_diagram" });
```

## Performance Considerations

### **Optimization Integration**

- **Existing work preservation**: Performance optimizations from `ForceGraph3D.jsx` can be integrated as `PerformanceAffordance`
- **Instancing support**: GPU instancing patterns fit naturally into `RendererAffordance`
- **Adaptive quality**: Dynamic LOD becomes part of `SpatialAffordance`

### **Caching Strategy**

- **Multi-level caching**: Source data, transformed data, and visualization state
- **TTL management**: Configurable cache expiration
- **Cache coherence**: Automatic invalidation on source changes

## Future Directions

### **Visual Programming Integration**

- **React-Flow composition**: Affordances as visual nodes
- **Parameter binding**: Direct manipulation of affordance properties
- **Pipeline visualization**: See data flow through transformation steps

### **Semantic Reasoning**

- **SPARQL queries**: Query affordance capabilities and compositions
- **Rule-based composition**: Automatic affordance selection based on constraints
- **Constraint satisfaction**: Automatic parameter optimization

### **Multi-Modal Visualization**

- **AR/VR support**: Spatial affordances for immersive environments
- **Real-time streaming**: Temporal affordances for live data
- **Collaborative editing**: Shared affordance state across users

## Contributing

When extending the affordance system:

1. **Follow the contract pattern**: All affordances must implement `AffordanceContract`
2. **Maintain semantic annotations**: Use `@rdf:` comments for extraction
3. **Preserve compositionality**: Affordances must be independently configurable
4. **Document cognitive function**: Explain the conceptual role of each affordance
5. **Test introspection**: Ensure `inspect()` and `validate()` work correctly

## Semantic Web Integration

This architecture represents visualization behavior as **semantic entities** that can be:

- **Queried** using SPARQL
- **Composed** using RDF rules
- **Shared** across applications
- **Reasoned about** automatically
- **Validated** against constraints

The affordance system bridges the gap between **human cognitive models** and **machine-executable specifications**, enabling true **cognitive sovereignty** in visualization design.
