/**
 * @file forceCleanup.js
 * @description Nuclear cleanup function for debugging ghost objects
 * @affordance:GraphRenderer
 * @method:forceCleanup
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Nuclear cleanup function - removes ALL non-essential objects from scene
 * @param {Object} graph - ForceGraph3D instance
 * @returns {Object} Cleanup report
 */
export function forceCleanup(graph) {
  logAffordanceExecution('GraphRenderer', 'forceCleanup', { hasGraph: !!graph });

  if (!graph) {
    throw new Error('forceCleanup: graph instance is required');
  }

  console.log('💥 NUCLEAR CLEANUP INITIATED');

  const report = {
    removedObjects: [],
    totalRemoved: 0,
    errors: []
  };

  try {
    const scene = graph.scene();
    if (!scene) {
      console.warn('No scene available for cleanup');
      return report;
    }

    // Get all objects first
    const allObjects = [];
    scene.traverse((object) => {
      allObjects.push(object);
    });

    console.log(`🔍 Found ${allObjects.length} total objects in scene`);

    // Essential objects that should NOT be removed
    const essentialTypes = new Set([
      'Scene',
      'PerspectiveCamera',
      'OrthographicCamera',
      'AmbientLight',
      'DirectionalLight',
      'WebGLRenderer'
    ]);

    // Remove everything else
    allObjects.forEach((object, index) => {
      const isEssential = essentialTypes.has(object.type) ||
        object === scene ||
        object.isCamera ||
        object.isLight && !object.userData?.isCustom;

      if (!isEssential) {
        try {
          if (object.parent && object.parent !== scene) {
            object.parent.remove(object);
          } else if (object.parent === scene && object !== scene) {
            scene.remove(object);
          }

          // Dispose resources
          if (object.geometry) {
            object.geometry.dispose();
          }

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose && mat.dispose());
            } else if (object.material.dispose) {
              object.material.dispose();
            }
          }

          if (object.texture) {
            object.texture.dispose();
          }

          report.removedObjects.push({
            type: object.type,
            name: object.name || 'unnamed',
            uuid: object.uuid,
            index
          });
          report.totalRemoved++;

        } catch (error) {
          report.errors.push({
            object: object.type,
            error: error.message
          });
        }
      }
    });

    // Clear renderer info
    const renderer = graph.renderer();
    if (renderer) {
      if (renderer.info) {
        renderer.info.reset();
      }
      renderer.clear();
      console.log('🔄 Renderer cleared');
    }

    // Force garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
      console.log('🗑️ Garbage collection triggered');
    }

    console.log(`💥 NUCLEAR CLEANUP COMPLETE: ${report.totalRemoved} objects removed`);
    console.log('📊 Removed objects by type:',
      report.removedObjects.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {})
    );

    if (report.errors.length > 0) {
      console.warn('⚠️ Cleanup errors:', report.errors);
    }

  } catch (error) {
    console.error('💥 Nuclear cleanup failed:', error);
    report.errors.push({ general: error.message });
  }

  return report;
}

/**
 * Inspector function to analyze what's in the scene
 * @param {Object} graph - ForceGraph3D instance
 * @returns {Object} Scene analysis
 */
export function inspectScene(graph) {
  if (!graph) return { error: 'No graph instance' };

  const scene = graph.scene();
  if (!scene) return { error: 'No scene available' };

  const analysis = {
    totalObjects: 0,
    objectsByType: {},
    suspiciousObjects: [],
    customObjects: []
  };

  scene.traverse((object) => {
    analysis.totalObjects++;

    const type = object.type || 'Unknown';
    analysis.objectsByType[type] = (analysis.objectsByType[type] || 0) + 1;

    // Flag suspicious objects
    if (object.name && (
      object.name.includes('instance') ||
      object.name.includes('perf') ||
      object.name.includes('optimization')
    )) {
      analysis.suspiciousObjects.push({
        type: object.type,
        name: object.name,
        uuid: object.uuid.substring(0, 8)
      });
    }

    // Flag custom objects
    if (object.userData && Object.keys(object.userData).length > 0) {
      analysis.customObjects.push({
        type: object.type,
        name: object.name || 'unnamed',
        userData: Object.keys(object.userData),
        uuid: object.uuid.substring(0, 8)
      });
    }
  });

  console.log('🔍 SCENE ANALYSIS:', analysis);
  return analysis;
} 