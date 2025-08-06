/**
 * @file initializePanelDrag.js
 * @description Atomic function: Initializes panel drag behavior
 * @affordance:PanelContainer
 * @method:initializePanelDrag
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Initializes drag behavior for a panel element
 * @param {HTMLElement} panel - Panel element to make draggable
 * @param {Object} config - Drag configuration
 * @returns {Object} Drag state and cleanup function
 */
export function initializePanelDrag(panel, config = {}) {
  logAffordanceExecution('PanelContainer', 'initializePanelDrag', {
    hasPanel: !!panel,
    config
  });

  if (!panel) {
    throw new Error('initializePanelDrag: panel element is required');
  }

  const {
    dragHandle = '.panel-header',
    constrainToViewport = true,
    snapToEdges = false,
    snapThreshold = 20
  } = config;

  // Get drag handle element
  const handle = typeof dragHandle === 'string'
    ? panel.querySelector(dragHandle)
    : dragHandle;

  if (!handle) {
    throw new Error(`initializePanelDrag: drag handle "${dragHandle}" not found`);
  }

  // Drag state
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // Event handlers
  function onMouseDown(e) {
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    // Prevent text selection during drag
    e.preventDefault();

    // Add global event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Visual feedback
    handle.style.cursor = 'grabbing';

    if (config.onDragStart) {
      config.onDragStart(e, { x: rect.left, y: rect.top });
    }
  }

  function onMouseMove(e) {
    if (!isDragging) return;

    let x = e.clientX - dragOffset.x;
    let y = e.clientY - dragOffset.y;

    // Constrain to viewport if enabled
    if (constrainToViewport) {
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));
    }

    // Snap to edges if enabled
    if (snapToEdges) {
      const snapResult = calculateSnapPosition(x, y, panel, snapThreshold);
      x = snapResult.x;
      y = snapResult.y;
    }

    // Apply position
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';

    if (config.onDrag) {
      config.onDrag(e, { x, y });
    }
  }

  function onMouseUp(e) {
    if (!isDragging) return;

    isDragging = false;

    // Remove global event listeners
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Reset cursor
    handle.style.cursor = 'grab';

    if (config.onDragEnd) {
      const rect = panel.getBoundingClientRect();
      config.onDragEnd(e, { x: rect.left, y: rect.top });
    }
  }

  // Initialize drag handle
  handle.style.cursor = 'grab';
  handle.addEventListener('mousedown', onMouseDown);

  // Return cleanup function and state
  return {
    isDragging: () => isDragging,
    cleanup: () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  };
}

/**
 * Calculates snap position for edge snapping
 * @param {number} x - Current x position
 * @param {number} y - Current y position  
 * @param {HTMLElement} panel - Panel element
 * @param {number} threshold - Snap threshold in pixels
 * @returns {Object} Snap position
 */
function calculateSnapPosition(x, y, panel, threshold) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;

  let snapX = x;
  let snapY = y;

  // Snap to left edge
  if (x < threshold) {
    snapX = 0;
  }
  // Snap to right edge
  else if (x + panelWidth > viewportWidth - threshold) {
    snapX = viewportWidth - panelWidth;
  }

  // Snap to top edge
  if (y < threshold) {
    snapY = 0;
  }
  // Snap to bottom edge
  else if (y + panelHeight > viewportHeight - threshold) {
    snapY = viewportHeight - panelHeight;
  }

  return { x: snapX, y: snapY };
} 