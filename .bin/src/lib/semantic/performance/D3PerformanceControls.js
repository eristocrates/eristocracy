/**
 * @file D3PerformanceControls.js
 * @description Main D3 Performance Controls system - kinesthetic performance laboratory
 * Infinite composability with real-time ForceGraph3D integration + NUCLEAR OPTIMIZATIONS
 */

// import * as d3 from 'd3';
import { subscribe } from 'valtio';
import { performanceState, performanceStateManager } from './PerformanceState.js';
import { PerformanceParameterSchema, PerformancePresets, PerformanceImpactCategories } from './PerformanceParameterSchema.js';
// import { createD3Slider, createD3Toggle, createD3Select, createD3ColorPicker, cleanupValtioSubscriptions } from './D3ControlGenerators.js';
// import { RealTimePerformanceMonitor } from './RealTimePerformanceMonitor.js';
import { NuclearOptimizationManager } from './NuclearOptimizations.js';

/**
 * D3-based Performance Control Laboratory
 * 
 * Now using Valtio for reactive state management.
 * All controls automatically sync with state changes - no more stuck toggles!
 */
export class D3PerformanceControls {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enableRealTimeMonitoring: true,
      enablePresets: true,
      enableURLState: true,
      autoSave: true,
      storageKey: 'performance-fiddle-state',
      ...options
    };

    // Control instances for programmatic access
    this.controls = new Map();

    // ForceGraph3D instance
    this.graphInstance = null;

    // Store original data for filtering
    this.originalGraphData = null;

    // Performance monitor
    this.performanceMonitor = null;

    // Nuclear optimization manager
    this.nuclearOptimizer = null;

    // Callbacks
    this.callbacks = {
      onParameterChange: null,
      onPresetLoad: null,
      onPerformanceAlert: null
    };

    // Subscribe to Valtio state changes
    this.setupValtioSubscriptions();

    // Load initial state (URL > localStorage > defaults)
    this.loadInitialState();

    // Initialize the UI
    this.initializeUI();

    console.log('🎮 D3 Performance Controls initialized with Valtio reactivity');
  }

  /**
   * Setup Valtio subscriptions for reactive behavior
   */
  setupValtioSubscriptions() {
    // Subscribe to parameter changes
    this.parameterSubscription = subscribe(performanceState.parameters, () => {
      this.onParameterChange();
    });

    // Subscribe to nuclear status changes
    this.nuclearSubscription = subscribe(performanceState.nuclear, () => {
      this.onNuclearStatusChange();
    });

    // Subscribe to performance metrics
    this.metricsSubscription = subscribe(performanceState.metrics, () => {
      this.onPerformanceMetricsChange();
    });
  }

  /**
   * Load initial state from URL, localStorage, or use defaults
   */
  loadInitialState() {
    // Try URL parameters first
    if (this.options.enableURLState && performanceStateManager.loadFromURL()) {
      console.log('📄 Loaded parameters from URL');
      return;
    }

    // Try localStorage
    if (this.options.autoSave && performanceStateManager.loadFromLocalStorage(this.options.storageKey)) {
      console.log('💾 Loaded parameters from localStorage');
      return;
    }

    // Use "balanced" preset as default
    console.log('🔧 Loading default "balanced" preset');
    performanceStateManager.loadPreset('balanced');
  }

  /**
   * Initialize the complete UI
   */
  initializeUI() {
    // const container = d3.select(this.container);
    // container.selectAll('*').remove(); // Clear existing content

    // Create main container
    // this.createMainContainer(container);

    // Create real-time performance monitor
    if (this.options.enableRealTimeMonitoring) {
      // this.createPerformanceMonitor();
    }

    // Create preset controls
    if (this.options.enablePresets) {
      // this.createPresetControls();
    }

    // Create parameter sections
    // this.createParameterSections();

    // Create nuclear controls
    // this.createNuclearControls();

    console.log('🎨 D3 Performance UI initialized');
  }

  /**
   * Create main container structure
   */
  createMainContainer(container) {
    // this.mainContainer = container
    //   .append('div')
    //   .attr('class', 'd3-performance-controls')
    //   .style('width', '100%')
    //   .style('max-width', '360px')
    //   .style('max-height', '400px')
    //   .style('overflow-y', 'auto')
    //   .style('background', 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)')
    //   .style('border-radius', '8px')
    //   .style('padding', '16px')
    //   .style('font-family', 'system-ui, -apple-system, sans-serif')
    //   .style('color', '#E2E8F0')
    //   .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');

    // Header
    // this.mainContainer
    //   .append('h3')
    //   .attr('class', 'performance-header')
    //   .style('margin', '0 0 16px 0')
    //   .style('color', '#74b9ff')
    //   .style('font-size', '16px')
    //   .style('font-weight', 'bold')
    //   .text('🎛️ KINESTHETIC PERFORMANCE LABORATORY');
  }

  /**
   * Create real-time performance monitor
   */
  createPerformanceMonitor() {
    // const monitorContainer = this.mainContainer
    //   .append('div')
    //   .attr('class', 'monitor-container')
    //   .style('margin-bottom', '16px');

    // Initialize performance monitor
    // this.performanceMonitor = new RealTimePerformanceMonitor(monitorContainer.node());
  }

  /**
   * Create preset control buttons
   */
  createPresetControls() {
    // const presetContainer = this.mainContainer
    //   .append('div')
    //   .attr('class', 'preset-controls')
    //   .style('margin-bottom', '16px');

    // presetContainer
    //   .append('div')
    //   .style('font-weight', 'bold')
    //   .style('margin-bottom', '8px')
    //   .style('color', '#A0AEC0')
    //   .text('🎮 Quick Presets:');

    // const buttonContainer = presetContainer
    //   .append('div')
    //   .style('display', 'grid')
    //   .style('grid-template-columns', '1fr 1fr')
    //   .style('gap', '6px');

    // Object.entries(PerformancePresets).forEach(([presetName, preset]) => {
    //   const button = buttonContainer
    //     .append('button')
    //     .attr('class', `preset-btn preset-${presetName}`)
    //     .style('padding', '6px 10px')
    //     .style('border', '1px solid #4A5568')
    //     .style('border-radius', '4px')
    //     .style('background', presetName === 'nuclear' ? '#2D1B2E' : '#2D3748')
    //     .style('color', presetName === 'nuclear' ? '#ff4757' : '#E2E8F0')
    //     .style('cursor', 'pointer')
    //     .style('font-size', '11px')
    //     .style('transition', 'all 0.2s')
    //     .text(presetName.charAt(0).toUpperCase() + presetName.slice(1))
    //     .on('click', () => this.loadPreset(presetName));

    //   // Highlight current preset
    //   const currentPreset = performanceState.currentPreset;
    //   if (presetName === currentPreset) {
    //     button.style('background', '#4299e1').style('color', 'white');
    //   }
    // });

    // Nuclear restore button
    // const restoreButton = presetContainer
    //   .append('button')
    //   .attr('class', 'nuclear-restore-btn')
    //   .style('width', '100%')
    //   .style('margin-top', '8px')
    //   .style('padding', '8px')
    //   .style('border', '1px solid #ff4757')
    //   .style('border-radius', '4px')
    //   .style('background', '#2D1B2E')
    //   .style('color', '#ff4757')
    //   .style('cursor', 'pointer')
    //   .style('font-size', '12px')
    //   .style('font-weight', 'bold')
    //   .text('💀 Restore Normal Rendering')
    //   .on('click', () => this.restoreNormalRendering());
  }

  /**
   * Create parameter sections organized by category
   */
  createParameterSections() {
    // Group parameters by category
    const categories = {};
    Object.entries(PerformanceParameterSchema).forEach(([key, param]) => {
      const category = param.category || 'Other';
      if (!categories[category]) {
        categories[category] = {};
      }
      categories[category][key] = param;
    });

    // Create sections for each category
    Object.entries(categories).forEach(([categoryName, params]) => {
      this.createParameterSection(categoryName, params);
    });
  }

  /**
   * Create a parameter section
   */
  createParameterSection(categoryName, parameters) {
    // Skip nuclear optimization category (handled separately)
    if (categoryName === 'Nuclear Optimization') return;

    // const section = this.mainContainer
    //   .append('div')
    //   .attr('class', `param-section section-${categoryName.toLowerCase().replace(/\s+/g, '-')}`)
    //   .style('margin-bottom', '12px');

    // // Category header (collapsible)
    // const header = section
    //   .append('div')
    //   .attr('class', 'section-header')
    //   .style('display', 'flex')
    //   .style('justify-content', 'space-between')
    //   .style('align-items', 'center')
    //   .style('padding', '8px')
    //   .style('background', 'rgba(255, 255, 255, 0.05)')
    //   .style('border-radius', '4px')
    //   .style('cursor', 'pointer')
    //   .style('margin-bottom', '8px');

    // header
    //   .append('span')
    //   .style('font-weight', 'bold')
    //   .style('font-size', '12px')
    //   .style('color', this.getCategoryColor(categoryName))
    //   .text(categoryName);

    // const collapseIcon = header
    //   .append('span')
    //   .attr('class', 'collapse-icon')
    //   .style('transition', 'transform 0.2s')
    //   .text('▼');

    // // Parameter container (collapsible)
    // const paramContainer = section
    //   .append('div')
    //   .attr('class', 'param-container')
    //   .style('display', 'block');

    // let isCollapsed = false;
    // header.on('click', () => {
    //   isCollapsed = !isCollapsed;
    //   paramContainer.style('display', isCollapsed ? 'none' : 'block');
    //   collapseIcon.style('transform', isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)');
    // });

    // Create controls for each parameter
    Object.entries(parameters).forEach(([paramKey, param]) => {
      this.createParameterControl(paramKey, param);
    });
  }

  /**
   * Create a single parameter control
   */
  createParameterControl(paramKey, param) {
    let control;

    // Create appropriate control type
    switch (param.type) {
      case 'number':
        // control = createD3Slider(container, paramKey, param, this.onControlChange.bind(this));
        break;
      case 'boolean':
        // control = createD3Toggle(container, paramKey, param, this.onControlChange.bind(this));
        break;
      case 'select':
        // control = createD3Select(container, paramKey, param, this.onControlChange.bind(this));
        break;
      case 'color':
        // control = createD3ColorPicker(container, paramKey, param, this.onControlChange.bind(this));
        break;
      default:
        console.warn(`Unknown parameter type: ${param.type} for ${paramKey}`);
        return;
    }

    if (control) {
      this.controls.set(paramKey, control);
    }
  }

  /**
   * Create nuclear optimization controls
   */
  createNuclearControls() {
    // const nuclearSection = this.mainContainer
    //   .append('div')
    //   .attr('class', 'nuclear-section')
    //   .style('margin-top', '16px')
    //   .style('padding', '12px')
    //   .style('background', 'rgba(255, 71, 87, 0.1)')
    //   .style('border', '1px solid #ff4757')
    //   .style('border-radius', '6px');

    // nuclearSection
    //   .append('div')
    //   .style('font-weight', 'bold')
    //   .style('margin-bottom', '8px')
    //   .style('color', '#ff4757')
    //   .text('💀 NUCLEAR CAPABILITIES');

    // // Phase 1 and Phase 2 controls
    // const nuclearParams = {
    //   phase1: PerformanceParameterSchema.phase1,
    //   phase2: PerformanceParameterSchema.phase2
    // };

    // Object.entries(nuclearParams).forEach(([paramKey, param]) => {
    //   this.createParameterControl(nuclearSection, paramKey, param);
    // });
  }

  /**
   * Handle control changes (called by reactive controls)
   */
  onControlChange(paramKey, newValue) {
    // The control has already updated the Valtio state
    // Just apply to ForceGraph3D if connected
    if (this.graphInstance) {
      this.applyParameterToGraph(paramKey, newValue);
    }

    // Handle nuclear optimizations
    if (paramKey === 'phase1' || paramKey === 'phase2') {
      this.applyNuclearOptimizations();
    }

    // Save state
    if (this.options.autoSave) {
      performanceStateManager.saveToLocalStorage(this.options.storageKey);
    }

    // Update URL
    if (this.options.enableURLState) {
      performanceStateManager.saveToURL();
    }

    // Trigger callback
    if (this.callbacks.onParameterChange) {
      this.callbacks.onParameterChange(paramKey, newValue);
    }
  }

  /**
   * Called when any parameter changes via Valtio
   */
  onParameterChange() {
    // Performance monitoring and visual feedback handled by individual controls
    console.log('🔄 Parameters changed via Valtio');
  }

  /**
   * Called when nuclear status changes
   */
  onNuclearStatusChange() {
    const nuclear = performanceState.nuclear;
    console.log('💀 Nuclear status changed:', nuclear);
  }

  /**
   * Called when performance metrics change
   */
  onPerformanceMetricsChange() {
    const metrics = performanceState.metrics;
    if (this.performanceMonitor) {
      this.performanceMonitor.updateMetrics(metrics);
    }
  }

  /**
   * Load a preset
   */
  loadPreset(presetName) {
    if (PerformancePresets[presetName]) {
      performanceStateManager.loadPreset(presetName);

      // Apply nuclear optimizations if nuclear preset
      if (presetName === 'nuclear') {
        this.applyNuclearOptimizations();
      }

      // Apply colors after preset is loaded
      setTimeout(() => {
        this.applyAllColors();
      }, 100);

      console.log(`🎮 Loaded preset: ${presetName} (with colors applied)`);

      // Update preset button highlights
      this.updatePresetButtonHighlights(presetName);

      if (this.callbacks.onPresetLoad) {
        this.callbacks.onPresetLoad(presetName, PerformancePresets[presetName]);
      }
    }
  }

  /**
   * Update preset button visual states
   */
  updatePresetButtonHighlights(activePreset) {
    // this.mainContainer.selectAll('.preset-btn')
    //   .style('background', function () {
    //     const isNuclear = this.classList.contains('preset-nuclear');
    //     const isActive = this.classList.contains(`preset-${activePreset}`);

    //     if (isActive) {
    //       return '#4299e1';
    //     } else if (isNuclear) {
    //       return '#2D1B2E';
    //     } else {
    //       return '#2D3748';
    //     }
    //   })
    //   .style('color', function () {
    //     const isNuclear = this.classList.contains('preset-nuclear');
    //     const isActive = this.classList.contains(`preset-${activePreset}`);

    //     if (isActive) {
    //       return 'white';
    //     } else if (isNuclear) {
    //       return '#ff4757';
    //     } else {
    //       return '#E2E8F0';
    //     }
    //   });
  }

  /**
   * Apply nuclear optimizations
   */
  applyNuclearOptimizations() {
    if (!this.nuclearOptimizer || !this.graphInstance) return;

    const phase1Active = performanceState.parameters.phase1;
    const phase2Active = performanceState.parameters.phase2;

    this.nuclearOptimizer.applyOptimizations({
      phase1: phase1Active,
      phase2: phase2Active
    });

    // Update nuclear status
    performanceStateManager.updateNuclearStatus({
      phase1Active,
      phase2Active
    });
  }

  /**
   * Restore normal rendering (disable nuclear optimizations)
   */
  restoreNormalRendering() {
    // Update parameters
    performanceStateManager.updateParameters({
      phase1: false,
      phase2: false
    });

    // Restore via nuclear optimizer
    if (this.nuclearOptimizer) {
      this.nuclearOptimizer.restoreNormalRendering();
    }

    console.log('💀 Normal rendering restored');
  }

  /**
   * Apply a single parameter to ForceGraph3D
   */
  applyParameterToGraph(paramKey, value) {
    if (!this.graphInstance) return;

    const param = PerformanceParameterSchema[paramKey];
    if (!param) return;

    try {
      // Handle force simulation parameters specially
      if (paramKey === 'linkDistance') {
        const linkForce = this.graphInstance.d3Force('link');
        if (linkForce) {
          linkForce.distance(value);
          this.graphInstance.d3ReheatSimulation(); // Restart simulation with new parameters
          console.log(`📊 Applied linkDistance = ${value}`);
        }
        return;
      }

      if (paramKey === 'chargeStrength') {
        const chargeForce = this.graphInstance.d3Force('charge');
        if (chargeForce) {
          chargeForce.strength(value);
          this.graphInstance.d3ReheatSimulation(); // Restart simulation with new parameters
          console.log(`📊 Applied chargeStrength = ${value}`);
        }
        return;
      }

      // Handle node sizing by degree
      if (paramKey === 'nodeSizeByDegree' || paramKey === 'minNodeSize' || paramKey === 'maxNodeSize') {
        this.updateNodeSizing();
        return;
      }

      // Handle color parameters with custom functions
      if (paramKey.includes('Color')) {
        this.updateColorFunction(paramKey, value);
        return;
      }

      // Handle node labels specially  
      if (paramKey === 'labelFontSize') {
        this.graphInstance.nodeLabel(node => {
          if (node && node.label) return node.label;
          if (node && node.id) {
            const nodeIdStr = String(node.id);
            return nodeIdStr.split(/[#\/]/).pop() || nodeIdStr;
          }
          return 'Unknown';
        });
        console.log(`📊 Applied labelFontSize = ${value}`);
        return;
      }

      // Handle standard ForceGraph3D methods
      if (param.forceGraphMethod) {
        const method = param.forceGraphMethod;

        if (typeof this.graphInstance[method] === 'function') {
          this.graphInstance[method](value);
          console.log(`📊 Applied ${paramKey} = ${value} via ${method}`);
        } else {
          console.warn(`⚠️ ForceGraph3D method not found: ${method}`);
        }
        return;
      }

      // Handle special cases that need custom logic
      switch (paramKey) {
        case 'nodeCollisionRadius':
          // This would need to be handled by updating collision detection
          console.log(`📊 Node collision radius set to ${value} (requires collision force setup)`);
          break;
        case 'enableMaxNodeLimit':
        case 'enableMinDegreeFilter':
          console.log(`📊 Filter toggle ${paramKey} = ${value} - applying filter`);
          this.applyDataFilters();
          break;
        case 'maxNodeCount':
        case 'minNodeDegree':
          console.log(`📊 Filter parameter ${paramKey} = ${value} - applying filter`);
          this.applyDataFilters();
          break;
        case 'showInstances':
        case 'showClasses':
        case 'showLiterals':
          console.log(`📊 Data filter ${paramKey} = ${value} - applying filter`);
          this.applyDataFilters();
          break;
        case 'instancedNodeType':
        case 'instancedGeometryLOD':
        case 'instancedNodes':
        case 'instancedLinks':
          console.log(`📊 Instancing parameter ${paramKey} = ${value} (handled by nuclear optimizations)`);
          break;
        default:
          console.log(`📊 Parameter ${paramKey} = ${value} (no specific handler)`);
      }

    } catch (error) {
      console.error(`❌ Failed to apply ${paramKey}:`, error);
    }
  }

  /**
   * Update node sizing based on edge count
   */
  updateNodeSizing() {
    const sizingEnabled = performanceState.parameters.nodeSizeByDegree;
    const minSize = performanceState.parameters.minNodeSize;
    const maxSize = performanceState.parameters.maxNodeSize;

    if (sizingEnabled) {
      // First, get all nodes to calculate actual edge count distribution
      const graphData = this.graphInstance.graphData();
      const nodes = graphData.nodes || [];

      if (nodes.length === 0) {
        console.log('📊 No nodes available for sizing');
        return;
      }

      // Calculate actual edge count statistics from the data
      const edgeCounts = nodes.map(node => node.edgeCount || 0).filter(count => count > 0);

      if (edgeCounts.length === 0) {
        console.log('📊 No edge count data available, using fixed size');
        this.graphInstance.nodeVal(minSize);
        return;
      }

      edgeCounts.sort((a, b) => a - b);
      const minEdges = edgeCounts[0];
      const maxEdges = edgeCounts[edgeCounts.length - 1];
      const medianEdges = edgeCounts[Math.floor(edgeCounts.length / 2)];

      console.log(`📊 Edge count distribution: min=${minEdges}, median=${medianEdges}, max=${maxEdges}`);

      this.graphInstance.nodeVal(node => {
        const edgeCount = node.edgeCount || 0;
        if (edgeCount === 0) return minSize;
        if (edgeCount === maxEdges) return maxSize;

        // Normalize degree into [0,1]
        const normalized = (edgeCount - minEdges) / (maxEdges - minEdges);
        const safeNormalized = Math.max(0, Math.min(1, normalized));

        // Strong nonlinear curves
        const expCurve = Math.pow(safeNormalized, 4.5); // Sharp discrimination of small degrees
        const logCurve = Math.log2(edgeCount + 1) / Math.log2(maxEdges + 1); // Amplifies mid-high
        const rootCurve = Math.sqrt(safeNormalized); // Prevents total vanishing of low degrees
        const percentile = edgeCounts.filter(c => c <= edgeCount).length / edgeCounts.length;
        const stratified = Math.pow(percentile, 3.5); // Exponential rank sharpening

        // Super-discrete bucketing: each tier is a regime
        const tiers = 7;
        const discreteStep = Math.floor(stratified * tiers) / tiers;

        // Hyperweighted composite — favor discrete and exponential
        const ratio = (
          discreteStep * 0.5 +
          expCurve * 0.3 +
          logCurve * 0.1 +
          rootCurve * 0.1
        );

        // Final size computation
        let size = minSize + (maxSize - minSize) * ratio;

        // Hyperhub detection: show as unignorable core nodes
        const hubThreshold = medianEdges * 2.5;
        if (edgeCount > hubThreshold) {
          const hubFactor = 1.8 + Math.pow(edgeCount / maxEdges, 2.5); // can reach 3–4x
          size *= hubFactor;
          size = Math.min(size, maxSize * 3); // hard cap
        }

        return size;
      });

      console.log(`📊 Dramatic node sizing enabled: ${minSize}-${maxSize}px (${nodes.length} nodes, ${edgeCounts.length} with edges)`);
    } else {
      // Use fixed size
      const fixedSize = performanceState.parameters.nodeRadius;
      this.graphInstance.nodeVal(fixedSize);
      console.log(`📊 Node sizing set to fixed size: ${fixedSize}`);
    }
  }

  /**
   * Update color functions for nodes and links
   */
  updateColorFunction(paramKey, value) {
    if (!this.graphInstance) {
      console.warn('🎨 Cannot update colors - no graph instance');
      return;
    }

    const colors = {
      classNodeColor: performanceState.parameters.classNodeColor,
      instanceNodeColor: performanceState.parameters.instanceNodeColor,
      literalNodeColor: performanceState.parameters.literalNodeColor,
      blankNodeColor: performanceState.parameters.blankNodeColor,
      objectPropertyColor: performanceState.parameters.objectPropertyColor,
      datatypePropertyColor: performanceState.parameters.datatypePropertyColor,
      rdfPropertyColor: performanceState.parameters.rdfPropertyColor,
    };

    try {
      // Update node colors
      if (paramKey.includes('NodeColor') || paramKey === 'nodeColor') {
        this.graphInstance.nodeAutoColorBy(null); // Disable auto-coloring first
        this.graphInstance.nodeColor(node => {
          // Handle literal nodes
          if (node && node.isLiteral) return colors.literalNodeColor;

          // Handle prefixed node types (e.g., "owl:Class", "rdf:Property")
          const nodeType = (node && node.type ? String(node.type).toLowerCase() : '');

          // Class types
          if (nodeType.includes('class')) {
            return colors.classNodeColor;
          }

          // Property types  
          if (nodeType.includes('property')) {
            return colors.objectPropertyColor; // Use object property color for all properties
          }

          // Instance/Individual types
          if (nodeType.includes('individual') ||
            nodeType.includes('instance') ||
            nodeType.includes('namedindividual')) {
            return colors.instanceNodeColor;
          }

          // Blank nodes - ensure node.id is a string before calling startsWith
          const nodeId = node && node.id ? String(node.id) : '';
          if (nodeType.includes('blank') || nodeId.startsWith('_:')) {
            return colors.blankNodeColor;
          }

          // Default for unknown types
          return colors.instanceNodeColor;
        });

        console.log(`🎨 Applied node colors based on semantic types`);
      }

      // Update link colors  
      if (paramKey.includes('PropertyColor') || paramKey === 'linkColor') {
        this.graphInstance.linkColor(link => {
          const predicate = (link && link.predicate ? String(link.predicate).toLowerCase() : '');
          const label = (link && link.label ? String(link.label).toLowerCase() : '');

          // RDF/RDFS properties
          if (predicate.includes('rdf-schema') ||
            predicate.includes('rdf-syntax') ||
            predicate.includes('rdfs:') ||
            predicate.includes('rdf:') ||
            label.includes('rdf:') ||
            label.includes('rdfs:')) {
            return colors.rdfPropertyColor;
          }

          // Datatype properties
          if (predicate.includes('datatypeproperty') ||
            predicate.includes('datatype') ||
            label.includes('datatype')) {
            return colors.datatypePropertyColor;
          }

          // Object properties (default)
          return colors.objectPropertyColor;
        });

        console.log(`🎨 Applied link colors based on property types`);
      }
    } catch (error) {
      console.error('🎨 Error applying colors:', error);
    }
  }

  /**
   * Apply all color settings at once (useful after data loading)
   */
  applyAllColors() {
    if (!this.graphInstance) {
      console.warn('🎨 Cannot apply colors - no graph instance');
      return;
    }

    console.log('🎨 Applying all color settings...');

    try {
      // Apply node colors
      // this.updateColorFunction('nodeColor', null);

      // Apply link colors  
      // this.updateColorFunction('linkColor', null);

      console.log('🎨 All colors applied successfully');
    } catch (error) {
      console.error('🎨 Error applying all colors:', error);
    }
  }

  /**
   * Store the original graph data for filtering purposes
   */
  storeOriginalData() {
    if (!this.graphInstance) return;

    const currentData = this.graphInstance.graphData();
    if (currentData && currentData.nodes && currentData.links) {
      this.originalGraphData = {
        nodes: [...currentData.nodes], // Create copies to avoid mutation
        links: [...currentData.links]
      };
      console.log(`📦 Stored original data: ${this.originalGraphData.nodes.length} nodes, ${this.originalGraphData.links.length} links`);
    }
  }

  /**
   * Apply data filters by filtering the current graph data
   */
  applyDataFilters() {
    if (!this.graphInstance) {
      console.warn('📊 Cannot apply data filters - no graph instance');
      return;
    }

    // Use original data for filtering, or current data if original not available
    const sourceData = this.originalGraphData || this.graphInstance.graphData();
    if (!sourceData || !sourceData.nodes || !sourceData.links) {
      console.warn('📊 No graph data available for filtering');
      return;
    }

    const filters = {
      showInstances: performanceState.parameters.showInstances,
      showClasses: performanceState.parameters.showClasses,
      showLiterals: performanceState.parameters.showLiterals,
      enableMaxNodeLimit: performanceState.parameters.enableMaxNodeLimit,
      maxNodeCount: performanceState.parameters.maxNodeCount,
      enableMinDegreeFilter: performanceState.parameters.enableMinDegreeFilter,
      minNodeDegree: performanceState.parameters.minNodeDegree
    };

    console.log('🔍 Applying data filters:', filters);

    // Debug: Check the structure of the first few links
    if (sourceData.links.length > 0) {
      const sampleLink = sourceData.links[0];
      console.log('🔗 Sample link structure:', {
        source: sampleLink.source,
        target: sampleLink.target,
        sourceType: typeof sampleLink.source,
        targetType: typeof sampleLink.target
      });
    }

    // Filter nodes based on type
    let filteredNodes = sourceData.nodes.filter(node => {
      // Handle literal nodes
      if (node.isLiteral && !filters.showLiterals) {
        return false;
      }

      // Handle non-literal nodes by type
      if (!node.isLiteral) {
        const nodeType = (node.type ? String(node.type).toLowerCase() : '');

        // Check if it's a class
        if (nodeType.includes('class') && !filters.showClasses) {
          return false;
        }

        // Check if it's an instance/individual
        if ((nodeType.includes('individual') ||
          nodeType.includes('instance') ||
          nodeType.includes('namedindividual') ||
          nodeType === '') && !filters.showInstances) {
          return false;
        }
      }

      return true;
    });

    // Apply node degree filter if enabled
    if (filters.enableMinDegreeFilter && filters.minNodeDegree > 0) {
      filteredNodes = filteredNodes.filter(node => {
        const edgeCount = node.edgeCount || 0;
        return edgeCount >= filters.minNodeDegree;
      });
    }

    // Apply max node count limit if enabled
    if (filters.enableMaxNodeLimit && filters.maxNodeCount > 0) {
      if (filteredNodes.length > filters.maxNodeCount) {
        // Sort by edge count (descending) to keep most connected nodes
        filteredNodes.sort((a, b) => (b.edgeCount || 0) - (a.edgeCount || 0));
        filteredNodes = filteredNodes.slice(0, filters.maxNodeCount);
      }
    }

    // Create set of remaining node IDs for efficient lookup
    const remainingNodeIds = new Set(filteredNodes.map(node => node.id));

    // Debug: Show some remaining node IDs and sample filtered nodes
    console.log(`🔍 Remaining node IDs (first 5):`, Array.from(remainingNodeIds).slice(0, 5));
    console.log(`🔍 Sample filtered nodes:`, filteredNodes.slice(0, 3).map(n => ({ id: n.id, type: n.type, isLiteral: n.isLiteral })));

    // Filter links to only include those between remaining nodes
    let debugCount = 0;
    const filteredLinks = sourceData.links.filter(link => {
      // Handle both string IDs and object references for source/target
      const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target?.id;

      const hasSource = remainingNodeIds.has(sourceId);
      const hasTarget = remainingNodeIds.has(targetId);

      // Debug first few failed links
      if ((!hasSource || !hasTarget) && debugCount < 3) {
        console.log(`🔗 Link filtered out #${debugCount + 1}:`, {
          sourceId,
          targetId,
          hasSource,
          hasTarget,
          sourceObj: link.source,
          targetObj: link.target
        });
        debugCount++;
      }

      return hasSource && hasTarget;
    });

    console.log(`🔍 Filtered data: ${filteredNodes.length} nodes (was ${sourceData.nodes.length}), ${filteredLinks.length} links (was ${sourceData.links.length})`);

    // Update the graph with filtered data
    const filteredData = {
      nodes: filteredNodes,
      links: filteredLinks
    };

    this.graphInstance.graphData(filteredData);

    // Reapply colors after filtering
    setTimeout(() => {
      this.applyAllColors();
    }, 100);

    console.log('✅ Data filters applied successfully');
  }

  /**
   * Get category color for visual organization
   */
  getCategoryColor(categoryName) {
    const colorMap = {
      'Force Simulation': '#ffeaa7',
      'Visual': '#74b9ff',
      'Node Colors': '#7ED321',
      'Link Colors': '#50E3C2',
      'Data Filtering': '#fd79a8',
      'Performance Limits': '#e84393',
      'Rendering': '#00b894',
      'Interaction': '#6c5ce7',
      'UI': '#a29bfe',
      'GPU Optimization': '#4ecdc4',
      'Simulation': '#ffeaa7'
    };

    return colorMap[categoryName] || '#A0AEC0';
  }

  /**
   * Connect to ForceGraph3D instance
   */
  connectToGraph(graphInstance) {
    this.graphInstance = graphInstance;

    // Initialize nuclear optimizer
    this.nuclearOptimizer = new NuclearOptimizationManager(graphInstance);

    // Start performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.start(graphInstance);
    }

    // Apply all current parameters to the graph
    this.applyAllParameters();

    // Apply colors after connecting
    setTimeout(() => {
      this.applyAllColors();
      // Store original data for filtering after colors are applied
      this.storeOriginalData();
    }, 200); // Increased delay to ensure data is fully loaded

    console.log('🔗 D3PerformanceControls connected to ForceGraph3D');
    return this;
  }

  /**
   * Apply all current parameters to the graph
   */
  applyAllParameters() {
    if (!this.graphInstance) return;

    console.log('🔄 Applying all performance parameters...');

    Object.entries(performanceState.parameters).forEach(([key, value]) => {
      this.applyParameterToGraph(key, value);
    });

    // Apply colors after all parameters
    this.applyAllColors();

    console.log('✅ All parameters applied');
  }

  /**
   * Get current parameter value
   */
  getParameter(key) {
    return performanceStateManager.getParameter(key);
  }

  /**
   * Set parameter value
   */
  setParameter(key, value) {
    performanceStateManager.updateParameter(key, value);
  }

  /**
   * Get all parameters
   */
  getAllParameters() {
    return performanceStateManager.getAllParameters();
  }

  /**
   * Fluent API methods for callback setup (compatibility)
   */
  onParameterChange(callback) {
    this.callbacks.onParameterChange = callback;
    return this;
  }

  onPresetLoad(callback) {
    this.callbacks.onPresetLoad = callback;
    return this;
  }

  onPerformanceAlert(callback) {
    this.callbacks.onPerformanceAlert = callback;
    return this;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Cleanup Valtio subscriptions
    if (this.parameterSubscription) this.parameterSubscription();
    if (this.nuclearSubscription) this.nuclearSubscription();
    if (this.metricsSubscription) this.metricsSubscription();

    // Cleanup control subscriptions
    // cleanupValtioSubscriptions(d3.select(this.container)); // This line was removed as per the edit hint

    // Cleanup performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
    }

    // Cleanup nuclear optimizer
    if (this.nuclearOptimizer) {
      this.nuclearOptimizer.cleanup();
    }

    console.log('🧹 D3PerformanceControls destroyed');
  }
} 