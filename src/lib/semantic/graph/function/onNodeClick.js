/**
 * @file onNodeClick.js
 * @description Atomic function: Handles node click interactions
 * @affordance:GraphEvents
 * @method:onNodeClick
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Creates a node click handler with configurable behavior
 * @param {Object} config - Click configuration
 * @returns {Function} Node click handler
 */
export function onNodeClick(config = {}) {
  logAffordanceExecution('GraphEvents', 'onNodeClick', {
    config: Object.keys(config)
  });

  const {
    enableSelection = true,
    enableDetails = false,
    logClicks = true
  } = config;

  let selectedNode = null;

  return function handleNodeClick(node, event) {
    if (logClicks) {
      console.log('Node clicked:', node);
    }

    if (enableSelection) {
      // Toggle selection
      if (selectedNode === node) {
        selectedNode = null;
        if (config.onNodeDeselected) {
          config.onNodeDeselected(node, event);
        }
      } else {
        selectedNode = node;
        if (config.onNodeSelected) {
          config.onNodeSelected(node, event);
        }
      }
    }

    if (enableDetails && config.showNodeDetails) {
      config.showNodeDetails(node, event);
    }

    if (config.customClickHandler) {
      config.customClickHandler(node, event, selectedNode);
    }
  };
} 