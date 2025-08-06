import Kapsule from 'kapsule';

/**
 * Initialize a Kapsule component with the given configuration
 * @param {Object} config - Kapsule configuration object
 * @param {string} elementId - ID of the target DOM element
 * @param {Object} options - Options to pass to component constructor
 * @param {Object} componentProps - Props to apply to the instance after creation
 * @returns {Object} The Kapsule component instance
 */
export function initializeKapsule(config, elementId, options = {}, componentProps = {}) {
  console.log('🔧 initializeKapsule called with:', {
    config,
    elementId,
    options,
    componentProps
  });

  // Build the Kapsule configuration
  const kapsuleConfig = {};

  if (config.props && Object.keys(config.props).length > 0) {
    kapsuleConfig.props = config.props;
    console.log('✅ Added props to kapsuleConfig:', config.props);
  }

  if (config.methods && Object.keys(config.methods).length > 0) {
    kapsuleConfig.methods = config.methods;
    console.log('✅ Added methods to kapsuleConfig:', config.methods);
  }

  if (config.stateInit) {
    kapsuleConfig.stateInit = config.stateInit;
    console.log('✅ Added stateInit to kapsuleConfig');
  }

  if (config.init) {
    kapsuleConfig.init = config.init;
    console.log('✅ Added init to kapsuleConfig');
  }

  if (config.update) {
    kapsuleConfig.update = config.update;
    console.log('✅ Added update to kapsuleConfig');
  }

  console.log('🏗️ Final kapsuleConfig:', kapsuleConfig);

  // Create the Kapsule component class
  console.log('🎯 Creating Kapsule component class...');
  const KapsuleComponent = Kapsule(kapsuleConfig);
  console.log('✅ KapsuleComponent created:', KapsuleComponent);

  // Find the target element
  console.log('🔍 Looking for element with ID:', elementId);
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`❌ Element with ID "${elementId}" not found`);
    return null;
  }
  console.log('✅ Found element:', element);

  try {
    // Instantiate the component
    console.log('🚀 Creating Kapsule instance...');
    const instance = new KapsuleComponent(element, options);
    console.log('✅ Kapsule instance created:', instance);

    // Apply component props using method chaining (like .color('blue').text('foo'))
    let chainedInstance = instance;

    // Get the defined props from the Kapsule config to know which methods are available
    const definedProps = config.props || {};
    console.log('📋 Defined props in config:', definedProps);
    console.log('🎨 Component props to apply:', componentProps);

    // Apply each component prop that has a corresponding method
    Object.entries(componentProps).forEach(([propName, propValue]) => {
      console.log(`🔧 Trying to apply ${propName}: ${propValue}`);

      if (definedProps[propName]) {
        console.log(`✅ ${propName} is defined in props config`);

        if (typeof chainedInstance[propName] === 'function') {
          console.log(`✅ ${propName} method exists on instance, calling it...`);
          chainedInstance = chainedInstance[propName](propValue);
          console.log(`✅ Applied ${propName}(${propValue})`);
        } else {
          console.warn(`⚠️ ${propName} method not found on instance`);
        }
      } else {
        console.warn(`⚠️ ${propName} not defined in props config`);
      }
    });

    console.log('🎯 Final instance after prop application:', chainedInstance);

    // Store instance globally for access (optional)
    window[`kapsule_${elementId}`] = instance;
    console.log('🌐 Stored instance globally as:', `kapsule_${elementId}`);

    // Dispatch ready event
    element.dispatchEvent(
      new CustomEvent("kapsule:ready", {
        detail: { instance },
        bubbles: true
      })
    );
    console.log('📢 Dispatched kapsule:ready event');

    return instance;
  } catch (error) {
    console.error('❌ Error initializing Kapsule component:', error);
    return null;
  }
}
