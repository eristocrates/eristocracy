// 🚨 EMERGENCY PERFORMANCE DEBUG UTILITY
// Add this to your ForceGraph3D component for immediate diagnosis

export
  const PerformanceDebugger = {
    // 1. Scene Analysis - Check what's actually being rendered
    analyzeScene: (scene) => {
      console.log('🔍 SCENE ANALYSIS:');
      console.log('  Total children:', scene.children.length);

      scene.traverse((obj) => {
        if (obj.type === 'InstancedMesh') {
          console.log('  ✅ InstancedMesh found:', obj.count, 'instances');
        } else if (obj.type === 'Mesh') {
          console.log('  ❌ Individual Mesh found:', obj.name || 'unnamed');
        } else if (obj.type === 'LineSegments') {
          console.log('  📏 LineSegments found');
        }
      });
    },

    // 2. Draw Call Monitor - WebGL context inspection
    monitorDrawCalls: (renderer) => {
      const gl = renderer.getContext();
      const originalDrawElements = gl.drawElements;
      const originalDrawArrays = gl.drawArrays;
      let drawCallCount = 0;

      gl.drawElements = function (...args) {
        drawCallCount++;
        return originalDrawElements.apply(this, args);
      };

      gl.drawArrays = function (...args) {
        drawCallCount++;
        return originalDrawArrays.apply(this, args);
      };

      // Reset counter and report every second
      setInterval(() => {
        console.log('🎯 Draw calls/sec:', drawCallCount);
        drawCallCount = 0;
      }, 1000);
    },

    // 3. Force-graph-3d Override Verification
    verifyOverrides: (graphRef) => {
      if (!graphRef.current) return;

      const graph = graphRef.current;
      console.log('🔧 FORCE-GRAPH-3D OVERRIDES:');
      console.log('  nodeThreeObject is null:', graph.nodeThreeObject()() === null);
      console.log('  linkThreeObject is null:', graph.linkThreeObject()() === null);
      console.log('  nodeThreeObjectExtend:', graph.nodeThreeObjectExtend());
      console.log('  linkThreeObjectExtend:', graph.linkThreeObjectExtend());
    },

    // 4. Instance Buffer Validation
    validateInstanceBuffers: (instancedNodesRef, instancedLinksRef) => {
      console.log('📊 INSTANCE BUFFER VALIDATION:');

      if (instancedNodesRef.current) {
        console.log('  ✅ Nodes InstancedMesh exists');
        console.log('    Instance count:', instancedNodesRef.current.count);
        console.log('    In scene:', instancedNodesRef.current.parent !== null);
        console.log('    Visible:', instancedNodesRef.current.visible);
      } else {
        console.log('  ❌ Nodes InstancedMesh is NULL');
      }

      if (instancedLinksRef.current) {
        console.log('  ✅ Links geometry exists');
        console.log('    In scene:', instancedLinksRef.current.parent !== null);
        console.log('    Visible:', instancedLinksRef.current.visible);
      } else {
        console.log('  ❌ Links geometry is NULL');
      }
    }
  };

// 🚀 IMMEDIATE DEBUG ACTIVATION
// Add this useEffect to your ForceGraph3D component:

useEffect(() => {
  if (!graphRef.current?.renderer()) return;

  console.log('🚨 EMERGENCY PERFORMANCE DEBUG ACTIVATED');

  const scene = graphRef.current.scene();
  const renderer = graphRef.current.renderer();

  // Run all diagnostics
  PerformanceDebugger.analyzeScene(scene);
  PerformanceDebugger.monitorDrawCalls(renderer);
  PerformanceDebugger.verifyOverrides(graphRef);
  PerformanceDebugger.validateInstanceBuffers(instancedNodesRef, instancedLinksRef);

  // Check every 5 seconds if instancing is actually working
  const interval = setInterval(() => {
    PerformanceDebugger.analyzeScene(scene);
    PerformanceDebugger.validateInstanceBuffers(instancedNodesRef, instancedLinksRef);
  }, 5000);

  return () => clearInterval(interval);
}, [graphRef.current?.renderer()]);
