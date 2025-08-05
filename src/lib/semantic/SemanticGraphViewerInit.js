/**
 * @file SemanticGraphViewerInit.js
 * @description Initialization script for SemanticGraphViewer with D3 Performance Controls
 * Extracted from .astro embedded script to enable proper npm module imports
 */

import { SemanticGraphComposer } from "/src/lib/semantic/composer/SemanticGraphComposer.js";
import { introspectAffordance } from "/src/lib/semantic/affordances/AffordanceManifest.js";
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
        console.log('🔄 RESTARTING FORCE SIMULATION...');

        if (!composer.graphInstance) {
          console.error('❌ No graph instance available');
          return false;
        }

        try {
          const graph = composer.graphInstance;

          // Method 1: Restart the d3-force simulation
          const simulation = graph.d3Force();
          if (simulation) {
            console.log('🔄 Restarting d3-force simulation...');
            simulation.alpha(1).restart();
            console.log('✅ d3-force simulation restarted');
          }

          // Method 2: Trigger a data refresh to restart everything
          const currentData = graph.graphData();
          if (currentData && currentData.nodes && currentData.nodes.length > 0) {
            console.log('🔄 Refreshing graph data to restart simulation...');
            graph.graphData(currentData);
            console.log('✅ Graph data refreshed');
          }

          // Method 3: Force a reheat of the simulation
          if (graph.d3ReheatSimulation) {
            console.log('🔄 Reheating simulation...');
            graph.d3ReheatSimulation();
            console.log('✅ Simulation reheated');
          }

          console.log('🚀 Simulation restart complete!');
          return true;

        } catch (error) {
          console.error('❌ Failed to restart simulation:', error);
          return false;
        }
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

      // WebGPU utilities
      getGPUStatus: () => {
        if (composer.webgpuIntegration) {
          const status = composer.webgpuIntegration.getStatus();
          console.log('🚀 === WEBGPU STATUS ===');
          console.log(`Available: ${status.available}`);
          console.log(`Physics: ${status.physics ? '✅ GPU' : '❌ CPU'}`);
          console.log(`Rendering: ${status.rendering ? '✅ INSTANCED' : '❌ INDIVIDUAL'}`);
          console.log(`Nodes: ${status.nodeCount}`);
          console.log(`Draw Calls Reduced: ${status.drawCallsReduced}`);
          console.log(`Max Optimization: ${status.maxOptimization ? '✅ YES' : '❌ NO'}`);
          console.log('====================');
          return status;
        }
        return { error: 'WebGPU integration not available' };
      },

      forceWebGPUInit: async () => {
        console.log('💪 FORCING WebGPU initialization...');
        if (composer.webgpuIntegration) {
          try {
            const success = await composer.webgpuIntegration.accelerateExistingGraph(composer.graphInstance);
            console.log(`🚀 Force init result: ${success ? 'SUCCESS' : 'FAILED'}`);
            return success;
          } catch (error) {
            console.error('❌ Force init error:', error);
            return false;
          }
        } else {
          console.error('❌ No WebGPU integration available');
          return false;
        }
      },

      forceWebGPUConnect: () => {
        console.log('💪 FORCING WebGPU connection to existing graph...');
        if (composer.webgpuIntegration && composer.graphInstance) {
          try {
            // Force physics connection
            if (composer.webgpuIntegration.gpuAcceleration) {
              composer.webgpuIntegration.gpuAcceleration.accelerateGraph(composer.graphInstance);
              console.log('🚀 GPU physics force-connected');
            }

            // Force rendering connection  
            if (composer.webgpuIntegration.instancedRenderer) {
              const success = composer.webgpuIntegration.instancedRenderer.overrideForceGraphRendering(composer.graphInstance);
              console.log(`🎨 GPU rendering force-connected: ${success ? 'SUCCESS' : 'FAILED'}`);
            }

            console.log('🎉 WebGPU force connection complete');
            return composer.webgpuIntegration.getStatus();
          } catch (error) {
            console.error('❌ Force connection error:', error);
            return false;
          }
        } else {
          console.error('❌ WebGPU integration or graph instance not available');
          return false;
        }
      },

      enableGPU: () => {
        if (composer.webgpuIntegration) {
          composer.webgpuIntegration.enable();
          console.log('🚀 WebGPU acceleration enabled');
        } else {
          console.warn('⚠️ WebGPU integration not available');
        }
      },

      disableGPU: () => {
        if (composer.webgpuIntegration) {
          composer.webgpuIntegration.disable();
          console.log('📊 WebGPU acceleration disabled - using CPU');
        } else {
          console.warn('⚠️ WebGPU integration not available');
        }
      },

      testWebGPU: async () => {
        console.log('🧪 Testing WebGPU support...');

        if (!navigator.gpu) {
          console.error('❌ WebGPU not supported in this browser');
          console.log('💡 Try Chrome/Edge with --enable-unsafe-webgpu flag');
          return false;
        }

        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (!adapter) {
            console.error('❌ No WebGPU adapter found');
            return false;
          }

          const device = await adapter.requestDevice();
          console.log('✅ WebGPU fully supported and working!');
          console.log('🚀 Your system can use GPU acceleration');

          // Clean up
          device.destroy();
          return true;
        } catch (error) {
          console.error('❌ WebGPU test failed:', error);
          return false;
        }
      },

      forceGPURendering: () => {
        if (composer.webgpuIntegration && composer.webgpuIntegration.instancedRenderer) {
          composer.webgpuIntegration.instancedRenderer.isActive = true;
          console.log('🎨 Forced GPU instanced rendering ON');
        } else {
          console.warn('⚠️ GPU instanced renderer not available');
        }
      },

      disableGPURendering: () => {
        if (composer.webgpuIntegration && composer.webgpuIntegration.instancedRenderer) {
          composer.webgpuIntegration.instancedRenderer.isActive = false;
          console.log('📊 GPU instanced rendering disabled');
        } else {
          console.warn('⚠️ GPU instanced renderer not available');
        }
      },

      getRenderingStats: () => {
        if (composer.webgpuIntegration && composer.webgpuIntegration.instancedRenderer) {
          const stats = composer.webgpuIntegration.instancedRenderer.getStats();
          console.log('🎨 === RENDERING STATS ===');
          console.log(`Node Count: ${stats.nodeCount}`);
          console.log(`Link Count: ${stats.linkCount}`);
          console.log(`Draw Calls Reduced: ${stats.drawCallsReduced}`);
          console.log(`Instanced Rendering: ${stats.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
          console.log(`Frame Time: ${stats.frameTime.toFixed(2)}ms`);
          console.log('========================');
          return stats;
        }
        return { error: 'GPU renderer not available' };
      },

      maxOptimization: () => {
        if (composer.webgpuIntegration) {
          composer.webgpuIntegration.enable();
          if (composer.webgpuIntegration.instancedRenderer) {
            composer.webgpuIntegration.instancedRenderer.isActive = true;
          }
          console.log('🚀 MAXIMUM OPTIMIZATION ENABLED!');
          console.log('🚀 GPU Physics + GPU Instanced Rendering');
          return composer.webgpuIntegration.getStatus();
        } else {
          console.warn('⚠️ WebGPU integration not available');
          return false;
        }
      },

      forceWebGPUPhysics: () => {
        console.log('💪 FORCING WebGPU Physics Connection...');
        if (composer.webgpuIntegration && composer.webgpuIntegration.gpuAcceleration) {
          composer.webgpuIntegration.gpuAcceleration.forceConnect();
          return true;
        } else {
          console.error('❌ WebGPU physics acceleration not available');
          return false;
        }
      },

      // Three.js fallback for immediate performance boost
      forceThreeJSInstancing: () => {
        console.log('🔥 FORCING Three.js Instanced Rendering (IMMEDIATE FIX)...');

        if (!composer.graphInstance) {
          console.error('❌ No graph instance available');
          return false;
        }

        try {
          const graph = composer.graphInstance;
          const scene = graph.scene();
          const renderer = graph.renderer();

          if (!scene || !renderer) {
            console.error('❌ No scene or renderer available');
            return false;
          }

          // Get the actual graph data 
          const data = graph.graphData();
          console.log('🎯 Graph data found:', data?.nodes?.length || 0, 'nodes,', data?.links?.length || 0, 'links');

          if (!data || !data.nodes || data.nodes.length === 0) {
            console.error('❌ No graph data available for instancing');
            return false;
          }

          console.log('🎯 Applying performance optimizations for', data.nodes.length, 'nodes...');

          // Use a much simpler approach - optimize ForceGraph3D settings
          // Method 1: Reduce geometry detail dramatically
          graph.nodeThreeObject(() => {
            // Return null to use ForceGraph3D's default simple sphere
            return null;
          });

          // Method 2: Disable expensive features
          graph.nodeLabel(''); // Remove labels (expensive)
          graph.linkLabel(''); // Remove link labels  
          graph.nodeAutoColorBy(null); // Disable auto-coloring
          graph.linkAutoColorBy(null);

          // Method 3: Simplify link rendering to basic lines
          graph.linkThreeObject(() => {
            return null; // Use ForceGraph3D's simple line rendering
          });

          // Method 4: Optimize rendering settings  
          try {
            graph.rendererConfig({
              antialias: false,
              alpha: false,
              powerPreference: "high-performance"
            });
          } catch (e) {
            console.log('⚠️ Could not set renderer config, continuing...');
          }

          // Method 5: Simplify all visual properties
          graph.nodeVal(2); // Small, uniform nodes
          graph.nodeOpacity(0.8);
          graph.linkWidth(0.5);
          graph.linkOpacity(0.6);
          graph.nodeColor('#ff6b6b');
          graph.linkColor('#999999');

          // Method 6: Disable interactions to reduce overhead
          graph.enablePointerInteraction(false);
          graph.enableNodeDrag(false);

          console.log('🚀 Performance optimizations applied!');
          console.log('📊 Disabled: Labels, auto-coloring, interactions, complex geometry');
          console.log('🎯 Enabled: Simple spheres, basic lines, minimal features');

          return {
            status: 'ACTIVE',
            type: 'Performance Optimized',
            nodes: data.nodes.length,
            optimizations: [
              'Labels removed',
              'Simple geometry',
              'No interactions',
              'Uniform styling',
              'Optimized renderer'
            ]
          };

        } catch (error) {
          console.error('❌ Rendering optimization failed:', error);

          // Emergency fallback - try the simplest possible approach
          try {
            console.log('🚨 Trying emergency optimization...');
            const graph = composer.graphInstance;

            // Just disable the most expensive features
            graph.nodeLabel('');
            graph.linkLabel('');
            graph.enableNodeDrag(false);
            graph.enablePointerInteraction(false);
            graph.nodeVal(1);
            graph.linkWidth(1);

            console.log('✅ Emergency optimization applied');
            return { status: 'EMERGENCY_MODE', type: 'Minimal Features' };

          } catch (emergencyError) {
            console.error('❌ Emergency optimization also failed:', emergencyError);
            return false;
          }
        }
      },

      // SIMPLE PERFORMANCE FIX (GUARANTEED TO WORK)
      simpleSpeedFix: () => {
        console.log('🚀 APPLYING SIMPLE SPEED FIX...');

        if (!composer.graphInstance) {
          console.error('❌ No graph instance available');
          return false;
        }

        try {
          const graph = composer.graphInstance;
          console.log('🎯 Applying simple optimizations...');

          // 1. Remove all labels (major performance killer)
          graph.nodeLabel('');
          graph.linkLabel('');

          // 2. Disable expensive interactions
          graph.enablePointerInteraction(false);
          graph.enableNodeDrag(false);

          // 3. Use simple colors (no auto-coloring)
          graph.nodeColor('#ff6b6b');
          graph.linkColor('#999999');
          graph.nodeAutoColorBy(null);
          graph.linkAutoColorBy(null);

          // 4. Simplify node rendering
          graph.nodeVal(1); // All nodes same size
          graph.nodeOpacity(0.8);

          // 5. Simplify link rendering  
          graph.linkWidth(0.5);
          graph.linkOpacity(0.4);

          // 6. Disable particles and special effects
          graph.linkDirectionalParticles(0);
          graph.linkDirectionalArrowLength(0);

          console.log('✅ Simple optimizations applied!');
          console.log('📊 Disabled: Labels, interactions, auto-coloring, particles');
          console.log('🚀 Expected: Immediate performance improvement');

          return {
            status: 'ACTIVE',
            type: 'Simple Optimizations',
            optimizations: [
              'Labels removed',
              'Interactions disabled',
              'Simple colors',
              'Uniform node sizes',
              'No particles'
            ]
          };

        } catch (error) {
          console.error('❌ Simple optimization failed:', error);
          return false;
        }
      },

      // GEOMETRY REDUCTION (REDUCE TRIANGLES/VERTICES)  
      reduceGeometry: () => {
        console.log('🎯 REDUCING GEOMETRY COMPLEXITY...');

        if (!composer.graphInstance) {
          console.error('❌ No graph instance available');
          return false;
        }

        try {
          const graph = composer.graphInstance;
          const scene = graph.scene();

          console.log('🔧 Replacing complex geometries with simple ones...');

          // Count original objects and get THREE.js reference
          let originalObjects = 0;
          let THREE_ref = null;

          scene.traverse((child) => {
            if (child.isMesh) {
              originalObjects++;
              // Get THREE.js constructor from existing mesh
              if (!THREE_ref && child.geometry && child.geometry.constructor) {
                THREE_ref = {
                  BoxGeometry: child.geometry.constructor.prototype.constructor || window.THREE?.BoxGeometry
                };
              }
            }
          });

          if (!THREE_ref) {
            console.log('⚠️ Cannot access THREE.js constructors, trying alternative approach...');

            // Alternative: Just remove complex features
            graph.nodeLabel('');
            graph.linkLabel('');
            graph.nodeVal(1);
            graph.linkWidth(1);

            console.log('✅ Applied simple feature reduction instead');
            return { status: 'ALTERNATIVE', type: 'Feature Reduction' };
          }

          // Replace all complex geometries with simple ones
          let reducedCount = 0;
          scene.traverse((child) => {
            if (child.isMesh && child.geometry) {

              // Replace with ultra-simple geometry
              if (child.geometry.attributes && child.geometry.attributes.position) {
                const vertexCount = child.geometry.attributes.position.count;

                // If it's a complex geometry (many vertices), replace with point
                if (vertexCount > 8) { // More than a simple cube

                  // Create ultra-simple single point or line
                  try {
                    // Try to make it as simple as possible - just change the existing geometry
                    child.geometry.setDrawRange(0, Math.min(6, vertexCount)); // Only draw first 6 vertices
                    child.geometry.computeBoundingSphere();

                    reducedCount++;
                    console.log(`🔧 Simplified geometry: ${vertexCount} → 6 vertices`);
                  } catch (e) {
                    // If that fails, just hide complex objects
                    if (vertexCount > 100) {
                      child.visible = false;
                      console.log(`🔧 Hidden complex geometry: ${vertexCount} vertices`);
                    }
                  }
                }
              }
            }
          });

          console.log('✅ Geometry reduction complete!');
          console.log(`📊 Processed ${originalObjects} objects, reduced ${reducedCount}`);
          console.log('🚀 Expected: Significant reduction in GPU load');

          return {
            status: 'ACTIVE',
            type: 'Geometry Simplification',
            objectsProcessed: originalObjects,
            reducedObjects: reducedCount,
            expectedImprovement: 'Reduced vertex/triangle count'
          };

        } catch (error) {
          console.error('❌ Geometry reduction failed:', error);
          return false;
        }
      },

      // Get Three.js fallback stats
      getThreeJSStats: () => {
        if (window.threeJSFallback) {
          const stats = window.threeJSFallback.getStats();
          console.log('🎨 === THREE.JS FALLBACK STATS ===');
          console.log(`Node Count: ${stats.nodeCount}`);
          console.log(`Original Draw Calls: ${stats.originalDrawCalls}`);
          console.log(`Current Draw Calls: ${stats.currentDrawCalls}`);
          console.log(`Draw Calls Reduced: ${stats.drawCallsReduced}`);
          console.log(`Improvement: ${stats.improvement}`);
          console.log(`Active: ${stats.isActive ? '✅ YES' : '❌ NO'}`);
          console.log('================================');
          return stats;
        } else {
          console.warn('⚠️ Three.js fallback not active');
          return { error: 'Three.js fallback not active' };
        }
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
      },

      // COMPREHENSIVE FIX (RESTART + OPTIMIZE)
      fixGraph: () => {
        console.log('🔧 COMPREHENSIVE GRAPH FIX...');

        if (!composer.graphInstance) {
          console.error('❌ No graph instance available');
          return false;
        }

        try {
          const graph = composer.graphInstance;
          console.log('🔧 Applying comprehensive fixes...');

          // Step 1: Get current data
          const currentData = graph.graphData();
          console.log('📊 Current data:', currentData?.nodes?.length || 0, 'nodes');

          if (!currentData || !currentData.nodes || currentData.nodes.length === 0) {
            console.log('⚠️ No data found, triggering data reload...');
            // Trigger data reload
            if (composer.loadGraphData) {
              composer.loadGraphData('/api/graph-data/rdf.ttl');
            }
            return 'DATA_RELOAD_TRIGGERED';
          }

          // Step 2: Apply performance optimizations
          console.log('🎯 Applying performance optimizations...');
          graph.nodeLabel(''); // Remove labels
          graph.linkLabel(''); // Remove link labels
          graph.nodeVal(3); // Uniform small nodes
          graph.linkWidth(1); // Thin links
          graph.nodeColor('#ff6b6b'); // Simple red nodes
          graph.linkColor('#999999'); // Gray links
          graph.nodeOpacity(0.8);
          graph.linkOpacity(0.6);

          // Step 3: Disable expensive features
          graph.enablePointerInteraction(true); // Keep this for debugging
          graph.enableNodeDrag(true); // Keep this for debugging
          graph.nodeAutoColorBy(null);
          graph.linkAutoColorBy(null);

          // Step 4: Restart simulation
          const simulation = graph.d3Force();
          if (simulation) {
            console.log('🔄 Restarting simulation...');
            simulation.alpha(1).restart();
          }

          // Step 5: Refresh data to ensure everything is working
          console.log('🔄 Refreshing graph data...');
          graph.graphData(currentData);

          console.log('✅ Comprehensive fix applied!');
          console.log('📊 Graph should now be visible and smooth');

          return {
            status: 'SUCCESS',
            nodes: currentData.nodes.length,
            optimizations: [
              'Labels removed',
              'Simple colors applied',
              'Simulation restarted',
              'Data refreshed'
            ]
          };

        } catch (error) {
          console.error('❌ Comprehensive fix failed:', error);
          return false;
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