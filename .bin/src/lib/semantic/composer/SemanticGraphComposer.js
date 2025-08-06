/**
 * @file SemanticGraphComposer.js
 * @description Orchestrates atomic affordances into complete semantic graph system
 * @affordance:EventCoordinator
 * @capability:composition
 * @capability:orchestration
 */

import { logAffordanceExecution, validateAffordanceContract } from '../affordances/AffordanceManifest.js';

// Graph affordances
import { createForceGraphInstance } from '../graph/function/createForceGraphInstance.js';
import { applyDefaultGraphSettings } from '../graph/function/applyDefaultGraphSettings.js';
import { setGraphData } from '../graph/function/setGraphData.js';
import { clearGraphData } from '../graph/function/clearGraphData.js';
import { onNodeHover } from '../graph/function/onNodeHover.js';
import { onNodeClick } from '../graph/function/onNodeClick.js';

// Panel affordances
import { createRecoveryToggle, showRecoveryToggle, hideRecoveryToggle } from '../panel/function/createRecoveryToggle.js';
import { initializePanelDrag } from '../panel/function/initializePanelDrag.js';

// UI affordances
import { updateStatus } from '../ui/function/updateStatus.js';
import { updateMetrics } from '../ui/function/updateMetrics.js';
import { WebGPUIntegration } from "../gpu/WebGPUIntegration.js";

// Performance monitoring removed per user request

/**
 * Semantic Graph Composer - Orchestrates all atomic affordances
 */
export class SemanticGraphComposer {
  constructor(config = {}) {
    logAffordanceExecution('EventCoordinator', 'SemanticGraphComposer.constructor', { config });

    // Configuration with defaults
    this.config = {
      graphContainer: '#three-d-graph',
      panelContainer: '#control-panel',
      fileSelector: '#ttl-select',
      statusElement: '#graph-status',
      metricsElement: '#graph-metrics',
      enableRecoveryToggle: true,
      enablePanelDrag: true,
      fallbackData: this.createFallbackData(),
      ...config
    };

    // State
    this.graphInstance = null;
    this.panelDragState = null;
    this.recoveryToggle = null;
    this.currentData = null;
    this.elements = {};
    this.initialized = false;

    // DISABLE WebGPU integration entirely to prevent interference
    this.webgpuIntegration = null;
    this.useGPUAcceleration = false;

    console.log('📊 WebGPU integration DISABLED - focusing on basic performance');

    // Don't auto-initialize - caller must call init() when DOM is ready
  }

