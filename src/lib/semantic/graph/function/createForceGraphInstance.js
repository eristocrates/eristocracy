/**
 * @file createForceGraphInstance.js
 * @description Atomic function: Creates ForceGraph3D instance
 * @affordance:GraphRenderer
 * @method:createForceGraphInstance
 */

import ForceGraph3D from '3d-force-graph';
import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Creates a configured ForceGraph3D instance
 * @param {Object} config - Graph configuration
 * @param {HTMLElement} config.container - DOM container element
 * @param {Object} config.colors - Color configuration
 * @param {Object} config.interactions - Interaction handlers
 * @returns {Object} ForceGraph3D instance
 */
export function createForceGraphInstance(config) {
  logAffordanceExecution('GraphRenderer', 'createForceGraphInstance', {
    hasContainer: !!config.container,
    colorsProvided: !!config.colors,
    interactionsProvided: !!config.interactions
  });

  if (!config.container) {
    throw new Error('createForceGraphInstance: container element is required');
  }

  // Create the instance
  const graph = ForceGraph3D()(config.container);

  // Disable auto-coloring to allow custom color functions
  graph.nodeAutoColorBy(null);

  // Apply initial color configuration (will be overridden by performance controls)
  if (config.colors) {
    graph
      .nodeColor(() => config.colors.default || '#0078d4')
      .linkColor(() => config.colors.link || '#333');
  }

  // Apply interaction handlers
  if (config.interactions) {
    if (config.interactions.onNodeHover) {
      graph.onNodeHover(config.interactions.onNodeHover);
    }
    if (config.interactions.onNodeClick) {
      graph.onNodeClick(config.interactions.onNodeClick);
    }
  }

  return graph;
} 