/**
 * @file enablePerformanceMonitoring.js
 * @description Atomic function: Enables real-time performance monitoring with three-perf
 * @affordance:PerformanceAffordance
 * @method:enablePerformanceMonitoring
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';

/**
 * Enables real-time performance monitoring for a ForceGraph3D instance
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} config - Configuration options
 * @returns {Object} Performance monitor instance and controls
 */
export async function enablePerformanceMonitoring(graph, config = {}) {
  logAffordanceExecution('PerformanceAffordance', 'enablePerformanceMonitoring', {
    hasGraph: !!graph,
    config
  });

  if (!graph) {
    throw new Error('enablePerformanceMonitoring: graph instance is required');
  }

  const {
    anchorX = 'right',
    anchorY = 'top',
    domElement = document.body,
    logsPerSecond = 10,
    showGraph = true,
    memory = true,
    enabled = true,
    visible = true,
    backgroundOpacity = 0.8,
    scale = 1
  } = config;

  // Get the renderer from ForceGraph3D
  const renderer = graph.renderer();
  if (!renderer) {
    throw new Error('enablePerformanceMonitoring: Could not access graph renderer');
  }

  // Dynamic import of three-perf to work with Astro/Vite
  let ThreePerf;
  try {
    const threePerfModule = await import('three-perf');
    ThreePerf = threePerfModule.ThreePerf;
    console.log('✅ three-perf loaded successfully');
  } catch (error) {
    console.warn('⚠️ three-perf could not be loaded, using fallback:', error.message);
    // Return a mock performance monitor that doesn't break the system
    return createMockPerformanceMonitor(config);
  }

  // Create ThreePerf instance
  const perf = new ThreePerf({
    anchorX,
    anchorY,
    domElement,
    renderer,
    logsPerSecond,
    showGraph,
    memory,
    enabled,
    visible,
    backgroundOpacity,
    scale
  });

  // Performance metrics state
  const performanceState = {
    fps: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0,
    enabled: true,
    lastUpdate: 0
  };

  // Wrap the original render method to include performance monitoring
  const originalRender = setupRenderHooks(graph, perf, performanceState);

  // Create control methods
  const controls = {
    start: () => {
      performanceState.enabled = true;
      perf.enabled = true;
      perf.visible = true;
      console.log('Performance monitoring started');
    },

    stop: () => {
      performanceState.enabled = false;
      perf.enabled = false;
      perf.visible = false;
      console.log('Performance monitoring stopped');
    },

    toggle: () => {
      if (performanceState.enabled) {
        controls.stop();
      } else {
        controls.start();
      }
    },

    getMetrics: () => {
      return {
        ...performanceState,
        timestamp: Date.now()
      };
    },

    updateConfig: (newConfig) => {
      Object.assign(config, newConfig);
      // Update ThreePerf instance with new config
      if (newConfig.visible !== undefined) perf.visible = newConfig.visible;
      if (newConfig.enabled !== undefined) perf.enabled = newConfig.enabled;
    },

    cleanup: () => {
      // Restore original render method if modified
      if (originalRender) {
        // This would restore the original method if we had wrapped it
      }

      // Remove the perf panel from DOM
      if (perf.dom && perf.dom.parentNode) {
        perf.dom.parentNode.removeChild(perf.dom);
      }

      performanceState.enabled = false;
      console.log('Performance monitoring cleaned up');
    }
  };

  // Return monitor instance and controls
  return {
    perf,
    controls,
    state: performanceState,
    enabled: true
  };
}

/**
 * Sets up render hooks to automatically call perf.begin() and perf.end()
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} perf - ThreePerf instance  
 * @param {Object} performanceState - Performance state object
 * @returns {Function|null} Original render function if modified
 */
function setupRenderHooks(graph, perf, performanceState) {
  // For ForceGraph3D, we'll hook into the animation loop differently
  // since it manages its own render cycle

  // Setup performance monitoring on engine tick events
  if (graph.onEngineStop) {
    graph.onEngineStop(() => {
      if (performanceState.enabled) {
        // Update our internal metrics from perf
        updatePerformanceMetrics(perf, performanceState);
      }
    });
  }

  // Setup manual render monitoring
  // We'll provide methods to be called manually around render operations
  const renderMonitor = {
    begin: () => {
      if (performanceState.enabled) {
        perf.begin();
      }
    },

    end: () => {
      if (performanceState.enabled) {
        perf.end();
        updatePerformanceMetrics(perf, performanceState);
      }
    }
  };

  // Store render monitor on the perf instance for external access
  perf.renderMonitor = renderMonitor;

  return null; // No original function to restore in this case
}

