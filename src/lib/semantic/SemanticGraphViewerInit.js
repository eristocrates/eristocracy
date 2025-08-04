/**
 * @file SemanticGraphViewerInit.js
 * @description Initialization script for SemanticGraphViewer with D3 Performance Controls
 * Extracted from .astro embedded script to enable proper npm module imports
 */

import { SemanticGraphComposer } from "/src/lib/semantic/composer/SemanticGraphComposer.js";
import { introspectAffordance } from "/src/lib/semantic/affordances/AffordanceManifest.js";
import * as d3 from "d3";
import { D3PerformanceControls } from "/src/lib/semantic/performance/D3PerformanceControls.js";
import { performanceStateManager } from "/src/lib/semantic/performance/PerformanceState.js";

// Initialize the semantic graph system when DOM is ready
async function initializeSemanticGraph() {
  console.log("Initializing SemanticGraphViewer...");

  // Verify DOM elements exist with clean selectors
  const graphSelector = "#three-d-graph";
  const panelSelector = "#control-panel";

  console.log("Looking for graph element with selector:", graphSelector);

  // Try multiple approaches to find the element
  const graphElement = document.querySelector(graphSelector);
  const graphById = document.getElementById("three-d-graph");

  console.log("querySelector result:", graphElement);
  console.log("getElementById result:", graphById);
  console.log(
    "All elements with id:",
    Array.from(document.querySelectorAll("[id]")).map((el) => el.id)
  );

  if (!graphElement && !graphById) {
    console.error("Graph element not found with any method");
    throw new Error("Graph element not found: " + graphSelector);
  }

  const finalGraphElement = graphElement || graphById;
  console.log("Using graph element:", finalGraphElement);

  console.log("Looking for panel element with selector:", panelSelector);
  const panelElement = document.querySelector(panelSelector);
  const panelById = document.getElementById("control-panel");

  console.log("querySelector result:", panelElement);
  console.log("getElementById result:", panelById);

  if (!panelElement && !panelById) {
    console.error("Panel element not found with any method");
    throw new Error("Panel element not found: " + panelSelector);
  }

  const finalPanelElement = panelElement || panelById;
  console.log("Using panel element:", finalPanelElement);

  let composer = null;

  try {
    composer = new SemanticGraphComposer({
      // Override defaults if needed
      graphContainer: graphSelector,
      panelContainer: panelSelector,
      fileSelector: "#ttl-select",
      statusElement: "#graph-status",
      metricsElement: "#graph-metrics",
      enableRecoveryToggle: true,
      enablePanelDrag: true,
    });

    // Initialize the composer now that DOM is ready
    await composer.init();

    // Initialize D3 Performance Controls
    let performanceControls = null;
    try {
      const performanceContainer = document.getElementById(
        "d3-performance-controls"
      );
      if (performanceContainer) {
        console.log(
          "🔬 Performance container found, initializing controls..."
        );

        performanceControls = new D3PerformanceControls(
          performanceContainer,
          {
            enableRealTimeMonitoring: true,
            enablePresets: true,
            enableURLState: true,
            autoSave: true,
          }
        );

        // Connect to the graph instance with retry logic
        const connectPerformanceMonitor = () => {
          console.log("🔬 Attempting to connect performance monitor...");
          console.log("🔬 Composer graphInstance:", composer.graphInstance);
          console.log(
            "🔬 GraphInstance type:",
            typeof composer.graphInstance
          );

          if (composer.graphInstance) {
            console.log("🔬 Graph instance available, connecting...");
            console.log(
              "🔬 Graph instance renderer:",
              composer.graphInstance.renderer()
            );

            performanceControls.connectToGraph(composer.graphInstance);

            // Set up parameter change callback
            performanceControls.onParameterChange(
              (key, newValue, oldValue) => {
                console.log(
                  `🎮 Parameter changed: ${key} = ${newValue} (was ${oldValue})`
                );
              }
            );

            // Set up preset load callback
            performanceControls.onPresetLoad((presetKey, preset) => {
              console.log(`🎯 Loaded preset: ${presetKey}`);
            });

            // Set up performance alert callback
            performanceControls.onPerformanceAlert((alerts) => {
              console.warn("⚠️ Performance alerts from D3 controls:", alerts);
            });

            console.log(
              "🎮 D3 Performance Controls connected to ForceGraph3D"
            );
            return true;
          } else {
            console.warn(
              "🔬 Graph instance not yet available, will retry..."
            );
            return false;
          }
        };

        // Try to connect immediately
        if (!connectPerformanceMonitor()) {
          // If immediate connection fails, retry after delays
          setTimeout(() => {
            if (!connectPerformanceMonitor()) {
              setTimeout(() => {
                if (!connectPerformanceMonitor()) {
                  console.error(
                    "🔬 Failed to connect performance monitor after retries"
                  );
                }
              }, 2000);
            }
          }, 500);
        }

        // Add listener for when new data is loaded to reapply colors
        if (composer && performanceControls) {
          const originalLoadGraphData = composer.loadGraphData.bind(composer);
          composer.loadGraphData = async function (...args) {
            const result = await originalLoadGraphData(...args);

            // Reapply colors after data loads
            setTimeout(() => {
              console.log('🎨 Reapplying colors after data load...');
              performanceControls.applyAllColors();
              // Store original data for filtering
              performanceControls.storeOriginalData();
            }, 300);

            return result;
          };
        }

        // Store globally for debugging
        window.d3PerformanceControls = performanceControls;
      } else {
        console.warn("D3 Performance Controls container not found");
      }
    } catch (error) {
      console.error("Failed to initialize D3 Performance Controls:", error);
    }

    // Development introspection
    const introspectBtn = document.getElementById("introspect-btn");
    const debugOutput = document.getElementById("debug-output");

    if (introspectBtn && debugOutput) {
      introspectBtn.addEventListener("click", () => {
        const affordances = [
          "GraphRenderer",
          "GraphEvents",
          "PanelContainer",
          "PanelRecovery",
          "FileManager",
          "StatusManager",
          "EventCoordinator",
        ];

        const introspection = affordances.map((id) => ({
          id,
          ...introspectAffordance(id),
        }));

        debugOutput.innerHTML = `
          <pre>${JSON.stringify(introspection, null, 2)}</pre>
        `;

        console.log("🔍 Affordance Introspection:", introspection);
      });
    }

    // Setup performance monitor toggle
    const perfToggleBtn = document.getElementById("perf-monitor-toggle");
    if (perfToggleBtn && composer.performanceAffordance) {
      perfToggleBtn.addEventListener("click", () => {
        composer.performanceAffordance.togglePerformanceMonitor();
        console.log("Performance monitor toggled");
      });
    }

    // Setup simulation restart button
    const restartSimBtn = document.getElementById("restart-simulation-btn");
    if (restartSimBtn) {
      restartSimBtn.addEventListener("click", () => {
        const result = window.debugGraph.restartSimulation();
        if (result.success) {
          restartSimBtn.textContent = "✅ Restarted";
          setTimeout(() => {
            restartSimBtn.textContent = "🔥 Restart Simulation";
          }, 2000);
        } else {
          restartSimBtn.textContent = "❌ Failed";
          setTimeout(() => {
            restartSimBtn.textContent = "🔥 Restart Simulation";
          }, 2000);
        }
      });
    }

    // Store globally for debugging
    window.semanticGraphComposer = composer;

    // Initialize Panel Window Management System
    class PanelManager {
      constructor() {
        this.panels = new Map();
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };

        this.initializePanels();
        this.setupEventListeners();
      }

      initializePanels() {
        // Register the main control panel
        this.panels.set('control', {
          element: document.getElementById('control-panel'),
          isMinimized: false,
          isClosed: false,
          defaultSize: { width: 420, height: 600 },
          defaultPosition: { top: 20, left: 20 }
        });
      }

      setupEventListeners() {
        // Panel drag handlers
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Panel control buttons
        document.querySelectorAll('.minimize-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelId = btn.getAttribute('data-panel');
            this.minimizePanel(panelId);
          });
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelId = btn.getAttribute('data-panel');
            this.closePanel(panelId);
          });
        });

        // Recovery buttons
        document.querySelectorAll('.recovery-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const panelId = btn.getAttribute('data-panel');
            this.restorePanel(panelId);
          });
        });
      }

      handleMouseDown(e) {
        const panelHeader = e.target.closest('.panel-header');
        const resizeHandle = e.target.closest('.resize-handle');

        if (resizeHandle) {
          this.startResize(e, resizeHandle.closest('.floating-panel'));
        } else if (panelHeader) {
          this.startDrag(e, panelHeader.closest('.floating-panel'));
        }
      }

      startDrag(e, panel) {
        this.isDragging = true;
        this.currentPanel = panel;

        const rect = panel.getBoundingClientRect();
        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };

        panel.style.cursor = 'grabbing';
      }

      startResize(e, panel) {
        this.isResizing = true;
        this.currentPanel = panel;

        this.resizeStart = {
          x: e.clientX,
          y: e.clientY,
          width: panel.offsetWidth,
          height: panel.offsetHeight
        };
      }

      handleMouseMove(e) {
        if (this.isDragging && this.currentPanel) {
          const x = e.clientX - this.dragOffset.x;
          const y = e.clientY - this.dragOffset.y;

          this.currentPanel.style.left = Math.max(0, x) + 'px';
          this.currentPanel.style.top = Math.max(0, y) + 'px';
          this.currentPanel.style.right = 'auto';
        }

        if (this.isResizing && this.currentPanel) {
          const deltaX = e.clientX - this.resizeStart.x;
          const deltaY = e.clientY - this.resizeStart.y;

          const newWidth = Math.max(300, this.resizeStart.width + deltaX);
          const newHeight = Math.max(150, this.resizeStart.height + deltaY);

          this.currentPanel.style.width = newWidth + 'px';
          this.currentPanel.style.height = newHeight + 'px';
        }
      }

      handleMouseUp(e) {
        if (this.isDragging) {
          this.currentPanel.style.cursor = 'move';
          this.isDragging = false;
        }

        if (this.isResizing) {
          this.isResizing = false;
        }

        this.currentPanel = null;
      }

      minimizePanel(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;

        const panel = panelData.element;
        const content = panel.querySelector('.panel-content');

        if (panelData.isMinimized) {
          // Restore
          content.style.display = 'block';
          panel.querySelector('.minimize-btn').textContent = '−';
          panelData.isMinimized = false;
        } else {
          // Minimize
          content.style.display = 'none';
          panel.querySelector('.minimize-btn').textContent = '+';
          panelData.isMinimized = true;
        }
      }

      closePanel(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;

        panelData.element.style.display = 'none';
        panelData.isClosed = true;

        // Show recovery button
        const recoveryBtn = document.querySelector(`[data-panel="${panelId}"].recovery-btn`);
        if (recoveryBtn) {
          recoveryBtn.style.display = 'flex';
        }
      }

      restorePanel(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;

        panelData.element.style.display = 'block';
        panelData.isClosed = false;

        // Hide recovery button
        const recoveryBtn = document.querySelector(`[data-panel="${panelId}"].recovery-btn`);
        if (recoveryBtn) {
          recoveryBtn.style.display = 'none';
        }

        // If it was minimized, restore content too
        if (panelData.isMinimized) {
          this.minimizePanel(panelId);
        }
      }

      resetPanelPositions() {
        this.panels.forEach((panelData, panelId) => {
          const panel = panelData.element;
          const pos = panelData.defaultPosition;
          const size = panelData.defaultSize;

          // Reset position
          panel.style.left = pos.left + 'px';
          panel.style.top = pos.top + 'px';
          panel.style.right = 'auto';

          // Reset size
          panel.style.width = size.width + 'px';
          panel.style.height = size.height + 'px';
        });
      }
    }

    // Initialize panel manager
    const panelManager = new PanelManager();
    window.panelManager = panelManager;

    // Add debugging utilities
    window.debugGraph = {
      inspect: async () => {
        if (composer.graphInstance) {
          const { inspectScene } = await import(
            "/src/lib/semantic/graph/function/forceCleanup.js"
          );
          return inspectScene(composer.graphInstance);
        }
        return { error: "No graph instance" };
      },

      forceCleanup: async () => {
        if (composer.graphInstance) {
          const { forceCleanup } = await import(
            "/src/lib/semantic/graph/function/forceCleanup.js"
          );
          return forceCleanup(composer.graphInstance);
        }
        return { error: "No graph instance" };
      },

      restartSimulation: () => {
        if (composer.graphInstance) {
          try {
            // Force restart the simulation
            composer.graphInstance.resumeAnimation();

            // Reset cooldown and reheat
            if (typeof composer.graphInstance.cooldownTicks === "function") {
              composer.graphInstance.cooldownTicks(300);
            }
            if (
              typeof composer.graphInstance.reheatSimulation === "function"
            ) {
              composer.graphInstance.reheatSimulation();
            }

            console.log("🔥 Force simulation restarted manually");
            return { success: true, message: "Simulation restarted" };
          } catch (error) {
            console.error("❌ Failed to restart simulation:", error);
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: "No graph instance" };
      },

      isSimulationRunning: () => {
        if (composer.graphInstance && composer.currentData?.nodes?.length > 0) {
          // Simple check if nodes are moving
          const firstNode = composer.currentData.nodes[0];
          return firstNode.vx !== 0 || firstNode.vy !== 0 || firstNode.vz !== 0;
        }
        return false;
      },

      // Panel management utilities
      resetPanels: () => panelManager.resetPanelPositions(),
      minimizePanel: (id = 'control') => panelManager.minimizePanel(id),
      closePanel: (id = 'control') => panelManager.closePanel(id),
      restorePanel: (id = 'control') => panelManager.restorePanel(id),

      // Nuclear optimization utilities
      applyNuclearOptimizations: () => {
        if (performanceControls && performanceControls.nuclearOptimizer) {
          performanceControls.applyNuclearOptimizations();
          console.log('💀 Nuclear optimizations applied via debug');
        } else {
          console.warn('⚠️ Nuclear optimizer not available');
        }
      },

      restoreNormalRendering: () => {
        if (performanceControls && performanceControls.nuclearOptimizer) {
          performanceControls.restoreNormalRendering();
          console.log('🔄 Normal rendering restored via debug');
        } else {
          console.warn('⚠️ Nuclear optimizer not available');
        }
      },

      loadNuclearPreset: () => {
        if (performanceControls) {
          performanceControls.loadPreset('nuclear');
          console.log('💀 Nuclear preset loaded via debug');
        } else {
          console.warn('⚠️ Performance controls not available');
        }
      },

      // Data filtering utilities
      showAllData: () => {
        if (performanceControls) {
          performanceStateManager.updateParameters({
            showInstances: true,
            showClasses: true,
            showLiterals: true,
            enableMaxNodeLimit: false,
            enableMinDegreeFilter: false
          });
          console.log('🔍 All data filters disabled - showing full dataset');
        } else {
          console.warn('⚠️ Performance controls not available');
        }
      },

      hideClasses: () => {
        if (performanceControls) {
          performanceStateManager.updateParameter('showClasses', false);
          console.log('🔍 Classes hidden');
        }
      },

      hideInstances: () => {
        if (performanceControls) {
          performanceStateManager.updateParameter('showInstances', false);
          console.log('🔍 Instances hidden');
        }
      },

      hideLiterals: () => {
        if (performanceControls) {
          performanceStateManager.updateParameter('showLiterals', false);
          console.log('🔍 Literals hidden');
        }
      },

      filterByDegree: (minDegree = 2) => {
        if (performanceControls) {
          performanceStateManager.updateParameters({
            enableMinDegreeFilter: true,
            minNodeDegree: minDegree
          });
          console.log(`🔍 Filtering nodes with degree >= ${minDegree}`);
        }
      },

      limitNodes: (maxCount = 50) => {
        if (performanceControls) {
          performanceStateManager.updateParameters({
            enableMaxNodeLimit: true,
            maxNodeCount: maxCount
          });
          console.log(`🔍 Limiting to ${maxCount} nodes`);
        }
      },

      getDataStats: () => {
        if (performanceControls && performanceControls.originalGraphData) {
          const original = performanceControls.originalGraphData;
          const current = composer.graphInstance ? composer.graphInstance.graphData() : null;
          return {
            original: { nodes: original.nodes.length, links: original.links.length },
            current: current ? { nodes: current.nodes.length, links: current.links.length } : null,
            filtered: current ? (original.nodes.length - current.nodes.length) : 0
          };
        }
        return { error: 'No data available' };
      },

      getDrawCalls: () => {
        if (composer.graphInstance && composer.graphInstance.renderer()) {
          const info = composer.graphInstance.renderer().info.render;
          console.log('📊 Current Renderer Stats:');
          console.log(`   Draw Calls: ${info.calls}`);
          console.log(`   Triangles: ${info.triangles}`);
          console.log(`   Geometries: ${composer.graphInstance.renderer().info.memory.geometries}`);
          return info;
        } else {
          console.warn('⚠️ Renderer not available');
          return null;
        }
      }
    };

    console.log("SemanticGraphViewer initialized successfully");
    console.log(
      "🎮 D3 Performance Laboratory: Kinesthetic parameter control with real-time feedback enabled"
    );
    console.log(
      "ℹ️ Note: Any 'unsupported GPOS/GSUB table' warnings are harmless font rendering notices and can be ignored."
    );

    // Force simulation monitoring (Development mode)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setTimeout(() => {
        const checkSimulationRunning = () => {
          if (
            window.debugGraph &&
            window.debugGraph.isSimulationRunning &&
            !window.debugGraph.isSimulationRunning()
          ) {
            console.warn(
              "🚨 Force simulation has stopped! Use window.debugGraph.restartSimulation() to restart."
            );
          }
        };

        setInterval(checkSimulationRunning, 5000);
        console.log("🔍 Development: Force simulation monitoring started");
      }, 3000);
    }
  } catch (error) {
    console.error("Failed to initialize SemanticGraphComposer:", error);

    // Show error to user
    const errorDiv = document.createElement("div");
    errorDiv.className = "initialization-error";
    errorDiv.innerHTML = `
      <h3>Initialization Error</h3>
      <p>Failed to initialize the semantic graph system:</p>
      <pre>${error.message}</pre>
      <button onclick="location.reload()">Reload Page</button>
    `;
    document.body.appendChild(errorDiv);

    throw error; // Re-throw to prevent further execution
  }
}

// Export initialization function
export { initializeSemanticGraph };

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSemanticGraph);
} else {
  // DOM is already ready
  initializeSemanticGraph();
} 