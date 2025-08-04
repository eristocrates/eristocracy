// Example usage of the enhanced performance monitoring system

/\*
The stats.js integration provides multiple layers of performance monitoring:

1. **Built-in Stats.js Panel** (top-right corner):

   - FPS (Frames Per Second)
   - MS (Milliseconds per frame)
   - MB (Memory usage)
   - Click to cycle between panels

2. **Custom Performance Monitor** (below stats panel):

   - Node/Link counts from ontology
   - WebGL draw calls (critical for performance)
   - Triangle count
   - Geometry/Texture memory usage
   - Color-coded warnings (red = high draw calls)

3. **Usage in Components**:

// Basic usage (stats enabled by default)
<SimpleThreeForceGraph 
  dataUrl="/api/graph-data/arcaea-one.ttl"
  enableStats={true}
/>

// Advanced usage with custom props
<ThreeForceGraph
dataUrl="/api/graph-data/arcaea.ttl"
enableStats={true}
inspect={true} // Also enable Spector.js WebGL debugger
cameraZ={150}
backgroundColor="#2a2a3a"
/>

4. **Performance Optimization Guidelines**:

- Keep draw calls under 1000 for good performance
- Monitor triangle count for complex geometries
- Watch memory usage with large ontologies
- Use the "inspect" prop to debug WebGL issues

5. **Astro Integration Notes**:

- Stats.js is dynamically imported (client-side only)
- Proper cleanup on component unmount
- TypeScript declarations included
- SSR-safe implementation

6. **Keyboard Shortcuts** (when stats panel is active):

- Click stats panel to cycle: FPS → MS → MB → Custom panels

\*/
