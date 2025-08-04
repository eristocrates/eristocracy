import { getKapsuleConfig } from './../KapsuleConfigsClient.js';
import Kapsule from 'kapsule';

/**
 * Initialize a Kapsule component on the client side
 * @param {string} component - Component type name
 * @param {string} elementId - DOM element ID  
 * @param {Object} componentProps - Props to apply via method chaining
 */
export function initializeKapsuleClient(component, elementId, componentProps = {}) {
  console.log('🎬 initializeKapsuleClient called with:', { component, elementId, componentProps });

  // Get the client-side configuration for this component type
  const config = getKapsuleConfig(component);
  if (!config) {
    console.error('❌ Failed to get config for component:', component);
    return null;
  }

  // Find the target element
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('❌ Element not found:', elementId);
    return null;
  }

  try {
    console.log('🏗️ Creating Kapsule component...');

    // Create the Kapsule component class
    const KapsuleComponent = Kapsule({
      props: config.props,
      init: config.init,
      update: config.update,
    });

    // Instantiate the component
    const instance = new KapsuleComponent(element);
    console.log('✅ Kapsule instance created');

    // Apply component props using method chaining
    let chainedInstance = instance;
    Object.entries(componentProps).forEach(([propName, propValue]) => {
      if (config.props[propName] && typeof chainedInstance[propName] === 'function') {
        console.log(`🔧 Applying ${propName}:`, propValue);
        chainedInstance = chainedInstance[propName](propValue);
      }
    });

    console.log('🎯 Kapsule component fully initialized and configured');

    // Store globally for debugging
    window[`kapsule_${elementId}`] = instance;

    return instance;
  } catch (error) {
    console.error('❌ Error initializing Kapsule component:', error);
    return null;
  }
}
