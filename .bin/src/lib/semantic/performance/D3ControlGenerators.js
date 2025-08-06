/**
 * @file D3ControlGenerators.js  
 * @description D3-based control generators with kinesthetic performance feedback
 * Infinite composability - any parameter schema becomes interactive controls
 */

import * as d3 from 'd3';
import { subscribe } from 'valtio';
import { performanceState, performanceStateManager } from './PerformanceState.js';

/**
 * Reactive D3 Control Generators
 * 
 * Creates D3-based UI controls that automatically sync with Valtio state.
 * Solves the "stuck toggle" problem by subscribing each control to state changes.
 */

/**
 * Create a reactive D3 slider control
 */
export function createD3Slider(container, paramKey, param, onChangeCallback = null) {
  console.log(`🎛️ Creating reactive slider for ${paramKey}`);

  const controlGroup = container
    .append('div')
    .attr('class', 'parameter-control');

  // Add visual feedback on transition
  controlGroup
    .transition()
    .duration(200)
    .style('opacity', 1);

  // Label
  const label = controlGroup
    .append('label')
    .attr('class', 'parameter-label')
    .style('display', 'block')
    .style('margin-bottom', '4px')
    .style('font-weight', 'bold')
    .style('color', '#E2E8F0')
    .text(`${param.label}:`);

  // Value display
  const valueDisplay = label
    .append('span')
    .attr('class', 'parameter-value')
    .style('float', 'right')
    .style('color', '#A0AEC0')
    .style('font-weight', 'normal')
    .text(performanceState.parameters[paramKey] + (param.unit || ''));

  // Slider input
  const slider = controlGroup
    .append('input')
    .attr('type', 'range')
    .attr('class', 'parameter-slider')
    .attr('min', param.min)
    .attr('max', param.max)
    .attr('step', param.step || 1)
    .attr('value', performanceState.parameters[paramKey])
    .style('width', '100%')
    .style('margin', '8px 0')
    .on('input', function () {
      const newValue = parseFloat(this.value);
      performanceStateManager.updateParameter(paramKey, newValue);

      if (onChangeCallback) {
        onChangeCallback(paramKey, newValue);
      }
    });

  // Subscribe to Valtio state changes for this parameter
  const unsubscribe = subscribe(performanceState.parameters, () => {
    const currentValue = performanceState.parameters[paramKey];

    // Update slider value (avoid triggering input event)
    if (parseFloat(slider.node().value) !== currentValue) {
      slider.node().value = currentValue;
    }

    // Update value display
    valueDisplay.text(currentValue + (param.unit || ''));

    // Visual feedback for changes
    controlGroup
      .transition()
      .duration(150)
      .style('background-color', 'rgba(66, 153, 225, 0.1)')
      .transition()
      .duration(300)
      .style('background-color', 'transparent');
  });

  // Store cleanup function
  controlGroup.node()._valtioCleanup = unsubscribe;

  return {
    element: controlGroup,
    setValue: (value) => performanceStateManager.updateParameter(paramKey, value),
    getValue: () => performanceState.parameters[paramKey],
    cleanup: unsubscribe
  };
}

/**
 * Create a reactive D3 toggle/checkbox control
 */
