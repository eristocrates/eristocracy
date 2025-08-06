
/**
 * Initialize ColoredText component by reading props from data attributes
 */
export function initializeColoredTextFromAttributes() {
  // Wait for the Kapsule component to be ready
  document.addEventListener("kapsule:ready", (event) => {
    // Check if this is our ColoredText component
    if (event.target.id.startsWith("colored-text-")) {
      const element = event.target;
      const instance = event.detail.instance;

      // Read props from data attributes
      const color = element.dataset.color || 'red';
      const text = element.dataset.text || '';

      // Set the initial values from data attributes
      instance.color(color).text(text);
    }
  });
}
