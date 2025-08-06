/**
 * @file onNodeHover.js
 * @description Atomic function: Handles node hover interactions
 * @affordance:GraphEvents
 * @method:onNodeHover
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Creates a node hover handler with performance feedback
 * @param {Function} updatePerformance - Performance status update function
 * @param {Object} config - Hover configuration
 * @returns {Function} Node hover handler
 */
export function onNodeHover(updatePerformance, config = {}) {
  logAffordanceExecution('GraphEvents', 'onNodeHover', {
    hasPerformanceUpdater: !!updatePerformance,
    config
  });

  const {
    showLabel = true,
    performanceTracking = true
  } = config;

  return function handleNodeHover(node) {
    if (node) {
      // Node is being hovered
      const label = getNodeLabel(node, showLabel);

      if (performanceTracking && updatePerformance) {
        updatePerformance(`Hovering: ${label}`);
      }

      if (config.onHoverStart) {
        config.onHoverStart(node, label);
      }
    } else {
      // Node hover ended
      if (performanceTracking && updatePerformance) {
        updatePerformance('Ready');
      }

      if (config.onHoverEnd) {
        config.onHoverEnd();
      }
    }
  };
}

/**
 * Extracts appropriate label from node data
 * @param {Object} node - Node object
 * @param {boolean} showLabel - Whether to show label
 * @returns {string} Node label
 */
function getNodeLabel(node, showLabel) {
  if (!showLabel) return node.id;

  return node.name || node.label || node.id || 'Unknown';
} 