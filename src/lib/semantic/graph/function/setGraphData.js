/**
 * @file setGraphData.js
 * @description Atomic function: Sets graph data with validation
 * @affordance:GraphRenderer
 * @method:setGraphData
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';
import { clearGraphData, refreshGraphVisualization } from './clearGraphData.js';

/**
 * Sets graph data with validation and performance tracking
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} data - Graph data
 * @param {Array} data.nodes - Node array
 * @param {Array} data.links - Link array
 * @returns {Object} Performance metrics
 */
export function setGraphData(graph, data) {
  const startTime = performance.now();

  logAffordanceExecution('GraphRenderer', 'setGraphData', {
    hasGraph: !!graph,
    nodeCount: data?.nodes?.length || 0,
    linkCount: data?.links?.length || 0
  });

  if (!graph) {
    throw new Error('setGraphData: graph instance is required');
  }

  if (!data || !data.nodes || !data.links) {
    throw new Error('setGraphData: data must contain nodes and links arrays');
  }

  // Validate data structure
  const validationResult = validateGraphData(data);
  if (!validationResult.valid) {
    throw new Error(`setGraphData: Invalid data - ${validationResult.errors.join(', ')}`);
  }

  // Clear previous data and objects to prevent ghosts
  try {
    clearGraphData(graph, {
      resetCamera: true,
      clearSelection: true,
      stopSimulation: true,
      clearScene: true
    });
  } catch (clearError) {
    console.warn('Could not clear previous graph data:', clearError);
  }

  // Ensure container dimensions are set
  ensureContainerDimensions(graph);

  // Set the new data
  graph.graphData(data);

  // Refresh visualization to ensure proper rendering
  setTimeout(() => {
    refreshGraphVisualization(graph);
  }, 50);

  const loadTime = Math.round(performance.now() - startTime);

  const nodeCount = data.nodes.length;
  const linkCount = data.links.length;
  const performanceLevel = getPerformanceLevel(nodeCount, loadTime);
  const optimizationStrategy = getOptimizationStrategy(nodeCount, linkCount);

  return {
    nodeCount,
    linkCount,
    loadTime,
    performanceLevel,
    optimizationStrategy,
    needsOptimization: performanceLevel !== 'optimal'
  };
}

/**
 * Validates graph data structure
 * @param {Object} data - Graph data to validate
 * @returns {Object} Validation result
 */
function validateGraphData(data) {
  const errors = [];

  if (!Array.isArray(data.nodes)) {
    errors.push('nodes must be an array');
  }

  if (!Array.isArray(data.links)) {
    errors.push('links must be an array');
  }

  // Validate nodes have required id field
  if (data.nodes && data.nodes.length > 0) {
    const nodesWithoutId = data.nodes.filter(node => node.id === undefined || node.id === null);
    if (nodesWithoutId.length > 0) {
      errors.push(`${nodesWithoutId.length} nodes missing id field`);
    }
  }

  // Validate links reference existing nodes
  if (data.links && data.nodes && data.links.length > 0) {
    const nodeIds = new Set(data.nodes.map(n => n.id));
    const invalidLinks = data.links.filter(link =>
      !nodeIds.has(link.source) || !nodeIds.has(link.target)
    );
    if (invalidLinks.length > 0) {
      errors.push(`${invalidLinks.length} links reference non-existent nodes`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Determines performance level based on node count and load time
 * @param {number} nodeCount - Number of nodes
 * @param {number} loadTime - Load time in milliseconds
 * @returns {string} Performance level
 */
function getPerformanceLevel(nodeCount, loadTime) {
  if (nodeCount > 5000 || loadTime > 2000) return 'critical';
  if (nodeCount > 1000 || loadTime > 500) return 'warning';
  return 'optimal';
}

/**
 * Determines optimal rendering strategy based on graph metrics
 * @param {number} nodeCount - Number of nodes
 * @param {number} linkCount - Number of links
 * @returns {Object} Optimization recommendations
 */
function getOptimizationStrategy(nodeCount, linkCount) {
  const strategy = {
    renderingMode: 'standard',
    useInstancing: false,
    useLOD: false,
    useFrustumCulling: false,
    usePoints: false,
    batchUpdates: false,
    spatialPartitioning: false
  };

  // Determine rendering mode based on scale
  if (nodeCount > 10000) {
    strategy.renderingMode = 'ultra-performance';
    strategy.useInstancing = true;
    strategy.useLOD = true;
    strategy.useFrustumCulling = true;
    strategy.usePoints = true;
    strategy.batchUpdates = true;
    strategy.spatialPartitioning = true;
  } else if (nodeCount > 5000) {
    strategy.renderingMode = 'high-performance';
    strategy.useInstancing = true;
    strategy.useLOD = true;
    strategy.useFrustumCulling = true;
    strategy.batchUpdates = true;
  } else if (nodeCount > 1000) {
    strategy.renderingMode = 'optimized';
    strategy.useInstancing = true;
    strategy.useFrustumCulling = true;
    strategy.batchUpdates = true;
  }

  return strategy;
}

/**
 * Ensures the graph container has proper dimensions
 * @param {Object} graph - ForceGraph3D instance
 */
function ensureContainerDimensions(graph) {
  try {
    const renderer = graph.renderer();
    if (!renderer) return;

    const canvas = renderer.domElement;
    const container = canvas.parentElement;

    if (container) {
      const rect = container.getBoundingClientRect();

      // Only resize if container has actual dimensions
      if (rect.width > 0 && rect.height > 0) {
        renderer.setSize(rect.width, rect.height);

        const camera = graph.camera();
        if (camera && camera.isPerspectiveCamera) {
          camera.aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
        }

        console.log(`📐 Set graph dimensions: ${rect.width}x${rect.height}`);
      }
    }
  } catch (error) {
    console.warn('Could not ensure container dimensions:', error);
  }
} 