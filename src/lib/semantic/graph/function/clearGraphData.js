/**
 * @file clearGraphData.js
 * @description Atomic function: Properly clears ForceGraph3D data and Three.js objects
 * @affordance:GraphRenderer
 * @method:clearGraphData
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Completely clears a ForceGraph3D instance of all data and objects
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} config - Cleanup configuration
 * @returns {Object} Cleanup result
 */
export function clearGraphData(graph, config = {}) {
  logAffordanceExecution('GraphRenderer', 'clearGraphData', {
    hasGraph: !!graph
  });

  if (!graph) {
    throw new Error('clearGraphData: graph instance is required');
  }

  // Verify graph is properly initialized
  if (typeof graph.graphData !== 'function') {
    console.warn('Graph instance not fully initialized, skipping clear operation');
    return {
      cleared: false,
      clearTime: 0,
      error: 'Graph not fully initialized'
    };
  }

  const {
    resetCamera = true,
    clearSelection = true,
    stopSimulation = true,
    clearScene = true
  } = config;

  const startTime = performance.now();

  try {
    // Don't interfere with force simulation - let ForceGraph3D handle it
    // The stopSimulation parameter is preserved for API compatibility but ignored

    // Clear existing data
    try {
      graph.graphData({ nodes: [], links: [] });
    } catch (dataError) {
      console.warn('Could not clear graph data:', dataError.message);
    }

    // Clear any selections or highlights
    if (clearSelection) {
      try {
        // Clear selections using correct ForceGraph3D API
        if (typeof graph.highlightNodes === 'function') {
          graph.highlightNodes([]);
        }
        if (typeof graph.highlightLinks === 'function') {
          graph.highlightLinks([]);
        }
      } catch (selectionError) {
        console.warn('Could not clear selections:', selectionError.message);
      }
    }

    // Reset camera position if requested
    if (resetCamera) {
      resetCameraPosition(graph);
    }

    // Clear Three.js scene objects if requested
    if (clearScene) {
      clearThreeJSObjects(graph);
    }

    // Force a render update
    try {
      graph.refresh();
    } catch (refreshError) {
      console.warn('Could not refresh graph:', refreshError.message);
    }

    const clearTime = Math.round(performance.now() - startTime);

    return {
      cleared: true,
      clearTime,
      operations: {
        resetCamera,
        clearSelection,
        stopSimulation,
        clearScene
      }
    };

  } catch (error) {
    console.error('Failed to clear graph data:', error);
    throw error;
  }
}

/**
 * Resets camera to default position
 * @param {Object} graph - ForceGraph3D instance
 */
function resetCameraPosition(graph) {
  try {
    const camera = graph.camera();
    if (camera) {
      // Gently move camera to a good starting position
      camera.position.set(300, 300, 300);
      camera.lookAt(0, 0, 0);
    }

    // DON'T reset controls - this breaks mouse navigation!
    // The controls should remain functional for user interaction
  } catch (error) {
    console.warn('Could not reset camera position:', error);
  }
}

/**
 * Clears custom Three.js objects from the scene
 * @param {Object} graph - ForceGraph3D instance
 */
function clearThreeJSObjects(graph) {
  try {
    const scene = graph.scene();
    if (!scene) return;

    let totalRemoved = 0;
    const removalLog = [];

    // Find and remove all non-essential objects
    const objectsToRemove = [];

    scene.traverse((object) => {
      let shouldRemove = false;
      let reason = '';

      // Remove instanced meshes (our optimizations)
      if (object.isInstancedMesh) {
        shouldRemove = true;
        reason = 'InstancedMesh';
      }

      // Remove points objects (our ultra-performance mode)
      else if (object.isPoints) {
        // Remove all Points objects, not just custom ones
        shouldRemove = true;
        reason = 'Points object';
      }

      // Remove any objects with performance optimization userData
      else if (object.userData?.isPerformanceOptimization) {
        shouldRemove = true;
        reason = 'Performance optimization';
      }

      // Remove any objects that look like they're from three-perf
      else if (object.userData?.threePerf || object.name?.includes('perf')) {
        shouldRemove = true;
        reason = 'Three-perf object';
      }

      // Remove any objects with suspicious names that might be leftovers
      else if (object.name && (
        object.name.includes('instance') ||
        object.name.includes('optimization') ||
        object.name.includes('performance')
      )) {
        shouldRemove = true;
        reason = 'Suspicious name';
      }

      if (shouldRemove) {
        objectsToRemove.push({ object, reason });
      }
    });

    // Remove the objects and log details
    objectsToRemove.forEach(({ object, reason }) => {
      if (object.parent) {
        object.parent.remove(object);
        totalRemoved++;
        removalLog.push(`${reason}: ${object.type || 'Unknown'}`);
      }

      // Dispose of geometry and materials more thoroughly
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material.dispose) material.dispose();
          });
        } else if (object.material.dispose) {
          object.material.dispose();
        }
      }

      // Clear any textures
      if (object.material?.map) {
        object.material.map.dispose();
      }
    });

    // Also clear the renderer's info for good measure
    const renderer = graph.renderer();
    if (renderer && renderer.info) {
      renderer.info.reset();
    }

    console.log(`🧹 Cleared ${totalRemoved} objects:`, removalLog);

    // Force garbage collection hint
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }

  } catch (error) {
    console.warn('Could not clear Three.js objects:', error);
  }
}

/**
 * Forces a complete refresh of the graph visualization
 * @param {Object} graph - ForceGraph3D instance
 */
export function refreshGraphVisualization(graph) {
  logAffordanceExecution('GraphRenderer', 'refreshGraphVisualization');

  if (!graph) return;

  try {
    // Simple refresh - let ForceGraph3D handle the simulation
    graph.refresh();

    // Ensure animation is active
    graph.resumeAnimation();

    // Trigger a camera reset after a brief delay
    setTimeout(() => {
      try {
        graph.zoomToFit(1000);
      } catch (zoomError) {
        console.warn('Could not zoom to fit:', zoomError.message);
      }
    }, 100);

    console.log('🔄 Graph visualization refreshed');

  } catch (error) {
    console.warn('Could not refresh graph visualization:', error);
  }
} 