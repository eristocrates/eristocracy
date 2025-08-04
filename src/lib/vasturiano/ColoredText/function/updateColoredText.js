import { getKapsuleInstance } from '../../Kapsule/function/getKapsuleInstance.js';

/**
 * Update an existing ColoredText instance
 * @param {string} elementId - The element ID of the ColoredText component
 * @param {string} color - New text color
 * @param {string} text - New text content
 */
export function updateColoredText(elementId, color, text) {
  const instance = getKapsuleInstance(elementId);
  if (instance) {
    instance.color(color).text(text);

    // Also update data attributes for consistency
    const element = document.getElementById(elementId);
    if (element) {
      element.dataset.color = color;
      element.dataset.text = text;
    }
  } else {
    console.error(`ColoredText instance with ID "${elementId}" not found`);
  }
}