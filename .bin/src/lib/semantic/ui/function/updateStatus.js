/**
 * @file updateStatus.js
 * @description Atomic function: Updates status text with visual feedback
 * @affordance:StatusManager
 * @method:updateStatus
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Updates status text element with color-coded feedback
 * @param {HTMLElement} statusElement - Status text element
 * @param {string} message - Status message
 * @param {string} type - Status type: 'loading', 'ready', 'error', 'warning'
 * @param {Object} config - Status configuration
 */
export function updateStatus(statusElement, message, type = 'ready', config = {}) {
  logAffordanceExecution('StatusManager', 'updateStatus', {
    hasElement: !!statusElement,
    message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    type
  });

  if (!statusElement) {
    console.warn('updateStatus: statusElement is required');
    return;
  }

  const {
    colors = {
      loading: '#ffa500',
      ready: '#ccc',
      error: '#ff6b6b',
      warning: '#ffa500',
      success: '#10b981'
    },
    addTimestamp = false,
    maxLength = 200
  } = config;

  // Truncate message if too long
  let displayMessage = message.length > maxLength
    ? message.substring(0, maxLength) + '...'
    : message;

  // Add timestamp if requested
  if (addTimestamp) {
    const timestamp = new Date().toLocaleTimeString();
    displayMessage = `[${timestamp}] ${displayMessage}`;
  }

  // Update text content
  statusElement.textContent = displayMessage;

  // Apply color based on type
  const color = colors[type] || colors.ready;
  statusElement.style.color = color;

  // Add type class for additional styling
  statusElement.className = statusElement.className
    .replace(/status-\w+/g, '') + ` status-${type}`;

  // Emit custom event for other components
  if (config.emitEvents) {
    const event = new CustomEvent('statusUpdate', {
      detail: { message: displayMessage, type, timestamp: Date.now() }
    });
    statusElement.dispatchEvent(event);
  }
} 