export function createD3Toggle(container, paramKey, param, onChangeCallback = null) {
  console.log(`🎚️ Creating reactive toggle for ${paramKey}`);

  const controlGroup = container
    .append('div')
    .attr('class', 'parameter-control');

  // Add visual feedback on transition
  controlGroup
    .transition()
    .duration(200)
    .style('opacity', 1);

  // Create toggle container
  const toggleContainer = controlGroup
    .append('div')
    .attr('class', 'toggle-container')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '8px')
    .style('margin', '8px 0');

  // Hidden checkbox for state
  const checkbox = toggleContainer
    .append('input')
    .attr('type', 'checkbox')
    .attr('class', 'parameter-checkbox')
    .attr('id', `toggle-${paramKey}`)
    .style('display', 'none')
    .property('checked', performanceState.parameters[paramKey]);

  // Custom toggle switch
  const toggleSwitch = toggleContainer
    .append('div')
    .attr('class', 'toggle-switch')
    .style('width', '44px')
    .style('height', '24px')
    .style('background-color', performanceState.parameters[paramKey] ? '#48BB78' : '#4A5568')
    .style('border-radius', '12px')
    .style('position', 'relative')
    .style('cursor', 'pointer')
    .style('transition', 'background-color 0.2s')
    .on('click', function () {
      const newValue = !performanceState.parameters[paramKey];
      performanceStateManager.updateParameter(paramKey, newValue);

      if (onChangeCallback) {
        onChangeCallback(paramKey, newValue);
      }
    });

  // Toggle knob
  const toggleKnob = toggleSwitch
    .append('div')
    .attr('class', 'toggle-knob')
    .style('width', '20px')
    .style('height', '20px')
    .style('background-color', 'white')
    .style('border-radius', '50%')
    .style('position', 'absolute')
    .style('top', '2px')
    .style('left', performanceState.parameters[paramKey] ? '22px' : '2px')
    .style('transition', 'left 0.2s')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)');

  // Label
  const label = toggleContainer
    .append('label')
    .attr('for', `toggle-${paramKey}`)
    .attr('class', 'parameter-label')
    .style('color', '#E2E8F0')
    .style('font-weight', 'bold')
    .style('cursor', 'pointer')
    .text(param.label)
    .on('click', function () {
      const newValue = !performanceState.parameters[paramKey];
      performanceStateManager.updateParameter(paramKey, newValue);

      if (onChangeCallback) {
        onChangeCallback(paramKey, newValue);
      }
    });

  // Subscribe to Valtio state changes for this parameter
  const unsubscribe = subscribe(performanceState.parameters, () => {
    const currentValue = performanceState.parameters[paramKey];

    // Update checkbox state
    checkbox.property('checked', currentValue);

    // Update toggle switch appearance
    toggleSwitch
      .style('background-color', currentValue ? '#48BB78' : '#4A5568');

    // Update toggle knob position
    toggleKnob
      .style('left', currentValue ? '22px' : '2px');

    // Visual feedback for changes
    controlGroup
      .transition()
      .duration(150)
      .style('background-color', 'rgba(66, 153, 225, 0.1)')
      .transition()
      .duration(300)
      .style('background-color', 'transparent');
  });

  // Store cleanup function
  controlGroup.node()._valtioCleanup = unsubscribe;

  return {
    element: controlGroup,
    setValue: (value) => performanceStateManager.updateParameter(paramKey, value),
    getValue: () => performanceState.parameters[paramKey],
    cleanup: unsubscribe
  };
}

/**
 * Create a reactive D3 select dropdown control
 */
export function createD3Select(container, paramKey, param, onChangeCallback = null) {
  console.log(`🎮 Creating reactive select for ${paramKey}`);

  const controlGroup = container
    .append('div')
    .attr('class', 'parameter-control');

  // Add visual feedback on transition
  controlGroup
    .transition()
    .duration(200)
    .style('opacity', 1);

  // Label
  const label = controlGroup
    .append('label')
    .attr('class', 'parameter-label')
    .style('display', 'block')
    .style('margin-bottom', '4px')
    .style('font-weight', 'bold')
    .style('color', '#E2E8F0')
    .text(`${param.label}:`);

  // Select dropdown
  const select = controlGroup
    .append('select')
    .attr('class', 'parameter-select')
    .style('width', '100%')
    .style('padding', '6px')
    .style('margin', '4px 0')
    .style('background-color', '#2D3748')
    .style('color', '#E2E8F0')
    .style('border', '1px solid #4A5568')
    .style('border-radius', '4px')
    .on('change', function () {
      const newValue = this.value;
      performanceStateManager.updateParameter(paramKey, newValue);

      if (onChangeCallback) {
        onChangeCallback(paramKey, newValue);
      }
    });

  // Populate options
  if (param.options && Array.isArray(param.options)) {
    param.options.forEach(option => {
      let optionValue, optionText;

      if (typeof option === 'string') {
        optionValue = optionText = option;
      } else if (option && typeof option === 'object') {
        optionValue = option.value || option.key || '';
        optionText = option.label || option.text || optionValue;
      } else {
        optionValue = optionText = String(option);
      }

      select
        .append('option')
        .attr('value', optionValue)
        .text(optionText)
        .property('selected', optionValue === performanceState.parameters[paramKey]);
    });
  } else {
    console.warn(`⚠️ No options provided for select parameter: ${paramKey}`);
    select
      .append('option')
      .attr('value', '')
      .text('No options available');
  }

  // Subscribe to Valtio state changes for this parameter
  const unsubscribe = subscribe(performanceState.parameters, () => {
    const currentValue = performanceState.parameters[paramKey];

    // Update select value
    if (select.node().value !== currentValue) {
      select.node().value = currentValue;
    }

    // Visual feedback for changes
    controlGroup
      .transition()
      .duration(150)
      .style('background-color', 'rgba(66, 153, 225, 0.1)')
      .transition()
      .duration(300)
      .style('background-color', 'transparent');
  });

  // Store cleanup function
  controlGroup.node()._valtioCleanup = unsubscribe;

  return {
    element: controlGroup,
    setValue: (value) => performanceStateManager.updateParameter(paramKey, value),
    getValue: () => performanceState.parameters[paramKey],
    cleanup: unsubscribe
  };
}