/**
 * Updates internal performance metrics from ThreePerf
 * @param {Object} perf - ThreePerf instance
 * @param {Object} performanceState - Performance state to update
 */
function updatePerformanceMetrics(perf, performanceState) {
  const now = Date.now();

  // Throttle updates to avoid excessive processing
  if (now - performanceState.lastUpdate < 100) {
    return;
  }

  try {
    // Access ThreePerf internal stats (API may vary)
    // This is a best-effort attempt to extract metrics
    if (perf.stats) {
      performanceState.fps = perf.stats.fps || 0;
      performanceState.memory = perf.stats.memory || 0;
      performanceState.drawCalls = perf.stats.drawCalls || 0;
      performanceState.triangles = perf.stats.triangles || 0;
    }

    performanceState.lastUpdate = now;
  } catch (error) {
    console.warn('Could not update performance metrics:', error);
  }
}

/**
 * Creates a performance monitoring panel that integrates with existing UI
 * @param {Object} monitorResult - Result from enablePerformanceMonitoring
 * @param {Object} config - UI integration config
 * @returns {Object} UI integration result
 */
export function integratePerformancePanel(monitorResult, config = {}) {
  logAffordanceExecution('PerformanceAffordance', 'integratePerformancePanel');

  const {
    parentElement = null,
    showToggleButton = true,
    position = 'bottom-right'
  } = config;

  // If parent element is specified, move the perf panel there
  if (parentElement && monitorResult.perf.dom) {
    parentElement.appendChild(monitorResult.perf.dom);

    // Adjust positioning for container
    const perfElement = monitorResult.perf.dom;
    perfElement.style.position = 'relative';
    perfElement.style.margin = '8px';
  }

  // Create toggle button if requested
  let toggleButton = null;
  if (showToggleButton) {
    toggleButton = createPerformanceToggle(monitorResult, position);
  }

  return {
    toggleButton,
    panel: monitorResult.perf.dom,
    controls: monitorResult.controls
  };
}

/**
 * Creates a toggle button for performance monitoring
 * @param {Object} monitorResult - Monitor result object
 * @param {string} position - Button position
 * @returns {HTMLElement} Toggle button element
 */
function createPerformanceToggle(monitorResult, position) {
  const button = document.createElement('button');
  button.textContent = '📊';
  button.title = 'Toggle Performance Monitor';
  button.style.cssText = `
    position: fixed;
    ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    ${position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(15, 15, 15, 0.9);
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    z-index: 999;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(25, 25, 25, 0.95)';
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(15, 15, 15, 0.9)';
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', () => {
    monitorResult.controls.toggle();
    button.style.opacity = monitorResult.state.enabled ? '1' : '0.5';
  });

  document.body.appendChild(button);
  return button;
}

/**
 * Creates a mock performance monitor when three-perf fails to load
 * @param {Object} config - Configuration options
 * @returns {Object} Mock performance monitor
 */
function createMockPerformanceMonitor(config) {
  console.log('🔧 Creating mock performance monitor (three-perf unavailable)');

  const mockState = {
    fps: 60,
    memory: 0,
    drawCalls: 0,
    triangles: 0,
    enabled: true,
    lastUpdate: Date.now()
  };

  const mockControls = {
    start: () => console.log('📊 Mock: Performance monitoring started'),
    stop: () => console.log('📊 Mock: Performance monitoring stopped'),
    toggle: () => console.log('📊 Mock: Performance monitoring toggled'),
    getMetrics: () => ({ ...mockState, timestamp: Date.now() }),
    updateConfig: () => console.log('📊 Mock: Config updated'),
    cleanup: () => console.log('📊 Mock: Performance monitor cleaned up')
  };

  // Create a simple fallback UI
  const fallbackElement = document.createElement('div');
  fallbackElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 165, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    backdrop-filter: blur(10px);
  `;
  fallbackElement.textContent = '📊 Performance Monitor (Fallback)';
  document.body.appendChild(fallbackElement);

  return {
    perf: {
      dom: fallbackElement,
      renderMonitor: {
        begin: () => { },
        end: () => { }
      }
    },
    controls: mockControls,
    state: mockState,
    enabled: true,
    isMock: true
  };
} 