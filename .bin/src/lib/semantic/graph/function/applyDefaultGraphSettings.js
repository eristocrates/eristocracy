/**
 * @file applyDefaultGraphSettings.js
 * @description Atomic function: Applies default visual settings to graph
 * @affordance:GraphRenderer  
 * @method:applyDefaultGraphSettings
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Applies default visual settings to a ForceGraph3D instance
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} config - Optional configuration overrides
 * @returns {Object} Configured graph instance
 */
export function applyDefaultGraphSettings(graph, config = {}) {
  logAffordanceExecution('GraphRenderer', 'applyDefaultGraphSettings', {
    hasGraph: !!graph,
    configOverrides: Object.keys(config)
  });

  if (!graph) {
    throw new Error('applyDefaultGraphSettings: graph instance is required');
  }

  // Default settings with config overrides
  const settings = {
    backgroundColor: config.backgroundColor || '#0a0a0a',
    showNavInfo: config.showNavInfo ?? false,
    nodeRelSize: config.nodeRelSize || 4,
    linkWidth: config.linkWidth || 1,
    enableNodeDrag: config.enableNodeDrag ?? true,
    enableNavigationControls: config.enableNavigationControls ?? true,
    ...config
  };

  // Apply settings to graph
  graph
    .backgroundColor(settings.backgroundColor)
    .showNavInfo(settings.showNavInfo)
    .nodeRelSize(settings.nodeRelSize)
    .linkWidth(settings.linkWidth)
    .enableNodeDrag(settings.enableNodeDrag)
    .enableNavigationControls(settings.enableNavigationControls);

  // Apply node labeling if specified
  if (settings.nodeLabel) {
    graph.nodeLabel(settings.nodeLabel);
  } else {
    // Default node labeling function
    graph.nodeLabel(node => node.name || node.label || node.id);
  }

  return graph;
} 