/**
 * Create a reactive D3 color picker control
 */
export function createD3ColorPicker(container, paramKey, param, onChangeCallback = null) {
  console.log(`🎨 Creating reactive color picker for ${paramKey}`);

  const controlGroup = container
    .append('div')
    .attr('class', 'parameter-control');

  // Add visual feedback on transition
  controlGroup
    .transition()
    .duration(200)
    .style('opacity', 1);

  // Label
  const label = controlGroup
    .append('label')
    .attr('class', 'parameter-label')
    .style('display', 'block')
    .style('margin-bottom', '4px')
    .style('font-weight', 'bold')
    .style('color', '#E2E8F0')
    .text(`${param.label}:`);

  // Color input container
  const colorContainer = controlGroup
    .append('div')
    .style('display', 'flex')
    .style('gap', '8px')
    .style('align-items', 'center');

  // Color preview
  const colorPreview = colorContainer
    .append('div')
    .attr('class', 'color-preview')
    .style('width', '24px')
    .style('height', '24px')
    .style('border-radius', '4px')
    .style('border', '2px solid #4A5568')
    .style('background-color', performanceState.parameters[paramKey]);

  // Color input
  const colorInput = colorContainer
    .append('input')
    .attr('type', 'color')
    .attr('class', 'parameter-color')
    .attr('value', performanceState.parameters[paramKey])
    .style('width', '60px')
    .style('height', '24px')
    .style('border', 'none')
    .style('border-radius', '4px')
    .style('cursor', 'pointer')
    .on('input', function () {
      const newValue = this.value;
      performanceStateManager.updateParameter(paramKey, newValue);

      if (onChangeCallback) {
        onChangeCallback(paramKey, newValue);
      }
    });

  // Hex text input
  const hexInput = colorContainer
    .append('input')
    .attr('type', 'text')
    .attr('class', 'parameter-hex')
    .attr('value', performanceState.parameters[paramKey])
    .attr('placeholder', '#000000')
    .style('flex', '1')
    .style('padding', '4px 6px')
    .style('background-color', '#2D3748')
    .style('color', '#E2E8F0')
    .style('border', '1px solid #4A5568')
    .style('border-radius', '4px')
    .style('font-family', 'monospace')
    .on('input', function () {
      const newValue = this.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        performanceStateManager.updateParameter(paramKey, newValue);

        if (onChangeCallback) {
          onChangeCallback(paramKey, newValue);
        }
      }
    });

  // Subscribe to Valtio state changes for this parameter
  const unsubscribe = subscribe(performanceState.parameters, () => {
    const currentValue = performanceState.parameters[paramKey];

    // Update color input
    if (colorInput.node().value !== currentValue) {
      colorInput.node().value = currentValue;
    }

    // Update hex input
    if (hexInput.node().value !== currentValue) {
      hexInput.node().value = currentValue;
    }

    // Update color preview
    colorPreview.style('background-color', currentValue);

    // Visual feedback for changes
    controlGroup
      .transition()
      .duration(150)
      .style('background-color', 'rgba(66, 153, 225, 0.1)')
      .transition()
      .duration(300)
      .style('background-color', 'transparent');
  });

  // Store cleanup function
  controlGroup.node()._valtioCleanup = unsubscribe;

  return {
    element: controlGroup,
    setValue: (value) => performanceStateManager.updateParameter(paramKey, value),
    getValue: () => performanceState.parameters[paramKey],
    cleanup: unsubscribe
  };
}

/**
 * Cleanup all Valtio subscriptions for a container
 */
export function cleanupValtioSubscriptions(container) {
  container.selectAll('*').each(function () {
    if (this._valtioCleanup) {
      this._valtioCleanup();
      this._valtioCleanup = null;
    }
  });
} 