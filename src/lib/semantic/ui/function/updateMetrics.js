/**
 * @file updateMetrics.js
 * @description Atomic function: Updates graph metrics display
 * @affordance:StatusManager
 * @method:updateMetrics
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Updates metrics display with formatted node/link counts
 * @param {HTMLElement} metricsElement - Metrics display element
 * @param {number} nodeCount - Number of nodes
 * @param {number} linkCount - Number of links
 * @param {Object} config - Metrics configuration
 */
export function updateMetrics(metricsElement, nodeCount, linkCount, config = {}) {
  logAffordanceExecution('StatusManager', 'updateMetrics', {
    hasElement: !!metricsElement,
    nodeCount,
    linkCount
  });

  if (!metricsElement) {
    console.warn('updateMetrics: metricsElement is required');
    return;
  }

  const {
    formatLargeNumbers = true,
    showPerformanceWarnings = true,
    customFormat = null,
    showRatio = false
  } = config;

  // Format numbers for display
  const formattedNodes = formatLargeNumbers
    ? formatNumber(nodeCount)
    : nodeCount.toString();

  const formattedLinks = formatLargeNumbers
    ? formatNumber(linkCount)
    : linkCount.toString();

  // Create display message
  let message;
  if (customFormat) {
    message = customFormat(nodeCount, linkCount);
  } else {
    message = `${formattedNodes} nodes, ${formattedLinks} links`;

    if (showRatio && nodeCount > 0) {
      const ratio = (linkCount / nodeCount).toFixed(1);
      message += ` (${ratio}:1)`;
    }
  }

  // Update display
  metricsElement.textContent = message;

  // Apply performance-based styling
  if (showPerformanceWarnings) {
    applyPerformanceWarnings(metricsElement, nodeCount, linkCount);
  }

  // Emit metrics event
  if (config.emitEvents) {
    const event = new CustomEvent('metricsUpdate', {
      detail: {
        nodeCount,
        linkCount,
        ratio: nodeCount > 0 ? linkCount / nodeCount : 0,
        timestamp: Date.now()
      }
    });
    metricsElement.dispatchEvent(event);
  }
}

/**
 * Formats large numbers with appropriate suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Applies performance-based styling warnings
 * @param {HTMLElement} element - Element to style
 * @param {number} nodeCount - Number of nodes
 * @param {number} linkCount - Number of links
 */
function applyPerformanceWarnings(element, nodeCount, linkCount) {
  // Remove existing warning classes
  element.className = element.className.replace(/metrics-\w+/g, '');

  // Apply warning classes based on performance thresholds
  if (nodeCount > 5000 || linkCount > 10000) {
    element.className += ' metrics-critical';
    element.style.color = '#ff6b6b';
  } else if (nodeCount > 1000 || linkCount > 2000) {
    element.className += ' metrics-warning';
    element.style.color = '#ffa500';
  } else {
    element.className += ' metrics-optimal';
    element.style.color = '#0078d4';
  }
} 