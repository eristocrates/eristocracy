import * as d3 from 'd3';
import { curveMonotoneX } from 'd3-shape';
import * as THREE from 'three';
import { MaterialComplexityAnalyzer } from './MaterialComplexityAnalyzer.js';
import { InstancingAnalyzer } from './InstancingAnalyzer.js';
import { InteractionProfiler } from './InteractionProfiler.js';
import { NetworkAssetProfiler } from './NetworkAssetProfiler.js';

/**
 * Comprehensive Performance Profiler for Three.js Fiddle
 * Maximum data collection + D3 declarative visualization
 */
export class FiddlePerformanceProfiler {
  constructor(options = {}) {
    this.options = {
      updateInterval: 100,
      historyLength: 100,
      enableAdvancedMetrics: true,
      enableInteractionProfiling: true,
      enableNetworkProfiling: true,
      startCollapsed: true, // Start in collapsed quick stats mode
      ...options
    };

    this.startTime = performance.now();
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.isCollapsed = this.options.startCollapsed;
    this.gpuInfo = null;

    // Metrics storage
    this.metrics = {
      frame: { fps: [], frameTime: [], deltaTime: [], drops: [], jank: [] },
      threejs: { drawCalls: [], triangles: [], geometries: [], textures: [], materials: [], shaderSwitches: [] },
      javascript: { executionTime: [], gcEvents: [], heapSize: [], eventLoopLag: [] },
      system: { cpuUsage: [], memoryUsage: [], thermalState: [], batteryLevel: [] },
      custom: {}
    };

    // D3 setup
    this.width = 420;
    this.height = 650;
    this.scales = {};
    this.svg = null;

    // New analyzers
    this.materialAnalyzer = new MaterialComplexityAnalyzer();
    this.instancingAnalyzer = new InstancingAnalyzer();
    this.interactionProfiler = this.options.enableInteractionProfiling ?
      new InteractionProfiler() : null;
    this.networkProfiler = this.options.enableNetworkProfiling ?
      new NetworkAssetProfiler() : null;

    // Advanced analysis data
    this.lastMaterialAnalysis = null;
    this.lastInstancingAnalysis = null;
    this.currentScene = null;

    this.initialize();
  }

  /**
   * Initialize the performance observatory (with logging)
   */
  initialize() {
    console.log('🔬 Initializing Performance Observatory...');

    // Initialize core metrics structure
    this.metrics = {
      frame: { fps: [], frameTime: [], deltaTime: [], drops: [], jank: [] },
      threejs: { drawCalls: [], triangles: [], points: [], lines: [], geometries: [], textures: [] },
      javascript: { executionTime: [], gcEvents: [], heapSize: [], eventLoopLag: [] },
      system: { cpuUsage: [], memoryUsage: [], thermalState: [], batteryLevel: [] },
      performance: { cpuRenderTime: [], estimatedGPUTime: [], bottleneck: [] },
      spatial: { totalObjects: [], visibleObjects: [], maxDensity: [], hotspots: [], cullingEfficiency: [] },
      entities: { totalCount: [], totalTriangles: [], avgTrianglesPerEntity: [] },
      gpu: { estimatedGeometryMemoryMB: [], estimatedTextureMemoryMB: [], estimatedTotalMemoryMB: [], memoryPressure: [] },
      custom: {}
    };

    console.log('📊 Metrics structure initialized');

    // Setup GPU info detection directly
    try {
      // Try to get WebGL context for GPU info
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          this.gpuInfo = {
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            webglVersion: 'WebGL 1.0'
          };
        } else {
          // Fallback to basic WebGL info
          this.gpuInfo = {
            renderer: gl.getParameter(gl.RENDERER) || 'Unknown GPU',
            vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
            webglVersion: 'WebGL 1.0'
          };
        }
      }

      // Try WebGL2 as well
      const gl2 = canvas.getContext('webgl2');
      if (gl2 && this.gpuInfo) {
        this.gpuInfo.webglVersion = 'WebGL 2.0';
      }

