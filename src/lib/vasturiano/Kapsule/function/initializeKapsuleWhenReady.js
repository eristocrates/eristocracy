
import { initializeKapsule } from './initializeKapsule.js';

/**
 * Wait for DOM to be ready, then initialize Kapsule component
 * @param {Object} config - Kapsule configuration object
 * @param {string} elementId - ID of the target DOM element
 * @param {Object} options - Options to pass to component constructor
 * @param {Object} componentProps - Props to apply to the instance after creation
 */
export function initializeKapsuleWhenReady(config, elementId, options = {}, componentProps = {}) {
  console.log('⏰ initializeKapsuleWhenReady called with:', {
    config,
    elementId,
    options,
    componentProps,
    readyState: document.readyState
  });

  if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, adding event listener...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOMContentLoaded fired, initializing now...');
      initializeKapsule(config, elementId, options, componentProps);
    });
  } else {
    // DOM is already ready
    console.log('✅ DOM already ready, initializing immediately...');
    initializeKapsule(config, elementId, options, componentProps);
  }
}
