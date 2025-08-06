/**
 * Client-side Kapsule configurations
 * Functions live here to avoid Astro serialization boundary issues
 */

export function getKapsuleConfig(componentName) {
  const configs = {
    ColoredText: {
      props: {
        color: { default: 'red' },
        text: { default: '' }
      },
      init(domElement, state) {
        console.log('🎨 ColoredText init called with state:', state);
        state.elem = document.createElement('span');
        domElement.appendChild(state.elem);
        console.log('✅ Created span element and appended to DOM');
      },
      update(state) {
        console.log('🔄 ColoredText update called with state:', state);
        if (state.elem) {
          state.elem.style.color = state.color;
          state.elem.textContent = state.text;
          console.log('✅ Updated span color and text');
        }
      }
    },

    // Add more component configs here as needed
    // ForceGraph3D: { ... },
    // etc.
  };

  const config = configs[componentName];
  if (!config) {
    console.error(`❌ No Kapsule config found for component: ${componentName}`);
    return null;
  }

  console.log(`✅ Found Kapsule config for: ${componentName}`, config);
  return config;
}