  /**
   * Initialize all affordances
   */
  async init() {
    if (this.initialized) {
      console.warn('SemanticGraphComposer already initialized');
      return;
    }

    logAffordanceExecution('EventCoordinator', 'init');

    try {
      // Gather DOM elements
      this.gatherElements();

      // Initialize graph affordances
      await this.initializeGraphSystem();

      // Initialize panel affordances 
      this.initializePanelSystem();

      // Initialize UI affordances
      this.initializeUISystem();

      // Initialize file management
      await this.initializeFileSystem();

      // Setup global coordination
      this.setupGlobalEvents();

      this.initialized = true;
      console.log('SemanticGraphComposer initialized successfully');

    } catch (error) {
      console.error('Failed to initialize SemanticGraphComposer:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Gather DOM element references
   */
  gatherElements() {
    this.elements = {
      graphContainer: document.querySelector(this.config.graphContainer),
      panelContainer: document.querySelector(this.config.panelContainer),
      fileSelector: document.querySelector(this.config.fileSelector),
      statusElement: document.querySelector(this.config.statusElement),
      metricsElement: document.querySelector(this.config.metricsElement),
      minimizeBtn: document.querySelector('#minimize-btn'),
      closeBtn: document.querySelector('#close-btn')
    };

    // Validate required elements
    const required = ['graphContainer', 'panelContainer'];
    for (const elementName of required) {
      if (!this.elements[elementName]) {
        throw new Error(`Required element not found: ${this.config[elementName]}`);
      }
    }
  }

  /**
   * Initialize graph affordances
   */
  async initializeGraphSystem() {
    logAffordanceExecution('GraphRenderer', 'initializeGraphSystem');

    console.log('🎯 Initializing graph system...');
    console.log('📦 Container element:', this.elements.graphContainer);
    console.log('📐 Container dimensions:', this.elements.graphContainer?.getBoundingClientRect());

    // Create graph instance
    this.graphInstance = createForceGraphInstance({
      container: this.elements.graphContainer,
      colors: {
        default: '#0078d4',
        hover: '#4da6ff',
        link: '#333'
      },
      interactions: {
        onNodeHover: onNodeHover(
          () => { }, // No-op function since performance monitoring removed
          { performanceTracking: false }
        ),
        onNodeClick: onNodeClick({
          enableSelection: true,
          logClicks: true
        })
      }
    });

    console.log('🔧 ForceGraph3D instance created:', !!this.graphInstance);
    console.log('🎨 Renderer available:', !!this.graphInstance?.renderer());

    // Apply default settings
    applyDefaultGraphSettings(this.graphInstance, {
      backgroundColor: '#0a0a0a',
      showNavInfo: false,
      nodeRelSize: 6, // Slightly larger nodes for visibility
      linkWidth: 2,   // Thicker links for visibility
      nodeLabel: node => node.name || node.label || `Node ${node.id}`
    });

    console.log('⚙️ Default settings applied');

    // Load RDF vocabulary instead of fallback data
    console.log('📊 Loading RDF vocabulary as default...');
    try {
      await this.loadGraphData('/api/graph-data/rdf.ttl');
      console.log('✅ RDF vocabulary loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load RDF vocabulary, using fallback:', error);
      // Only use fallback if RDF fails to load
      const metrics = setGraphData(this.graphInstance, this.config.fallbackData);
      this.updateMetrics(metrics.nodeCount, metrics.linkCount);
      this.updateStatus('Using fallback data', 'ready');
      console.log('✅ Graph system initialized with fallback data');
    }
  }

  /**
   * Initialize panel affordances
   */
  initializePanelSystem() {
    logAffordanceExecution('PanelContainer', 'initializePanelSystem');

    // Initialize drag behavior
    if (this.config.enablePanelDrag && this.elements.panelContainer) {
      this.panelDragState = initializePanelDrag(this.elements.panelContainer, {
        dragHandle: '.panel-header',
        constrainToViewport: true
      });
    }

    // Initialize panel controls
    this.setupPanelControls();

    // Initialize recovery toggle
    if (this.config.enableRecoveryToggle) {
      this.recoveryToggle = createRecoveryToggle({
        onToggleClick: () => this.showPanel()
      });
    }
  }

  /**
   * Setup panel control buttons
   */
  setupPanelControls() {
    // Minimize button
    if (this.elements.minimizeBtn) {
      this.elements.minimizeBtn.addEventListener('click', () => {
        this.togglePanelMinimize();
      });
    }

    // Close button  
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        this.hidePanel();
      });
    }

    // Double-click header to minimize
    const header = this.elements.panelContainer?.querySelector('.panel-header');
    if (header) {
      header.addEventListener('dblclick', () => {
        this.togglePanelMinimize();
      });
    }
  }

  /**
   * Initialize UI state affordances
   */
  initializeUISystem() {
    logAffordanceExecution('StatusManager', 'initializeUISystem');

    // Initialize status with default message
    this.updateStatus('Ready to load ontology', 'ready');
    this.updateMetrics(0, 0);
    // Performance monitoring removed
  }

  // Performance monitoring removed per user request

  /**
   * Initialize file management system
   */
  async initializeFileSystem() {
    logAffordanceExecution('FileManager', 'initializeFileSystem');

    // Load ontology files
    await this.loadOntologyFiles();

    // Setup file selector
    if (this.elements.fileSelector) {
      this.elements.fileSelector.addEventListener('change', (e) => {
        this.handleFileSelection(e.target.value);
      });
    }
  }

  /**
   * Load available ontology files
   */
  async loadOntologyFiles() {
    this.updateStatus('Loading ontology files...', 'loading');

    try {
      const response = await fetch('/api/ontologies.json');
      const data = await response.json();

      if (data.files && data.files.length > 0) {
        this.populateFileSelector(data.files);
        this.updateStatus('Select an ontology to visualize', 'ready');
        // Performance monitoring removed
      } else {
        throw new Error('No ontology files found');
      }
    } catch (error) {
      console.error('Failed to load ontology files:', error);
      this.populateFileSelector([
        { filename: 'example.ttl', name: 'example', apiPath: '/api/graph-data/example.ttl' },
        { filename: 'test.ttl', name: 'test', apiPath: '/api/graph-data/test.ttl' }
      ]);
      this.updateStatus('Using fallback file list', 'warning');
      // Performance monitoring removed
    }
  }

  /**
   * Populate file selector with options
   */
  populateFileSelector(files) {
    if (!this.elements.fileSelector) return;

    this.elements.fileSelector.innerHTML = '<option value="">Choose an ontology...</option>';

    files.forEach(file => {
      const option = document.createElement('option');
      option.value = file.apiPath;
      option.textContent = `${file.name} (${file.filename})`;
      this.elements.fileSelector.appendChild(option);
    });
  }

