import { proxy, subscribe } from 'valtio';
import { PerformanceParameterSchema, PerformancePresets } from './PerformanceParameterSchema.js';

/**
 * Valtio Performance State Store
 * 
 * Reactive state management for all performance parameters.
 * When any parameter changes, all subscribed UI controls automatically update.
 * 
 * Solves the "stuck toggle" problem by ensuring UI state always reflects actual state.
 */

/**
 * Create default state from schema
 */
function createDefaultState() {
  const defaultState = {};

  Object.entries(PerformanceParameterSchema).forEach(([key, param]) => {
    defaultState[key] = param.default;
  });

  return defaultState;
}

/**
 * Create the reactive performance state proxy
 */
export const performanceState = proxy({
  // Core parameter values
  parameters: createDefaultState(),

  // Current preset name
  currentPreset: 'balanced',

  // Performance metrics
  metrics: {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    lastUpdate: Date.now()
  },

  // Nuclear optimization status
  nuclear: {
    phase1Active: false,
    phase2Active: false,
    originalDrawCalls: null,
    reductionPercentage: 0
  },

  // UI state
  ui: {
    panelMinimized: false,
    monitoringActive: true,
    lastParameterChanged: null
  }
});

/**
 * Performance State Manager
 * 
 * Provides methods to interact with the Valtio state safely
 */
export class PerformanceStateManager {
  constructor() {
    this.subscribers = new Set();
    this.parameterChangeCallbacks = new Map();

    // Subscribe to parameter changes for debugging
    this.subscribeToParameterChanges((key, newValue, oldValue) => {
      console.log(`🔄 Valtio State Change: ${key} = ${newValue} (was ${oldValue})`);
    });
  }

  /**
   * Update a single parameter
   */
  updateParameter(key, value) {
    const oldValue = performanceState.parameters[key];
    performanceState.parameters[key] = value;
    performanceState.ui.lastParameterChanged = key;

    // Trigger callbacks
    this.parameterChangeCallbacks.forEach(callback => {
      callback(key, value, oldValue);
    });
  }

  /**
   * Update multiple parameters at once (for presets)
   */
  updateParameters(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (key in performanceState.parameters) {
        performanceState.parameters[key] = value;
      }
    });
    performanceState.ui.lastParameterChanged = 'batch_update';
  }

  /**
   * Load a preset
   */
  loadPreset(presetName) {
    if (PerformancePresets[presetName]) {
      performanceState.currentPreset = presetName;
      this.updateParameters(PerformancePresets[presetName]);
      console.log(`🎮 Loaded preset: ${presetName}`);
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(metrics) {
    Object.assign(performanceState.metrics, metrics);
    performanceState.metrics.lastUpdate = Date.now();
  }

  /**
   * Update nuclear optimization status
   */
  updateNuclearStatus(status) {
    Object.assign(performanceState.nuclear, status);
  }

  /**
   * Get current parameter value
   */
  getParameter(key) {
    return performanceState.parameters[key];
  }

  /**
   * Get all parameters
   */
  getAllParameters() {
    return { ...performanceState.parameters };
  }

  /**
   * Subscribe to parameter changes
   */
  subscribeToParameterChanges(callback) {
    this.parameterChangeCallbacks.set(callback, callback);

    // Use Valtio's subscribe to watch for changes
    const unsubscribe = subscribe(performanceState.parameters, () => {
      // This fires when any parameter changes
      // Callbacks are handled in updateParameter method
    });

    return unsubscribe;
  }

  /**
   * Subscribe to performance metrics changes
   */
  subscribeToMetrics(callback) {
    return subscribe(performanceState.metrics, callback);
  }

  /**
   * Subscribe to nuclear status changes
   */
  subscribeToNuclearStatus(callback) {
    return subscribe(performanceState.nuclear, callback);
  }

  /**
   * Save state to localStorage
   */
  saveToLocalStorage(storageKey = 'performance-fiddle-state') {
    try {
      const stateToSave = {
        parameters: this.getAllParameters(),
        currentPreset: performanceState.currentPreset
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('⚠️ Failed to save to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadFromLocalStorage(storageKey = 'performance-fiddle-state') {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.parameters) {
          this.updateParameters(parsed.parameters);
        }
        if (parsed.currentPreset) {
          performanceState.currentPreset = parsed.currentPreset;
        }
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from localStorage:', error);
    }
    return false;
  }

  /**
   * Load state from URL parameters
   */
  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const updates = {};

    urlParams.forEach((value, key) => {
      if (key in performanceState.parameters) {
        // Parse the value based on parameter type
        const param = PerformanceParameterSchema[key];
        if (param) {
          let parsedValue = value;
          if (param.type === 'number') {
            parsedValue = parseFloat(value);
          } else if (param.type === 'boolean') {
            parsedValue = value === 'true';
          }
          updates[key] = parsedValue;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      this.updateParameters(updates);
      return true;
    }
    return false;
  }

  /**
   * Save current state to URL
   */
  saveToURL() {
    const url = new URL(window.location);

    // Clear existing parameters
    Array.from(url.searchParams.keys()).forEach(key => {
      if (key in performanceState.parameters) {
        url.searchParams.delete(key);
      }
    });

    // Add current parameters
    Object.entries(performanceState.parameters).forEach(([key, value]) => {
      if (value !== PerformanceParameterSchema[key]?.default) {
        url.searchParams.set(key, value.toString());
      }
    });

    window.history.replaceState({}, '', url);
  }
}

// Create singleton instance
export const performanceStateManager = new PerformanceStateManager(); 