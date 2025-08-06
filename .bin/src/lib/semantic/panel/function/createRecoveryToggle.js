/**
 * @file createRecoveryToggle.js
 * @description Atomic function: Creates persistent panel recovery toggle
 * @affordance:PanelRecovery
 * @method:createRecoveryToggle
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Creates a persistent recovery toggle for hidden panels
 * @param {Object} config - Recovery toggle configuration
 * @returns {HTMLElement} Recovery toggle element
 */
export function createRecoveryToggle(config = {}) {
  logAffordanceExecution('PanelRecovery', 'createRecoveryToggle', { config });

  const {
    position = { bottom: '20px', right: '20px' },
    icon = '⚙️',
    size = '48px',
    tooltip = 'Show Controls (Esc)',
    zIndex = 1001
  } = config;

  // Create the toggle button
  const toggle = document.createElement('button');
  toggle.id = 'panel-recovery-toggle';
  toggle.innerHTML = icon;
  toggle.title = tooltip;
  toggle.setAttribute('aria-label', 'Show control panel');

  // Apply styles
  Object.assign(toggle.style, {
    position: 'fixed',
    bottom: position.bottom || '20px',
    right: position.right || '20px',
    width: size,
    height: size,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0, 120, 212, 0.9)',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: zIndex.toString(),
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    display: 'none' // Hidden by default
  });

  // Hover effects
  toggle.addEventListener('mouseenter', () => {
    toggle.style.background = 'rgba(0, 120, 212, 1)';
    toggle.style.transform = 'scale(1.1)';
  });

  toggle.addEventListener('mouseleave', () => {
    toggle.style.background = 'rgba(0, 120, 212, 0.9)';
    toggle.style.transform = 'scale(1)';
  });

  // Click handler
  toggle.addEventListener('click', () => {
    if (config.onToggleClick) {
      config.onToggleClick();
    }

    // Auto-hide the toggle when clicked
    hideRecoveryToggle(toggle);
  });

  // Add to document
  document.body.appendChild(toggle);

  return toggle;
}

/**
 * Shows the recovery toggle
 * @param {HTMLElement} toggle - Recovery toggle element
 */
export function showRecoveryToggle(toggle) {
  if (toggle) {
    toggle.style.display = 'flex';
    toggle.style.alignItems = 'center';
    toggle.style.justifyContent = 'center';

    // Animate in
    toggle.style.opacity = '0';
    toggle.style.transform = 'scale(0.5)';

    requestAnimationFrame(() => {
      toggle.style.transition = 'all 0.3s ease';
      toggle.style.opacity = '1';
      toggle.style.transform = 'scale(1)';
    });
  }
}

/**
 * Hides the recovery toggle
 * @param {HTMLElement} toggle - Recovery toggle element
 */
export function hideRecoveryToggle(toggle) {
  if (toggle) {
    toggle.style.transition = 'all 0.2s ease';
    toggle.style.opacity = '0';
    toggle.style.transform = 'scale(0.5)';

    setTimeout(() => {
      toggle.style.display = 'none';
    }, 200);
  }
} 