  /**
   * Handle file selection
   */
  async handleFileSelection(apiPath) {
    if (apiPath) {
      await this.loadGraphData(apiPath);
    } else {
      this.resetToFallbackData();
    }
  }

  /**
   * Load graph data from API
   */
  async loadGraphData(apiPath) {
    const startTime = performance.now();
    this.updateStatus('Loading graph data...', 'loading');
    this.updateMetrics(0, 0);
    // Performance monitoring removed

    console.log('🔄 Loading graph data from:', apiPath);

    try {
      // Clear previous data (performance monitoring removed)

      const response = await fetch(apiPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Graph data loaded - nodes:', data.nodes?.length, 'links:', data.links?.length);

      if (data.nodes && data.links) {
        console.log('🔄 Setting graph data...');
        const metrics = setGraphData(this.graphInstance, data);
        this.currentData = data;

        const loadTime = Math.round(performance.now() - startTime);
        this.updateMetrics(metrics.nodeCount, metrics.linkCount);
        this.updateStatus(`Loaded: ${apiPath.split('/').pop()}`, 'success');

        // Performance monitoring removed - just show load status
        this.updateStatus(`Loaded: ${apiPath.split('/').pop()}`, 'success');

        console.log('✅ Graph data loaded successfully');
      } else {
        throw new Error('Invalid graph data format');
      }
    } catch (error) {
      console.error('Failed to load graph data:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
      // Performance monitoring removed
      this.resetToFallbackData();
    }
  }

  /**
   * Reset to fallback data
   */
  resetToFallbackData() {
    const metrics = setGraphData(this.graphInstance, this.config.fallbackData);
    this.updateMetrics(metrics.nodeCount, metrics.linkCount);
    this.updateStatus('Using default data', 'ready');
    // Performance monitoring removed
  }

  /**
   * Setup global event coordination
   */
  setupGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.showPanel();
      }
      if (e.key === 'Tab' && e.ctrlKey) {
        this.togglePanelMinimize();
        e.preventDefault();
      }
    });
  }

  // === PANEL CONTROL METHODS ===

  showPanel() {
    if (this.elements.panelContainer) {
      this.elements.panelContainer.classList.remove('hidden', 'minimized');
      if (this.recoveryToggle) {
        hideRecoveryToggle(this.recoveryToggle);
      }
    }
  }

  hidePanel() {
    if (this.elements.panelContainer) {
      this.elements.panelContainer.classList.add('hidden');
      if (this.recoveryToggle) {
        showRecoveryToggle(this.recoveryToggle);
      }
    }
  }

  togglePanelMinimize() {
    if (this.elements.panelContainer) {
      this.elements.panelContainer.classList.toggle('minimized');
      const isMinimized = this.elements.panelContainer.classList.contains('minimized');
      if (this.elements.minimizeBtn) {
        this.elements.minimizeBtn.textContent = isMinimized ? '+' : '−';
      }
    }
  }

  // === UI UPDATE METHODS ===

  updateStatus(message, type = 'ready') {
    updateStatus(this.elements.statusElement, message, type);
  }

  updateMetrics(nodeCount, linkCount) {
    updateMetrics(this.elements.metricsElement, nodeCount, linkCount, {
      formatLargeNumbers: true,
      showPerformanceWarnings: true
    });
  }

  updatePerformance(message, status = 'ready') {
    // Performance monitoring removed - method kept for compatibility
    // but no longer updates UI elements
  }

  /**
   * Create fallback data
   */
  createFallbackData() {
    const N = 50;
    return {
      nodes: [...Array(N).keys()].map(i => ({ id: i, name: `Node ${i}` })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: id,
          target: Math.round(Math.random() * (id - 1))
        }))
    };
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('Initialization failed:', error);

    // Try to show error in UI if possible
    if (this.elements.statusElement) {
      this.updateStatus(`Initialization failed: ${error.message}`, 'error');
    }

    // Show basic recovery UI
    document.body.innerHTML += `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: rgba(255, 0, 0, 0.9); color: white; padding: 20px; 
                  border-radius: 8px; z-index: 9999;">
        <h3>Semantic Graph Composer Error</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  /**
 * Cleanup resources
 */
  destroy() {
    if (this.panelDragState) {
      this.panelDragState.cleanup();
    }

    if (this.recoveryToggle) {
      this.recoveryToggle.remove();
    }

    // Performance monitoring cleanup removed

    // Remove event listeners
    document.removeEventListener('keydown', this.setupGlobalEvents);
  }
} 