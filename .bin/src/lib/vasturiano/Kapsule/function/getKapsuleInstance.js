
/**
 * Get a Kapsule instance by element ID
 * @param {string} elementId - ID of the target DOM element
 * @returns {Object|null} The Kapsule component instance or null if not found
 */
export function getKapsuleInstance(elementId) {
  return window[`kapsule_${elementId}`] || null;
}