      console.log('🎮 GPU info detected:', this.gpuInfo?.renderer || 'Unknown');
    } catch (error) {
      console.warn('⚠️ Could not detect GPU info:', error.message);
      this.gpuInfo = {
        renderer: 'Unknown GPU',
        vendor: 'Unknown',
        webglVersion: 'Unknown'
      };
    }

    // Create the observatory UI
    this.createContainer();
    this.createTitleBar();
    this.createContent();
    this.setupInteractivity();

    console.log('🎨 Observatory UI created');

    // Start profiling
    this.startProfiling();

    // Initialize advanced analyzers
    if (this.options.enableAdvancedMetrics) {
      this.materialAnalyzer = new MaterialComplexityAnalyzer();
      this.instancingAnalyzer = new InstancingAnalyzer();
      console.log('🔧 Advanced analyzers initialized');
    }

    if (this.options.enableInteractionProfiling && this.interactionProfiler) {
      this.interactionProfiler.startProfiling();
      console.log('⚡ Interaction profiling started');
    }

    console.log('✅ Performance Observatory fully initialized and running');
  }

  /**
   * Create the main container SVG element
   */
  createContainer() {
    // Create container element if specified by string selector
    let container;
    if (typeof this.options.container === 'string') {
      container = document.querySelector(this.options.container);
      if (!container) {
        // Create the container if it doesn't exist
        container = document.createElement('div');
        container.id = this.options.container.replace('#', '');
        document.body.appendChild(container);
      }
    } else {
      container = this.options.container || document.body;
    }

    // Create main DIV container
    this.svg = d3.select(container)
      .append('div')
      .attr('class', 'performance-observatory')
      .attr('width', this.width)
      .attr('height', this.isCollapsed ? 35 : this.height)
      .style('position', 'fixed')
      .style('top', '60px')
      .style('right', '20px')
      .style('background', 'rgba(0, 0, 0, 0.75)')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)')
      .style('backdrop-filter', 'blur(6px)')
      .style('border', '1px solid rgba(255, 255, 255, 0.15)')
      .style('z-index', '10000')
      .style('font-family', 'monospace')
      .style('font-size', '11px')
      .style('overflow', 'hidden');
  }

  /**
   * Setup advanced performance observers
   */
  setupPerformanceObservers() {
    // Performance Observer for detailed timing
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({
          entryTypes: ['measure', 'navigation', 'resource', 'paint', 'largest-contentful-paint']
        });
      } catch (e) {
        console.warn('Some performance entries not supported:', e);
      }
    }

    // Memory Observer (if available)
    if ('memory' in performance) {
      this.setupMemoryProfiling();
    }

    // GPU Observer (experimental)
    if ('gpu' in navigator) {
      this.setupGPUProfiling();
    }
  }

  /**
   * Create the main UI container
   */
  createTitleBar() {
    this.titleBar = this.svg.append('div')
      .attr('class', 'observatory-titlebar')
      .style('background', 'linear-gradient(90deg, #0078d4, #106ebe)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '10px 10px 0 0')
      .style('cursor', 'move')
      .style('user-select', 'none')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('font-weight', 'bold')
      .style('border-bottom', '1px solid #555');

    // Title and quick stats (shown when collapsed)
    const leftSection = this.titleBar.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '12px');

    leftSection.append('span')
      .text('🔬 Performance Observatory');

    // Quick stats container (shown when collapsed)
    this.quickStatsContainer = leftSection.append('div')
      .attr('id', 'quick-stats-container')
      .style('display', 'none')
      .style('color', 'rgba(255,255,255,0.9)')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('display', 'flex')
      .style('gap', '8px');

    // Control buttons
    const controls = this.titleBar.append('div')
      .style('display', 'flex')
      .style('gap', '8px');

    // Collapse button
    this.collapseBtn = controls.append('button')
      .attr('class', 'collapse-btn')
      .style('background', 'rgba(255,255,255,0.2)')
      .style('border', 'none')
      .style('color', 'white')
      .style('width', '24px')
      .style('height', '24px')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('font-size', '12px')
      .text('−')
      .on('click', () => this.toggleCollapse());

    // Close button
    controls.append('button')
      .attr('class', 'close-btn')
      .style('background', 'rgba(255,255,255,0.2)')
      .style('border', 'none')
      .style('color', 'white')
      .style('width', '24px')
      .style('height', '24px')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('font-size', '12px')
      .text('×')
      .on('click', () => this.hide());
  }

  /**
   * Toggle between collapsed (quick stats) and expanded (full observatory) modes
   */
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      // Show quick stats mode
      this.svg.classed('collapsed', true);
      this.svg.style('height', '45px'); // Just the title bar
      if (this.contentArea) {
        this.contentArea.style('display', 'none');
      }
      this.quickStatsContainer.style('display', 'flex');
      this.collapseBtn.text('+');

      // Update quick stats
      this.updateQuickStats();

    } else {
      // Show full observatory mode
      this.svg.classed('collapsed', false);
      this.svg.style('height', this.height + 'px');
      if (this.contentArea) {
        this.contentArea.style('display', 'block');
      }
      this.quickStatsContainer.style('display', 'none');
      this.collapseBtn.text('−');
    }
  }

  /**
   * Update quick stats display (for collapsed mode)
   */
  updateQuickStats() {
    if (!this.quickStatsContainer) return;

    const fps = this.getLatestMetric('frame.fps');
    const memory = this.getLatestMetric('javascript.heapSize');
    const drawCalls = this.getLatestMetric('threejs.drawCalls');

    this.quickStatsContainer.html('');

    if (fps !== undefined) {
      const fpsColor = fps > 45 ? '#00ff00' : fps > 25 ? '#ffff00' : '#ff6b6b';
      this.quickStatsContainer.append('span')
        .style('color', fpsColor)
        .text(`FPS: ${Math.round(fps)}`);
    }

    if (memory !== undefined) {
      this.quickStatsContainer.append('span')
        .style('color', '#4ecdc4')
        .text(`MEM: ${memory}MB`);
    }

    if (drawCalls !== undefined) {
      const callsColor = drawCalls < 50 ? '#00ff00' : drawCalls < 100 ? '#ffff00' : '#ff6b6b';
      this.quickStatsContainer.append('span')
        .style('color', callsColor)
        .text(`DRAWS: ${drawCalls}`);
    }

    if (this.gpuInfo) {
      const gpuText = this.gpuInfo.renderer.length > 12 ?
        this.gpuInfo.renderer.substring(0, 12) + '...' :
        this.gpuInfo.renderer;
      this.quickStatsContainer.append('span')
        .style('color', '#45b7d1')
        .text(`GPU: ${gpuText}`);
    }
  }

  /**
   * Create content area
   */
  createContent() {
    this.contentArea = this.svg.append('div')
      .attr('class', 'observatory-content')
      .style('width', '100%')
      .style('height', this.height - 45 + 'px') // Title bar height
      .style('background', 'rgba(0, 0, 0, 0.6)') // More transparent
      .style('backdrop-filter', 'blur(4px)')
      .style('border-radius', '0 0 8px 8px')
      .style('padding', '12px')
      .style('box-sizing', 'border-box')
      .style('overflow-y', 'auto')
      .style('border-top', '1px solid rgba(255, 255, 255, 0.1)')
      .style('display', this.isCollapsed ? 'none' : 'block');

    this.setupCharts(this.contentArea);
    this.setupAdvancedPanels(this.contentArea);
  }

  /**
   * Setup charts (comprehensive D3 visualization)
   */
  setupCharts(container) {
    // Create charts section
    const chartsSection = container.append('div')
      .attr('class', 'charts-container')
      .style('background', 'rgba(255,255,255,0.05)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('margin-bottom', '12px');

    chartsSection.append('div')
      .style('color', '#4ecdc4')
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .style('margin-bottom', '8px')
      .text('Real-time Performance Charts');

    // Create individual chart containers
    this.createFPSChart(chartsSection);
    this.createDrawCallsChart(chartsSection);
    this.createMemoryChart(chartsSection);
    this.createFrameTimeChart(chartsSection);

    // Real-time metrics display
    const metricsGrid = container.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', 'repeat(auto-fit, minmax(120px, 1fr))')
      .style('gap', '8px')
      .style('margin-bottom', '12px');

    this.createMetricDisplay(metricsGrid, 'fps', 'FPS', '#00ff00');
    this.createMetricDisplay(metricsGrid, 'drawCalls', 'Draw Calls', '#ff6b6b');
    this.createMetricDisplay(metricsGrid, 'memory', 'Memory', '#4ecdc4');
    this.createMetricDisplay(metricsGrid, 'triangles', 'Triangles', '#ffa500');
    this.createMetricDisplay(metricsGrid, 'gpu', 'GPU', '#45b7d1');
  }

  /**
   * Create FPS chart with D3
   */
  createFPSChart(container) {
    const chartContainer = container.append('div')
      .style('background', 'rgba(0,255,0,0.1)')
      .style('border-left', '3px solid #00ff00')
      .style('padding', '8px')
      .style('margin-bottom', '8px')
      .style('border-radius', '4px');

    chartContainer.append('div')
      .style('font-size', '11px')
      .style('color', '#00ff00')
      .style('font-weight', 'bold')
      .text('FPS Timeline');

    this.fpsChart = chartContainer.append('svg')
      .attr('width', 360)
      .attr('height', 60)
      .style('background', 'rgba(0,0,0,0.3)');

    // Setup scales
    this.fpsScale = {
      x: d3.scaleLinear().domain([0, 100]).range([0, 360]),
      y: d3.scaleLinear().domain([0, 120]).range([60, 0])
    };
  }

  /**
   * Create Draw Calls chart with D3
   */
  createDrawCallsChart(container) {
    const chartContainer = container.append('div')
      .style('background', 'rgba(255,107,107,0.1)')
      .style('border-left', '3px solid #ff6b6b')
      .style('padding', '8px')
      .style('margin-bottom', '8px')
      .style('border-radius', '4px');

    chartContainer.append('div')
      .style('font-size', '11px')
      .style('color', '#ff6b6b')
      .style('font-weight', 'bold')
      .text('Draw Calls Timeline');

    this.drawCallsChart = chartContainer.append('svg')
      .attr('width', 360)
      .attr('height', 60)
      .style('background', 'rgba(0,0,0,0.3)');

    this.drawCallsScale = {
      x: d3.scaleLinear().domain([0, 100]).range([0, 360]),
      y: d3.scaleLinear().domain([0, 500]).range([60, 0])
    };
  }

  /**
   * Create Memory chart with D3
   */
  createMemoryChart(container) {
    const chartContainer = container.append('div')
      .style('background', 'rgba(78,205,196,0.1)')
      .style('border-left', '3px solid #4ecdc4')
      .style('padding', '8px')
      .style('margin-bottom', '8px')
      .style('border-radius', '4px');

    chartContainer.append('div')
      .style('font-size', '11px')
      .style('color', '#4ecdc4')
      .style('font-weight', 'bold')
      .text('Memory Usage Timeline');

    this.memoryChart = chartContainer.append('svg')
      .attr('width', 360)
      .attr('height', 60)
      .style('background', 'rgba(0,0,0,0.3)');

    this.memoryScale = {
      x: d3.scaleLinear().domain([0, 100]).range([0, 360]),
      y: d3.scaleLinear().domain([0, 200]).range([60, 0])
    };
  }

  /**
   * Create Frame Time chart with D3
   */
  createFrameTimeChart(container) {
    const chartContainer = container.append('div')
      .style('background', 'rgba(255,165,0,0.1)')
      .style('border-left', '3px solid #ffa500')
      .style('padding', '8px')
      .style('margin-bottom', '8px')
      .style('border-radius', '4px');

    chartContainer.append('div')
      .style('font-size', '11px')
      .style('color', '#ffa500')
      .style('font-weight', 'bold')
      .text('Frame Time Timeline');

    this.frameTimeChart = chartContainer.append('svg')
      .attr('width', 360)
      .attr('height', 60)
      .style('background', 'rgba(0,0,0,0.3)');

    this.frameTimeScale = {
      x: d3.scaleLinear().domain([0, 100]).range([0, 360]),
      y: d3.scaleLinear().domain([0, 50]).range([60, 0])
    };
  }

  /**
   * Create metric display with D3 (fixed structure)
   */
  createMetricDisplay(container, key, label, color) {
    const display = container.append('div')
      .attr('class', `metric-display-${key}`)
      .style('background', 'rgba(255,255,255,0.05)')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('text-align', 'center')
      .style('border-left', `2px solid ${color}`);

    // Small label text at top
    display.append('div')
      .style('font-size', '9px')
      .style('color', '#888')
      .style('margin-bottom', '2px')
      .text(label);

    // Large value text (this should show the actual numbers)
    const valueDisplay = display.append('div')
      .attr('class', `value-${key}`)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('color', color)
      .text('--');

    // Store reference for updates - FIX: Store the value display, not the whole display
    if (!this.displays) this.displays = {};
    this.displays[key] = valueDisplay; // This should point to the value div, not the display div

    return display;
  }

  /**
   * Update D3 charts with latest data
   */
  updateCharts() {
    // Update FPS chart
    if (this.fpsChart && this.metrics.frame.fps.length > 0) {
      const data = this.metrics.frame.fps.slice(-100);
      this.updateLineChart(this.fpsChart, data, this.fpsScale, '#00ff00');
    }

    // Update Draw Calls chart  
    if (this.drawCallsChart && this.metrics.threejs.drawCalls.length > 0) {
      const data = this.metrics.threejs.drawCalls.slice(-100);
      this.updateLineChart(this.drawCallsChart, data, this.drawCallsScale, '#ff6b6b');
    }

    // Update Memory chart
    if (this.memoryChart && this.metrics.javascript.heapSize.length > 0) {
      const data = this.metrics.javascript.heapSize.slice(-100);
      this.updateLineChart(this.memoryChart, data, this.memoryScale, '#4ecdc4');
    }

    // Update Frame Time chart
    if (this.frameTimeChart && this.metrics.frame.frameTime.length > 0) {
      const data = this.metrics.frame.frameTime.slice(-100);
      this.updateLineChart(this.frameTimeChart, data, this.frameTimeScale, '#ffa500');
    }
  }

  /**
   * Update individual line chart
   */
  updateLineChart(chartSvg, data, scale, color) {
    // Create line generator
    const line = d3.line()
      .x((d, i) => scale.x(i))
      .y(d => scale.y(d))
      .curve(curveMonotoneX);

    // Update or create path
    let path = chartSvg.select('.data-line');
    if (path.empty()) {
      path = chartSvg.append('path')
        .attr('class', 'data-line')
        .attr('fill', 'none')
        .attr('stroke-width', 2);
    }

    path.attr('stroke', color)
      .attr('d', line(data));

    // Add dots for recent data points
    const dots = chartSvg.selectAll('.data-dot')
      .data(data.slice(-10));

    dots.enter()
      .append('circle')
      .attr('class', 'data-dot')
      .attr('r', 2)
      .attr('fill', color)
      .merge(dots)
      .attr('cx', (d, i) => scale.x(data.length - 10 + i))
      .attr('cy', d => scale.y(d));

    dots.exit().remove();
  }

  /**
   * Setup advanced panels (comprehensive analysis with new metrics)
   */
  setupAdvancedPanels(container) {
    // Advanced Analysis Section
    const analysisSection = container.append('div')
      .attr('class', 'advanced-panels')
      .style('background', 'rgba(255,255,255,0.05)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('margin-bottom', '12px');

    analysisSection.append('div')
      .style('color', '#ff6b6b')
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .style('margin-bottom', '12px')
      .text('Advanced Performance Analysis');

    // Create analysis panels
    this.createGPUCPUTimingPanel(analysisSection);
    this.createSpatialDensityPanel(analysisSection);
    this.createEntityContributionPanel(analysisSection);
    this.createGPUMemoryPanel(analysisSection);
    this.createMaterialAnalysisPanel(analysisSection);
    this.createInstancingAnalysisPanel(analysisSection);
    this.createInteractionAnalysisPanel(analysisSection);
    this.createNetworkAnalysisPanel(analysisSection);
    this.createSystemInfoPanel(analysisSection);
    this.createRecommendationsPanel(analysisSection);
  }

  /**
   * Create GPU vs CPU Timing Analysis Panel
   */
  createGPUCPUTimingPanel(container) {
    const panel = this.createAnalysisPanel(container, 'GPU vs CPU Timing', 'gpu-cpu-timing', '#9b59b6');

    this.gpuCPUTimingContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Analyzing bottlenecks...');
  }

  /**
   * Create Spatial Density Analysis Panel
   */
  createSpatialDensityPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Spatial Density', 'spatial-density', '#e67e22');

    this.spatialDensityContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Analyzing viewport density...');
  }

  /**
   * Create Entity Contribution Analysis Panel
   */
  createEntityContributionPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Entity Contribution', 'entity-contribution', '#2ecc71');

    this.entityContributionContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Analyzing per-entity costs...');
  }

  /**
   * Create GPU Memory Analysis Panel
   */
  createGPUMemoryPanel(container) {
    const panel = this.createAnalysisPanel(container, 'GPU Memory Usage', 'gpu-memory', '#e74c3c');

    this.gpuMemoryContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Estimating GPU memory usage...');
  }

  /**
   * Create Material Complexity Analysis Panel
   */
  createMaterialAnalysisPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Material Complexity', 'material-analysis', '#ff6b6b');

    this.materialAnalysisContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Analyzing materials...');
  }

  /**
   * Create Instancing Opportunities Panel  
   */
  createInstancingAnalysisPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Instancing Opportunities', 'instancing-analysis', '#ffa500');

    this.instancingAnalysisContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Detecting instancing opportunities...');
  }

  /**
   * Create Interaction Performance Panel
   */
  createInteractionAnalysisPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Interaction Performance', 'interaction-analysis', '#45b7d1');

    this.interactionAnalysisContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Monitoring interaction responsiveness...');
  }

  /**
   * Create Network Asset Performance Panel
   */
  createNetworkAnalysisPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Network Asset Performance', 'network-analysis', '#4ecdc4');

    this.networkAnalysisContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Profiling network asset loading...');
  }

  /**
   * Create System Information Panel
   */
  createSystemInfoPanel(container) {
    const panel = this.createAnalysisPanel(container, 'System Information', 'system-info', '#9b59b6');

    this.systemInfoContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px');

    // Display GPU info immediately if available
    if (this.gpuInfo) {
      this.updateSystemInfoDisplay();
    }
  }

  /**
   * Create Recommendations Panel
   */
  createRecommendationsPanel(container) {
    const panel = this.createAnalysisPanel(container, 'Performance Recommendations', 'recommendations', '#e74c3c');

    this.recommendationsContent = panel.append('div')
      .style('color', '#ccc')
      .style('font-size', '11px')
      .text('Generating recommendations...');
  }

  /**
   * Create a consistent analysis panel (fixed title display)
   */
  createAnalysisPanel(container, title, className, color) {
    const panel = container.append('div')
      .attr('class', `analysis-panel ${className}`)
      .style('background', 'rgba(255,255,255,0.03)')
      .style('border-left', `2px solid ${color}`)
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('margin-bottom', '6px')
      .style('cursor', 'pointer')
      .on('click', () => this.togglePanelDetails(className));

    // Panel header
    const header = panel.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('margin-bottom', '4px');

    // FIX: Ensure title is properly set as text
    header.append('div')
      .style('font-weight', 'bold')
      .style('color', color)
      .style('font-size', '11px')
      .text(String(title)); // Ensure title is converted to string

    header.append('div')
      .attr('class', `toggle-${className}`)
      .style('color', '#666')
      .style('font-size', '10px')
      .text('▼');

    return panel;
  }

  /**
   * Toggle panel details visibility
   */
  togglePanelDetails(className) {
    const panel = d3.select(`.${className}`);
    const toggle = d3.select(`.toggle-${className}`);
    const content = panel.selectAll(':not(:first-child)');

    const isExpanded = toggle.text() === '▲';

    if (isExpanded) {
      content.style('display', 'none');
      toggle.text('▼');
    } else {
      content.style('display', 'block');
      toggle.text('▲');
    }
  }

  /**
   * Update material analysis display (fixed undefined values)
   */
  updateMaterialAnalysisDisplay() {
    if (!this.materialAnalysisContent) return;

    // Add some logging for debugging
    if (this.lastMaterialAnalysis) {
      console.log('Material analysis data:', this.lastMaterialAnalysis);
    }

    const analysis = this.lastMaterialAnalysis;
    let html = '';

    if (analysis && analysis.summary) {
      const summary = analysis.summary;
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #ff6b6b; font-weight: bold;">Materials: ${summary.totalMaterials || 'N/A'}</div>
        <div style="color: #ffa500;">Avg Complexity: ${(summary.averageComplexity || 0).toFixed(1)}</div>
        <div style="color: #4ecdc4;">Total Meshes: ${summary.totalMeshes || 'N/A'}</div>
      </div>`;
    }

    if (analysis && analysis.optimizations && analysis.optimizations.length > 0) {
      html += '<div style="color: #ff6b6b; font-size: 10px; margin-top: 4px;">Optimizations:</div>';
      analysis.optimizations.slice(0, 3).forEach(opt => {
        // FIX: Handle case where opt might be an object
        const optText = typeof opt === 'string' ? opt : (opt.message || opt.description || 'Optimization available');
        html += `<div style="color: #ccc; font-size: 9px;">• ${optText}</div>`;
      });
    } else {
      html += '<div style="color: #888; font-size: 10px;">No optimizations needed</div>';
    }

    this.materialAnalysisContent.html(html);
  }

  /**
   * Update instancing analysis display (fixed undefined values)
   */
  updateInstancingAnalysisDisplay() {
    if (!this.instancingAnalysisContent) return;

    // Add some logging for debugging
    if (this.lastInstancingAnalysis) {
      console.log('Instancing analysis data:', this.lastInstancingAnalysis);
    }

    const analysis = this.lastInstancingAnalysis;
    let html = '';

    if (analysis && analysis.statistics) {
      const stats = analysis.statistics;
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #ffa500; font-weight: bold;">Current Draw Calls: ${stats.currentDrawCalls || 0}</div>
        <div style="color: #00ff00;">Potential Reduction: ${stats.potentialDrawCalls || 0}</div>
        <div style="color: #4ecdc4;">Savings: ${(stats.reductionPercentage || 0).toFixed(0)}%</div>
      </div>`;
    }

    if (analysis && analysis.opportunities && analysis.opportunities.length > 0) {
      html += '<div style="color: #ffa500; font-size: 10px; margin-top: 4px;">Top Opportunities:</div>';
      analysis.opportunities.slice(0, 2).forEach(opp => {
        const instanceCount = opp.instanceCount || 0;
        const drawCallReduction = opp.drawCallReduction || 0;
        html += `<div style="color: #ccc; font-size: 9px;">• ${instanceCount} instances → ${drawCallReduction} less calls</div>`;
      });
    } else {
      html += '<div style="color: #888; font-size: 10px;">No instancing opportunities found</div>';
    }

    this.instancingAnalysisContent.html(html);
  }

  /**
   * Update interaction analysis display
   */
  updateInteractionAnalysisDisplay() {
    if (!this.interactionAnalysisContent || !this.interactionProfiler) return;

    const metrics = this.interactionProfiler.getRealTimeMetrics();
    let html = '';

    html += `<div style="margin-bottom: 8px;">
      <div style="color: #45b7d1; font-weight: bold;">Responsiveness: ${metrics.responsiveness}/100</div>
      <div style="color: ${metrics.averageLatency > 16 ? '#ff6b6b' : '#00ff00'};">Avg Latency: ${metrics.averageLatency.toFixed(1)}ms</div>
      <div style="color: #4ecdc4;">Events/sec: ${metrics.eventsPerSecond}</div>
    </div>`;

    if (metrics.slowEvents > 0) {
      html += `<div style="color: #ff6b6b; font-size: 10px;">⚠️ ${metrics.slowEvents} slow events detected</div>`;
    }

    this.interactionAnalysisContent.html(html);
  }

  /**
   * Update network analysis display
   */
  updateNetworkAnalysisDisplay() {
    if (!this.networkAnalysisContent || !this.networkProfiler) return;

    const analysis = this.networkProfiler.getAnalysis();
    let html = '';

    if (analysis.summary) {
      const summary = analysis.summary;
      html += `<div style="margin-bottom: 8px;">
        <div style="color: #4ecdc4; font-weight: bold;">Assets Loaded: ${summary.totalAssets}</div>
        <div style="color: #ffa500;">Avg Load Time: ${summary.averageLoadTime.toFixed(0)}ms</div>
        <div style="color: ${summary.cacheHitRate > 70 ? '#00ff00' : '#ff6b6b'};">Cache Hit Rate: ${summary.cacheHitRate}%</div>
      </div>`;

      if (summary.totalSize) {
        html += `<div style="color: #9b59b6; font-size: 10px;">Total Size: ${(summary.totalSize / 1024).toFixed(1)}KB</div>`;
      }
    }

    this.networkAnalysisContent.html(html);
  }

  /**
   * Update system information display
   */
  updateSystemInfoDisplay() {
    if (!this.systemInfoContent) return;

    let html = '';

    if (this.gpuInfo) {
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #9b59b6; font-weight: bold;">GPU: ${this.gpuInfo.renderer}</div>
        <div style="color: #4ecdc4; font-size: 10px;">WebGL: ${this.gpuInfo.webglVersion}</div>
      </div>`;
    }

    html += `<div style="font-size: 10px;">
      <div style="color: #ffa500;">CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}</div>
      <div style="color: #45b7d1;">Memory: ${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown'}</div>
      <div style="color: #4ecdc4;">Platform: ${navigator.platform}</div>
    </div>`;

    this.systemInfoContent.html(html);
  }

  /**
   * Update recommendations display (clean format)
   */
  updateRecommendationsDisplay() {
    if (!this.recommendationsContent) return;

    const recommendations = this.generateRecommendations();
    let html = '';

    if (recommendations.length === 0) {
      html = '<div style="color: #00ff00;">Performance looks optimal</div>';
    } else {
      recommendations.slice(0, 4).forEach(rec => {
        const color = rec.priority === 'high' ? '#ff6b6b' : rec.priority === 'medium' ? '#ffa500' : '#4ecdc4';
        html += `<div style="color: ${color}; font-size: 10px; margin-bottom: 2px;">• ${rec.message}</div>`;
      });
    }

    this.recommendationsContent.html(html);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // FPS recommendations
    const latestFPS = this.getLatestMetric('frame.fps');
    if (latestFPS !== undefined && latestFPS < 30) {
      recommendations.push({
        priority: 'high',
        message: 'Low FPS detected - consider reducing draw calls or geometry complexity'
      });
    }

    // Memory recommendations
    const latestMemory = this.getLatestMetric('javascript.heapSize');
    if (latestMemory !== undefined && latestMemory > 100) {
      recommendations.push({
        priority: 'medium',
        message: 'High memory usage - consider texture optimization or geometry cleanup'
      });
    }

    // Draw calls recommendations
    const latestDrawCalls = this.getLatestMetric('threejs.drawCalls');
    if (latestDrawCalls !== undefined && latestDrawCalls > 100) {
      recommendations.push({
        priority: 'high',
        message: 'High draw calls - consider instancing or material consolidation'
      });
    }

    // Material analysis recommendations
    if (this.lastMaterialAnalysis?.optimizations?.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: `${this.lastMaterialAnalysis.optimizations.length} material optimizations available`
      });
    }

    // Instancing recommendations  
    if (this.lastInstancingAnalysis?.opportunities?.length > 0) {
      const reduction = this.lastInstancingAnalysis.potentialDrawCallReduction;
      recommendations.push({
        priority: reduction > 20 ? 'high' : 'medium',
        message: `Instancing could save ${reduction} draw calls`
      });
    }

    return recommendations;
  }

  /**
   * Setup drag and resize functionality
   */
  setupInteractivity() {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    // Make draggable
    this.titleBar.on('mousedown', (event) => {
      isDragging = true;
      const rect = this.svg.node().getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left;
      dragOffset.y = event.clientY - rect.top;
      event.preventDefault();
    });

    d3.select(document).on('mousemove', (event) => {
      if (isDragging) {
        const x = event.clientX - dragOffset.x;
        const y = event.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 200;

        this.svg
          .style('left', Math.max(0, Math.min(maxX, x)) + 'px')
          .style('top', Math.max(0, Math.min(maxY, y)) + 'px')
          .style('right', 'auto');
      }
    });

    d3.select(document).on('mouseup', () => {
      isDragging = false;
    });

    // Prevent text selection while dragging
    this.titleBar.on('selectstart', () => false);
  }

  /**
   * Hide the observatory
   */
  hide() {
    this.svg.style('display', 'none');
  }

  /**
   * Show the observatory
   */
  show() {
    this.svg.style('display', 'block');
  }

  /**
   * Create real-time numeric displays
   */
  createRealtimeDisplays() {
    const displays = this.contentArea
      .append('div')
      .attr('class', 'realtime-displays')
      .style('display', 'grid')
      .style('grid-template-columns', '1fr 1fr')
      .style('gap', '10px')
      .style('margin-bottom', '15px');

    // FPS Display
    this.displays = {
      fps: this.createMetricDisplay(displays, 'FPS', '0', '#00ff00'),
      frameTime: this.createMetricDisplay(displays, 'Frame Time', '0ms', '#ffff00'),
      drawCalls: this.createMetricDisplay(displays, 'Draw Calls', '0', '#ff6b6b'),
      triangles: this.createMetricDisplay(displays, 'Triangles', '0', '#4ecdc4'),
      memory: this.createMetricDisplay(displays, 'Memory', '0MB', '#ffa500'),
      gpu: this.createMetricDisplay(displays, 'GPU', 'N/A', '#9370db')
    };
  }

  /**
   * Create D3 charts for historical data
   */
  createCharts() {
    const chartsContainer = this.contentArea
      .append('div')
      .attr('class', 'charts-container');

    // FPS Chart
    this.charts.fps = this.createTimeSeriesChart(
      chartsContainer,
      'FPS History',
      380,
      100,
      { min: 0, max: 120, color: '#00ff00' }
    );

    // Frame Time Chart
    this.charts.frameTime = this.createTimeSeriesChart(
      chartsContainer,
      'Frame Time (ms)',
      380,
      100,
      { min: 0, max: 50, color: '#ffff00' }
    );

    // Draw Calls Chart
    this.charts.drawCalls = this.createTimeSeriesChart(
      chartsContainer,
      'Draw Calls',
      380,
      80,
      { min: 0, max: 100, color: '#ff6b6b' }
    );

    // Memory Chart
    this.charts.memory = this.createTimeSeriesChart(
      chartsContainer,
      'Memory Usage (MB)',
      380,
      80,
      { min: 0, max: 200, color: '#ffa500' }
    );
  }

  createTimeSeriesChart(parent, title, width, height, config) {
    const container = parent
      .append('div')
      .style('margin-bottom', '15px');

    container.append('div')
      .style('font-size', '12px')
      .style('color', '#ccc')
      .style('margin-bottom', '5px')
      .text(title);

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', 'rgba(255,255,255,0.05)')
      .style('border', '1px solid #444');

    const xScale = d3.scaleLinear()
      .domain([0, this.options.historyLength])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([config.min, config.max])
      .range([height, 0]);

    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(curveMonotoneX);

    const path = svg.append('path')
      .style('fill', 'none')
      .style('stroke', config.color)
      .style('stroke-width', 2);

    return {
      svg,
      path,
      xScale,
      yScale,
      line,
      data: []
    };
  }

  /**
   * Create advanced analysis panels
   */
  createAdvancedPanels() {
    const advanced = this.contentArea
      .append('div')
      .attr('class', 'advanced-panels')
      .style('margin-top', '15px');

    // Performance Score
    this.createPerformanceScore(advanced);

    // Bottleneck Detection
    this.createBottleneckDetector(advanced);

    // Optimization Suggestions
    this.createOptimizationSuggestions(advanced);
  }

  createPerformanceScore(parent) {
    const panel = parent
      .append('div')
      .style('background', 'rgba(255,255,255,0.1)')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('margin-bottom', '10px');

    panel.append('div')
      .style('font-weight', 'bold')
      .style('color', '#fff')
      .text('Performance Score');

    this.performanceScore = panel
      .append('div')
      .style('font-size', '24px')
      .style('text-align', 'center')
      .style('margin', '10px 0')
      .text('100');

    this.performanceDetails = panel
      .append('div')
      .style('font-size', '10px')
      .style('color', '#ccc');
  }

  createBottleneckDetector(parent) {
    const panel = parent
      .append('div')
      .style('background', 'rgba(255,255,255,0.1)')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('margin-bottom', '10px');

    panel.append('div')
      .style('font-weight', 'bold')
      .style('color', '#fff')
      .text('Bottleneck Analysis');

    this.bottleneckDisplay = panel
      .append('div')
      .style('font-size', '11px')
      .style('color', '#ccc')
      .text('Analyzing...');
  }

  createOptimizationSuggestions(parent) {
    const panel = parent
      .append('div')
      .style('background', 'rgba(255,255,255,0.1)')
      .style('padding', '10px')
      .style('border-radius', '4px');

    panel.append('div')
      .style('font-weight', 'bold')
      .style('color', '#fff')
      .text('Optimization Suggestions');

    this.suggestionsDisplay = panel
      .append('div')
      .style('font-size', '11px')
      .style('color', '#ccc');
  }

  /**
   * Start the profiling loop
   */
  startProfiling() {
    const profileFrame = () => {
      this.collectMetrics();
      this.updateVisualizations();
      this.analyzePerformance();

      setTimeout(profileFrame, this.options.updateInterval);
    };

    profileFrame();
  }

  /**
   * Collect all performance metrics
   */
  collectMetrics() {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    // Frame metrics
    const fps = Math.round(1000 / deltaTime);
    this.addMetric('frame.fps', fps);
    this.addMetric('frame.frameTime', deltaTime);
    this.addMetric('frame.deltaTime', deltaTime);

    // JavaScript metrics with better memory detection
    if (performance.memory) {
      const heapMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      this.addMetric('javascript.heapSize', heapMB);
    } else {
      // Fallback memory estimation
      this.addMetric('javascript.heapSize', this.estimateMemoryUsage());
    }

    // Basic GPU detection and info
    this.updateGPUInfo();

    this.lastFrameTime = now;
    this.frameCount++;
  }

  /**
   * Estimate memory usage when performance.memory is unavailable
   */
  estimateMemoryUsage() {
    // Basic heuristic based on scene complexity and time running
    const runTimeMinutes = (performance.now() - this.startTime) / 60000;
    const baseUsage = 15; // Base 15MB estimate
    const timeGrowth = Math.min(runTimeMinutes * 2, 20); // Up to 20MB growth over time

    return Math.round(baseUsage + timeGrowth);
  }

  /**
   * Update GPU information
   */
  updateGPUInfo() {
    if (this.gpuInfo) return; // Only detect once

    try {
      // Try to get WebGL context for GPU info
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

          this.gpuInfo = {
            vendor: vendor || 'Unknown',
            renderer: renderer || 'Unknown',
            webglVersion: gl.getParameter(gl.VERSION) || 'Unknown',
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown'
          };
        } else {
          this.gpuInfo = {
            vendor: 'Unknown',
            renderer: 'WebGL Available',
            webglVersion: gl.getParameter(gl.VERSION) || 'Unknown',
            shadingLanguageVersion: 'Unknown'
          };
        }
      } else {
        this.gpuInfo = {
          vendor: 'No WebGL',
          renderer: 'Software',
          webglVersion: 'None',
          shadingLanguageVersion: 'None'
        };
      }

      // Clean up
      canvas.remove();
    } catch (error) {
      this.gpuInfo = {
        vendor: 'Detection Failed',
        renderer: 'Unknown',
        webglVersion: 'Unknown',
        shadingLanguageVersion: 'Unknown'
      };
    }
  }

  /**
   * Collect Three.js specific metrics
   */
  collectThreeJSMetrics(renderer, scene = null) {
    if (!renderer || !renderer.info) return;

    const info = renderer.info;
    this.addMetric('threejs.drawCalls', info.render.calls);
    this.addMetric('threejs.triangles', info.render.triangles);
    this.addMetric('threejs.geometries', info.memory.geometries);
    this.addMetric('threejs.textures', info.memory.textures);

    // Store scene reference for advanced analysis
    if (scene) {
      this.currentScene = scene;
      this.runAdvancedAnalysis();
    }
  }

  /**
   * Run advanced scene analysis
   */
  runAdvancedAnalysis() {
    if (!this.currentScene) return;

    try {
      // Material complexity analysis
      this.lastMaterialAnalysis = this.materialAnalyzer.analyzeScene(this.currentScene);
      this.addMetric('advanced.materialComplexity', this.lastMaterialAnalysis.summary.averageComplexity);
      this.addMetric('advanced.materialCount', this.lastMaterialAnalysis.totalMaterials);

      // Instancing opportunities analysis
      this.lastInstancingAnalysis = this.instancingAnalyzer.analyzeScene(this.currentScene);
      this.addMetric('advanced.instancingOpportunities', this.lastInstancingAnalysis.opportunities.length);
      this.addMetric('advanced.potentialDrawCallReduction', this.lastInstancingAnalysis.potentialDrawCallReduction);

      // Update advanced panels with new data
      this.updateAdvancedPanelsContent();

    } catch (error) {
      console.warn('Advanced analysis failed:', error);
    }
  }

  /**
   * Update all advanced panels content
   */
  updateAdvancedPanelsContent() {
    // New advanced panels
    this.updateGPUCPUTimingDisplay();
    this.updateSpatialDensityDisplay();
    this.updateEntityContributionDisplay();
    this.updateGPUMemoryDisplay();

    // Existing panels
    this.updateMaterialAnalysisDisplay();
    this.updateInstancingAnalysisDisplay();
    this.updateInteractionAnalysisDisplay();
    this.updateNetworkAnalysisDisplay();
    this.updateSystemInfoDisplay();
    this.updateRecommendationsDisplay();
  }

  /**
   * Update material analysis panel
   */
  updateMaterialAnalysisPanel() {
    const analysis = this.lastMaterialAnalysis;
    if (!analysis) return;

    let materialPanel = this.contentArea.select('.material-analysis-panel');
    if (materialPanel.empty()) {
      materialPanel = this.createAnalysisPanel('Material Analysis', 'material-analysis-panel');
    }

    const content = [
      `📊 ${analysis.totalMaterials} materials, ${analysis.totalMeshes} meshes`,
      `🎯 Avg complexity: ${analysis.summary.averageComplexity.toFixed(1)}`,
      `⚡ ${analysis.optimizations.length} optimization opportunities`,
      `🔮 ${analysis.summary.recommendation}`
    ];

    materialPanel.select('.panel-content')
      .selectAll('.analysis-line')
      .data(content)
      .join('div')
      .attr('class', 'analysis-line')
      .style('font-size', '10px')
      .style('color', '#ccc')
      .style('margin', '2px 0')
      .text(d => d);

    // Add detailed breakdown on click
    materialPanel.select('.panel-title')
      .style('cursor', 'pointer')
      .on('click', () => {
        console.log('🎨 Material Analysis Details:', analysis);
      });
  }

  /**
   * Update instancing analysis panel
   */
  updateInstancingAnalysisPanel() {
    const analysis = this.lastInstancingAnalysis;
    if (!analysis) return;

    let instancingPanel = this.contentArea.select('.instancing-analysis-panel');
    if (instancingPanel.empty()) {
      instancingPanel = this.createAnalysisPanel('Instancing Opportunities', 'instancing-analysis-panel');
    }

    const content = [
      `🔄 ${analysis.opportunities.length} instancing opportunities`,
      `📉 Potential ${analysis.potentialDrawCallReduction} draw call reduction`,
      `⚖️ Current instancing ratio: ${(analysis.instancingRatio * 100).toFixed(1)}%`,
      `🎯 ${analysis.recommendations.length} recommendations available`
    ];

    instancingPanel.select('.panel-content')
      .selectAll('.analysis-line')
      .data(content)
      .join('div')
      .attr('class', 'analysis-line')
      .style('font-size', '10px')
      .style('color', '#ccc')
      .style('margin', '2px 0')
      .text(d => d);

    // Add detailed breakdown on click
    instancingPanel.select('.panel-title')
      .style('cursor', 'pointer')
      .on('click', () => {
        console.log('🔄 Instancing Analysis Details:', analysis);
        if (analysis.opportunities.length > 0) {
          console.log('💡 Top opportunity:', analysis.opportunities[0]);
        }
      });
  }

  /**
   * Update interaction analysis panel
   */
  updateInteractionAnalysisPanel() {
    if (!this.interactionProfiler) return;

    const analysis = this.interactionProfiler.getRealTimeMetrics();

    let interactionPanel = this.contentArea.select('.interaction-analysis-panel');
    if (interactionPanel.empty()) {
      interactionPanel = this.createAnalysisPanel('Input Responsiveness', 'interaction-analysis-panel');
    }

    const content = [
      `🎮 Responsiveness: ${analysis.responsiveness}/100`,
      `⚡ Avg latency: ${analysis.averageLatency.toFixed(1)}ms`,
      `📊 ${analysis.totalEvents} events tracked`,
      `🚨 ${analysis.slowEventPercentage}% slow events`
    ];

    interactionPanel.select('.panel-content')
      .selectAll('.analysis-line')
      .data(content)
      .join('div')
      .attr('class', 'analysis-line')
      .style('font-size', '10px')
      .style('color', this.getResponsivenessColor(analysis.responsiveness))
      .style('margin', '2px 0')
      .text(d => d);

    // Add detailed breakdown on click
    interactionPanel.select('.panel-title')
      .style('cursor', 'pointer')
      .on('click', () => {
        console.log('🎮 Interaction Analysis Details:', this.interactionProfiler.getAnalysis());
      });
  }

  /**
   * Update network analysis panel
   */
  updateNetworkAnalysisPanel() {
    if (!this.networkProfiler) return;

    const analysis = this.networkProfiler.getAnalysis();

    let networkPanel = this.contentArea.select('.network-analysis-panel');
    if (networkPanel.empty()) {
      networkPanel = this.createAnalysisPanel('Network Performance', 'network-analysis-panel');
    }

    if (analysis.summary.message) {
      networkPanel.select('.panel-content')
        .text(analysis.summary.message)
        .style('font-size', '10px')
        .style('color', '#888');
      return;
    }

    const content = [
      `🌐 ${analysis.summary.totalAssets} assets loaded`,
      `📦 Total size: ${analysis.summary.totalSizeMB} MB`,
      `⚡ Avg load time: ${analysis.summary.averageLoadTime}ms`,
      `💾 Cache hit rate: ${analysis.summary.cacheHitRate}%`
    ];

    networkPanel.select('.panel-content')
      .selectAll('.analysis-line')
      .data(content)
      .join('div')
      .attr('class', 'analysis-line')
      .style('font-size', '10px')
      .style('color', '#ccc')
      .style('margin', '2px 0')
      .text(d => d);

    // Add detailed breakdown on click
    networkPanel.select('.panel-title')
      .style('cursor', 'pointer')
      .on('click', () => {
        console.log('🌐 Network Analysis Details:', analysis);
      });
  }

  /**
   * Create a new analysis panel
   */
  createAnalysisPanel(title, className) {
    const panel = this.contentArea
      .append('div')
      .attr('class', `analysis-panel ${className}`)
      .style('background', 'rgba(255,255,255,0.08)')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('margin-bottom', '8px')
      .style('border-left', '3px solid #0078d4');

    panel.append('div')
      .attr('class', 'panel-title')
      .style('font-weight', 'bold')
      .style('color', '#fff')
      .style('font-size', '11px')
      .style('margin-bottom', '4px')
      .text(title);

    panel.append('div')
      .attr('class', 'panel-content');

    return panel;
  }

  /**
   * Get color based on responsiveness score
   */
  getResponsivenessColor(score) {
    if (score >= 80) return '#00ff00';
    if (score >= 60) return '#ffff00';
    if (score >= 40) return '#ffa500';
    return '#ff6b6b';
  }

  /**
 * Add metric to history with automatic cleanup
 * Defensive implementation that creates missing paths
 */
  addMetric(path, value) {
    const keys = path.split('.');
    let current = this.metrics;

    // Create missing intermediate objects
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Create missing array if it doesn't exist
    const finalKey = keys[keys.length - 1];
    if (!current[finalKey]) {
      current[finalKey] = [];
    }

    const array = current[finalKey];
    array.push(value);

    // Keep only recent history
    if (array.length > this.options.historyLength) {
      array.shift();
    }
  }

  /**
   * Update all D3 visualizations with logging
   */
  updateVisualizations() {
    // Get latest metrics
    const fps = this.getLatestMetric('frame.fps');
    const memory = this.getLatestMetric('javascript.heapSize');
    const drawCalls = this.getLatestMetric('threejs.drawCalls');
    const triangles = this.getLatestMetric('threejs.triangles');

    // Add console logging to show data is flowing
    if (fps !== undefined || drawCalls !== undefined) {
      console.log(`Performance Update: FPS=${fps}, DrawCalls=${drawCalls}, Memory=${memory}MB`);
    }

    // Update D3 charts
    this.updateCharts();

    // Update metric displays if they exist
    if (this.displays) {
      if (fps !== undefined && this.displays.fps) {
        this.displays.fps.text(Math.round(fps))
          .style('color', fps > 45 ? '#00ff00' : fps > 25 ? '#ffff00' : '#ff6b6b');
      }

      if (memory !== undefined && this.displays.memory) {
        this.displays.memory.text(memory + 'MB')
          .style('color', memory > 100 ? '#ff6b6b' : '#4ecdc4');
      }

      if (drawCalls !== undefined && this.displays.drawCalls) {
        this.displays.drawCalls.text(drawCalls)
          .style('color', drawCalls < 50 ? '#00ff00' : drawCalls < 100 ? '#ffff00' : '#ff6b6b');
      }

      if (triangles !== undefined && this.displays.triangles) {
        this.displays.triangles.text(triangles.toLocaleString())
          .style('color', '#ffa500');
      }

      if (this.gpuInfo && this.displays.gpu) {
        const gpuText = this.gpuInfo.renderer.length > 15 ?
          this.gpuInfo.renderer.substring(0, 15) + '...' :
          this.gpuInfo.renderer;
        this.displays.gpu.text(gpuText)
          .style('color', '#45b7d1');
      }
    }

    // Update all advanced analysis panels
    this.updateAdvancedPanelsContent();

    // Update quick stats if collapsed
    if (this.isCollapsed) {
      this.updateQuickStats();
    }
  }

  updateDisplay(key, value, suffix) {
    if (this.displays[key] && value !== undefined) {
      const displayValue = typeof value === 'number' ?
        (value < 1 ? value.toFixed(2) : Math.round(value)) :
        value;
      this.displays[key].value.text(displayValue + suffix);
    }
  }

  updateChart(key, data) {
    if (!this.charts[key] || !data.length) return;

    const chart = this.charts[key];
    chart.data = data;

    chart.path
      .datum(data)
      .attr('d', chart.line);
  }

  /**
   * Advanced performance analysis
   */
  analyzePerformance() {
    const recentFPS = this.metrics.frame.fps.slice(-60); // Last second
    const avgFPS = recentFPS.reduce((a, b) => a + b, 0) / recentFPS.length;

    // Calculate performance score (0-100)
    let score = 100;
    if (avgFPS < 60) score -= (60 - avgFPS) * 2;
    if (this.getLatestMetric('threejs.drawCalls') > 50) score -= 20;

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Update performance score display if it exists
    if (this.performanceScore) {
      this.performanceScore.text(score)
        .style('color', score > 80 ? '#00ff00' : score > 50 ? '#ffff00' : '#ff0000');
    }

    // Bottleneck detection
    this.detectBottlenecks();

    // Generate suggestions
    this.generateSuggestions();
  }

  detectBottlenecks() {
    const fps = this.getLatestMetric('frame.fps');
    const drawCalls = this.getLatestMetric('threejs.drawCalls');
    const triangles = this.getLatestMetric('threejs.triangles');

    let bottleneck = 'Performance: Optimal';

    if (fps < 30) {
      if (drawCalls > 100) {
        bottleneck = 'Bottleneck: Too many draw calls';
      } else if (triangles > 100000) {
        bottleneck = 'Bottleneck: High triangle count';
      } else {
        bottleneck = 'Bottleneck: CPU/JavaScript bound';
      }
    } else if (fps < 50) {
      bottleneck = 'Performance: Moderate issues';
    }

    // Update bottleneck display if it exists
    if (this.bottleneckDisplay) {
      this.bottleneckDisplay.text(bottleneck);
    }
  }

  generateSuggestions() {
    const suggestions = [];
    const drawCalls = this.getLatestMetric('threejs.drawCalls');
    const triangles = this.getLatestMetric('threejs.triangles');
    const fps = this.getLatestMetric('frame.fps');

    if (drawCalls > 50) {
      suggestions.push('• Reduce draw calls with instancing');
    }
    if (triangles > 50000) {
      suggestions.push('• Use simpler geometry or LOD');
    }
    if (fps < 45) {
      suggestions.push('• Consider reducing visual effects');
    }
    if (suggestions.length === 0) {
      suggestions.push('• Performance is optimal!');
    }

    // Update suggestions display if it exists
    if (this.suggestionsDisplay) {
      this.suggestionsDisplay.html(suggestions.join('<br>'));
    }
  }

  getLatestMetric(path) {
    const keys = path.split('.');
    let current = this.metrics;

    for (const key of keys) {
      current = current[key];
      if (!current) return undefined;
    }

    return current.length > 0 ? current[current.length - 1] : undefined;
  }

  /**
   * Hook into Three.js renderer for automatic metric collection
   */
  attachToRenderer(renderer) {
    if (!renderer) return;

    const originalRender = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      this.collectThreeJSMetrics(renderer);
      return originalRender(...args);
    };

    console.log('🔗 Performance profiler attached to Three.js renderer');
  }

  /**
   * Memory profiling setup
   */
  setupMemoryProfiling() {
    // Track memory usage over time
    setInterval(() => {
      if (performance.memory) {
        const heapMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        this.addMetric('javascript.heapSize', heapMB);
      }
    }, 1000);
  }

  /**
   * GPU profiling setup (experimental)
   */
  setupGPUProfiling() {
    // Future: WebGPU performance queries
    console.log('🎮 GPU profiling capabilities detected');
  }

  /**
   * Process performance observer entries
   */
  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        this.addMetric('javascript.measures', entry.duration);
        break;
      case 'paint':
        this.addMetric('system.paint', entry.startTime);
        break;
    }
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: {
        avgFPS: this.metrics.frame.fps.reduce((a, b) => a + b, 0) / this.metrics.frame.fps.length,
        totalFrames: this.frameCount,
        runtime: performance.now() - this.startTime
      }
    };
  }

  /**
   * Collect advanced Three.js and GPU metrics
   */
  collectAdvancedMetrics(renderer, scene = null) {
    if (!renderer) return;

    const info = renderer.info;

    // Basic Three.js metrics
    this.addMetric('threejs.drawCalls', info.render.calls);
    this.addMetric('threejs.triangles', info.render.triangles);
    this.addMetric('threejs.points', info.render.points);
    this.addMetric('threejs.lines', info.render.lines);

    // Memory metrics
    this.addMetric('threejs.geometries', info.memory.geometries);
    this.addMetric('threejs.textures', info.memory.textures);

    // GPU vs CPU timing separation
    this.measureGPUvsCPUTiming(renderer);

    // Spatial density analysis
    this.analyzeSceneSpatialDensity(scene, renderer);

    // Entity contribution analysis
    this.analyzePerEntityContribution(scene);

    // GPU memory usage estimation
    this.estimateGPUMemoryUsage(scene);

    // Scene analysis if provided
    if (scene) {
      this.runAdvancedAnalysis(); // Re-run advanced analysis for the current scene
    }
  }

  /**
   * Measure GPU vs CPU timing to identify bottlenecks
   */
  measureGPUvsCPUTiming(renderer) {
    const startCPU = performance.now();

    // This measures the CPU-side rendering time
    // (WebGL commands submission, not actual GPU execution)
    const measureRenderCPU = () => {
      const cpuTime = performance.now() - startCPU;
      this.addMetric('performance.cpuRenderTime', cpuTime);

      // If we have frame time and CPU render time, we can estimate GPU time
      const frameTime = this.getLatestMetric('frame.frameTime');
      if (frameTime !== undefined) {
        const estimatedGPUTime = Math.max(0, frameTime - cpuTime);
        this.addMetric('performance.estimatedGPUTime', estimatedGPUTime);

        // Determine if we're CPU or GPU bound
        const bottleneck = cpuTime > estimatedGPUTime ? 'CPU' : 'GPU';
        this.addMetric('performance.bottleneck', bottleneck);
      }
    };

    // Schedule CPU measurement after render
    requestAnimationFrame(measureRenderCPU);
  }

  /**
   * Analyze spatial density of draw calls across viewport
   */
  analyzeSceneSpatialDensity(scene, renderer) {
    if (!scene || !renderer) return;

    const camera = scene.getObjectByProperty('type', 'PerspectiveCamera') ||
      scene.getObjectByProperty('type', 'OrthographicCamera');
    if (!camera) return;

    const size = renderer.getSize(new THREE.Vector2());
    const gridSize = 10; // 10x10 grid
    const densityGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

    let totalObjects = 0;
    let visibleObjects = 0;

    scene.traverse((object) => {
      if (object.isMesh && object.visible) {
        totalObjects++;

        // Check if object is in camera frustum (simplified)
        const objectPosition = new THREE.Vector3();
        object.getWorldPosition(objectPosition);

        // Project to screen space
        const screenPosition = objectPosition.clone().project(camera);

        // Check if visible
        if (screenPosition.x >= -1 && screenPosition.x <= 1 &&
          screenPosition.y >= -1 && screenPosition.y <= 1 &&
          screenPosition.z >= -1 && screenPosition.z <= 1) {

          visibleObjects++;

          // Map to grid position
          const gridX = Math.floor((screenPosition.x + 1) / 2 * gridSize);
          const gridY = Math.floor((screenPosition.y + 1) / 2 * gridSize);

          if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
            densityGrid[gridY][gridX]++;
          }
        }
      }
    });

    // Find hotspots
    let maxDensity = 0;
    let hotspots = 0;
    densityGrid.forEach(row => {
      row.forEach(density => {
        maxDensity = Math.max(maxDensity, density);
        if (density > totalObjects * 0.1) { // More than 10% of objects in one cell
          hotspots++;
        }
      });
    });

    this.addMetric('spatial.totalObjects', totalObjects);
    this.addMetric('spatial.visibleObjects', visibleObjects);
    this.addMetric('spatial.maxDensity', maxDensity);
    this.addMetric('spatial.hotspots', hotspots);
    this.addMetric('spatial.cullingEfficiency', ((totalObjects - visibleObjects) / totalObjects * 100));
  }

  /**
   * Analyze per-entity contribution to rendering cost
   */
  analyzePerEntityContribution(scene) {
    if (!scene) return;

    const entityCosts = [];
    let totalTriangles = 0;
    let totalDrawCalls = 0;

    scene.traverse((object) => {
      if (object.isMesh && object.visible) {
        const geometry = object.geometry;
        const material = object.material;

        let triangles = 0;
        if (geometry && geometry.attributes.position) {
          triangles = geometry.attributes.position.count / 3;
        }

        let materialComplexity = 1;
        if (Array.isArray(material)) {
          materialComplexity = material.length;
        } else if (material) {
          // Estimate material complexity
          materialComplexity = 1;
          if (material.map) materialComplexity += 0.5;
          if (material.normalMap) materialComplexity += 0.3;
          if (material.envMap) materialComplexity += 0.4;
          if (material.transparent) materialComplexity += 0.2;
        }

        const entityCost = triangles * materialComplexity;

        entityCosts.push({
          id: object.id,
          name: object.name || `Object_${object.id}`,
          triangles,
          materialComplexity,
          totalCost: entityCost
        });

        totalTriangles += triangles;
        totalDrawCalls += materialComplexity;
      }
    });

    // Sort by cost and find top contributors
    entityCosts.sort((a, b) => b.totalCost - a.totalCost);
    const topContributors = entityCosts.slice(0, 5);

    this.addMetric('entities.totalCount', entityCosts.length);
    this.addMetric('entities.totalTriangles', totalTriangles);
    this.addMetric('entities.avgTrianglesPerEntity', totalTriangles / Math.max(1, entityCosts.length));

    // Store top contributors for display
    this.topEntityContributors = topContributors;
  }

  /**
   * Estimate GPU memory usage
   */
  estimateGPUMemoryUsage(scene) {
    if (!scene) return;

    let geometryMemory = 0;
    let textureMemory = 0;
    const processedGeometries = new Set();
    const processedTextures = new Set();

    scene.traverse((object) => {
      if (object.isMesh) {
        // Geometry memory
        const geometry = object.geometry;
        if (geometry && !processedGeometries.has(geometry.id)) {
          processedGeometries.add(geometry.id);

          const attributes = geometry.attributes;
          for (const name in attributes) {
            const attribute = attributes[name];
            geometryMemory += attribute.array.byteLength;
          }

          if (geometry.index) {
            geometryMemory += geometry.index.array.byteLength;
          }
        }

        // Texture memory
        const material = object.material;
        if (material) {
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach(mat => {
            const textures = [];
            if (mat.map) textures.push(mat.map);
            if (mat.normalMap) textures.push(mat.normalMap);
            if (mat.envMap) textures.push(mat.envMap);
            if (mat.roughnessMap) textures.push(mat.roughnessMap);
            if (mat.metalnessMap) textures.push(mat.metalnessMap);

            textures.forEach(texture => {
              if (texture && texture.image && !processedTextures.has(texture.id)) {
                processedTextures.add(texture.id);

                const image = texture.image;
                if (image.width && image.height) {
                  // Estimate 4 bytes per pixel (RGBA)
                  textureMemory += image.width * image.height * 4;
                }
              }
            });
          });
        }
      }
    });

    const totalMemoryMB = (geometryMemory + textureMemory) / (1024 * 1024);

    this.addMetric('gpu.estimatedGeometryMemoryMB', geometryMemory / (1024 * 1024));
    this.addMetric('gpu.estimatedTextureMemoryMB', textureMemory / (1024 * 1024));
    this.addMetric('gpu.estimatedTotalMemoryMB', totalMemoryMB);

    // Estimate GPU memory pressure (rough heuristic)
    const memoryPressure = totalMemoryMB > 100 ? 'High' : totalMemoryMB > 50 ? 'Medium' : 'Low';
    this.addMetric('gpu.memoryPressure', memoryPressure);
  }

  /**
   * Collect Three.js metrics with advanced analysis
   */
  collectThreeJSMetrics(renderer, scene = null) {
    if (!renderer) return;

    // Store current scene for advanced analysis
    this.currentScene = scene;

    // Use the new advanced metrics collection
    this.collectAdvancedMetrics(renderer, scene);

    // Run existing analyzers if available
    if (scene) {
      this.runAdvancedAnalysis();
    }
  }

  /**
   * Update GPU vs CPU timing display
   */
  updateGPUCPUTimingDisplay() {
    if (!this.gpuCPUTimingContent) return;

    const cpuTime = this.getLatestMetric('performance.cpuRenderTime');
    const estimatedGPUTime = this.getLatestMetric('performance.estimatedGPUTime');
    const bottleneck = this.getLatestMetric('performance.bottleneck');

    let html = '';
    if (cpuTime !== undefined) {
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #9b59b6; font-weight: bold;">CPU Render: ${cpuTime.toFixed(2)}ms</div>`;

      if (estimatedGPUTime !== undefined) {
        html += `<div style="color: #e67e22;">Est. GPU: ${estimatedGPUTime.toFixed(2)}ms</div>`;
      }

      if (bottleneck) {
        const color = bottleneck === 'CPU' ? '#e74c3c' : '#f39c12';
        html += `<div style="color: ${color};">Bottleneck: ${bottleneck}</div>`;
      }

      html += '</div>';
    }

    this.gpuCPUTimingContent.html(html || '<div style="color: #888;">Measuring...</div>');
  }

  /**
   * Update spatial density display
   */
  updateSpatialDensityDisplay() {
    if (!this.spatialDensityContent) return;

    const totalObjects = this.getLatestMetric('spatial.totalObjects');
    const visibleObjects = this.getLatestMetric('spatial.visibleObjects');
    const hotspots = this.getLatestMetric('spatial.hotspots');
    const cullingEfficiency = this.getLatestMetric('spatial.cullingEfficiency');

    let html = '';
    if (totalObjects !== undefined) {
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #e67e22; font-weight: bold;">Objects: ${totalObjects}</div>
        <div style="color: #2ecc71;">Visible: ${visibleObjects}</div>`;

      if (cullingEfficiency !== undefined) {
        html += `<div style="color: #3498db;">Culling: ${cullingEfficiency.toFixed(1)}%</div>`;
      }

      if (hotspots !== undefined && hotspots > 0) {
        html += `<div style="color: #e74c3c;">Hotspots: ${hotspots}</div>`;
      }

      html += '</div>';
    }

    this.spatialDensityContent.html(html || '<div style="color: #888;">Analyzing...</div>');
  }

  /**
   * Update entity contribution display
   */
  updateEntityContributionDisplay() {
    if (!this.entityContributionContent) return;

    const totalCount = this.getLatestMetric('entities.totalCount');
    const avgTriangles = this.getLatestMetric('entities.avgTrianglesPerEntity');

    let html = '';
    if (totalCount !== undefined) {
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #2ecc71; font-weight: bold;">Entities: ${totalCount}</div>`;

      if (avgTriangles !== undefined) {
        html += `<div style="color: #3498db;">Avg Triangles: ${avgTriangles.toFixed(0)}</div>`;
      }

      html += '</div>';

      // Show top contributors if available
      if (this.topEntityContributors && this.topEntityContributors.length > 0) {
        html += '<div style="color: #f39c12; font-size: 10px; margin-top: 4px;">Top Contributors:</div>';
        this.topEntityContributors.slice(0, 3).forEach(entity => {
          html += `<div style="color: #ccc; font-size: 9px;">• ${entity.name}: ${entity.triangles} tri</div>`;
        });
      }
    }

    this.entityContributionContent.html(html || '<div style="color: #888;">Analyzing...</div>');
  }

  /**
   * Update GPU memory display
   */
  updateGPUMemoryDisplay() {
    if (!this.gpuMemoryContent) return;

    const totalMemory = this.getLatestMetric('gpu.estimatedTotalMemoryMB');
    const geometryMemory = this.getLatestMetric('gpu.estimatedGeometryMemoryMB');
    const textureMemory = this.getLatestMetric('gpu.estimatedTextureMemoryMB');
    const memoryPressure = this.getLatestMetric('gpu.memoryPressure');

    let html = '';
    if (totalMemory !== undefined) {
      html += `<div style="margin-bottom: 6px;">
        <div style="color: #e74c3c; font-weight: bold;">Total: ${totalMemory.toFixed(1)}MB</div>
        <div style="color: #3498db;">Geometry: ${geometryMemory.toFixed(1)}MB</div>
        <div style="color: #9b59b6;">Textures: ${textureMemory.toFixed(1)}MB</div>`;

      if (memoryPressure) {
        const color = memoryPressure === 'High' ? '#e74c3c' : memoryPressure === 'Medium' ? '#f39c12' : '#2ecc71';
        html += `<div style="color: ${color};">Pressure: ${memoryPressure}</div>`;
      }

      html += '</div>';
    }

    this.gpuMemoryContent.html(html || '<div style="color: #888;">Estimating...</div>');
  }
} 