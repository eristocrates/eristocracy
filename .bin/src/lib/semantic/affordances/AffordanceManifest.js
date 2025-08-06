/**
 * @file AffordanceManifest.js
 * @description Semantic registry for all atomic affordances in the system
 * @affordance:ManifestRegistry
 * @capability:introspection
 * @capability:orchestration  
 * @capability:validation
 */

// === SEMANTIC SCHEMAS ===

export const GraphSchema = {
  container: { type: 'HTMLElement', required: true },
  nodes: { type: 'Array', required: true },
  links: { type: 'Array', required: true },
  colors: {
    type: 'Object',
    properties: {
      default: { type: 'string', default: '#0078d4' },
      hover: { type: 'string', default: '#4da6ff' },
      link: { type: 'string', default: '#333' }
    }
  },
  interactions: {
    type: 'Object',
    properties: {
      onNodeHover: { type: 'function', optional: true },
      onNodeClick: { type: 'function', optional: true }
    }
  }
};

export const PanelSchema = {
  container: { type: 'HTMLElement', required: true },
  position: {
    type: 'Object',
    properties: {
      top: { type: 'number', default: 20 },
      left: { type: 'number', default: 20 }
    }
  },
  draggable: { type: 'boolean', default: true },
  minimizable: { type: 'boolean', default: true },
  closable: { type: 'boolean', default: true }
};

export const FileSchema = {
  apiPath: { type: 'string', required: true },
  files: { type: 'Array', required: true },
  fallbacks: { type: 'Array', default: [] }
};

export const UISchema = {
  elements: {
    type: 'Object',
    properties: {
      status: { type: 'HTMLElement', required: true },
      metrics: { type: 'HTMLElement', required: true },
      performance: { type: 'HTMLElement', required: true }
    }
  },
  styles: {
    type: 'Object',
    properties: {
      loading: { type: 'string', default: '#ffa500' },
      ready: { type: 'string', default: '#10b981' },
      error: { type: 'string', default: '#ff6b6b' }
    }
  }
};

// === AFFORDANCE REGISTRY ===

export const AffordanceManifest = {
  // === GRAPH AFFORDANCES ===
  GraphRenderer: {
    id: 'GraphRenderer',
    type: 'renderer',
    cognitiveFunction: 'Transforms semantic data into 3D spatial representation',
    exposedMethods: [
      'createForceGraphInstance',
      'bindForceGraphToDOM',
      'applyDefaultGraphSettings',
      'setGraphData'
    ],
    inputSchema: GraphSchema,
    domTarget: '#three-d-graph',
    eventSurface: ['hover', 'click', 'drag'],
    dependencies: ['ForceGraph3D'],
    invariants: {
      data_integrity: 'Graph data structure preserved during transformations',
      spatial_consistency: 'Node positions remain stable during updates',
      interaction_responsiveness: 'User interactions provide immediate feedback'
    }
  },

  GraphEvents: {
    id: 'GraphEvents',
    type: 'interaction',
    cognitiveFunction: 'Handles user interactions with graph elements',
    exposedMethods: [
      'onNodeHover',
      'onNodeClick',
      'registerEventHandlers',
      'unregisterEventHandlers'
    ],
    inputSchema: GraphSchema,
    eventSurface: ['mouseover', 'mouseout', 'click'],
    dependencies: ['GraphRenderer'],
    invariants: {
      event_propagation: 'Events propagate to all registered handlers',
      state_consistency: 'UI state reflects interaction state accurately'
    }
  },

  // === PANEL AFFORDANCES ===
  PanelContainer: {
    id: 'PanelContainer',
    type: 'ui_container',
    cognitiveFunction: 'Provides draggable, resizable interface container',
    exposedMethods: [
      'createPanelElement',
      'initializePanelDrag',
      'initializePanelControls',
      'createPanelToggle'
    ],
    inputSchema: PanelSchema,
    domTarget: '#control-panel',
    eventSurface: ['mousedown', 'mousemove', 'mouseup', 'click'],
    dependencies: [],
    invariants: {
      spatial_containment: 'Panel remains within viewport bounds',
      state_persistence: 'Panel state persists across interactions',
      recovery_guarantee: 'Panel can always be recovered if hidden'
    }
  },

  PanelRecovery: {
    id: 'PanelRecovery',
    type: 'recovery_mechanism',
    cognitiveFunction: 'Ensures UI accessibility when panel is hidden',
    exposedMethods: [
      'createRecoveryToggle',
      'registerRecoveryShortcuts',
      'createContextMenu'
    ],
    inputSchema: PanelSchema,
    domTarget: 'body',
    eventSurface: ['keydown', 'contextmenu', 'click'],
    dependencies: ['PanelContainer'],
    invariants: {
      always_accessible: 'Recovery mechanism always available',
      fail_safe: 'Multiple recovery paths exist'
    }
  },

  // === FILE AFFORDANCES ===
  FileManager: {
    id: 'FileManager',
    type: 'data_source',
    cognitiveFunction: 'Manages ontology file discovery and selection',
    exposedMethods: [
      'loadOntologyFiles',
      'populateFileSelector',
      'handleFileSelection'
    ],
    inputSchema: FileSchema,
    domTarget: '#ttl-select',
    eventSurface: ['change'],
    dependencies: [],
    invariants: {
      file_availability: 'Fallback files always available',
      selection_validity: 'Selected files are validated before loading'
    }
  },

  DataLoader: {
    id: 'DataLoader',
    type: 'data_pipeline',
    cognitiveFunction: 'Loads and transforms ontology data for visualization',
    exposedMethods: [
      'loadGraphData',
      'validateGraphData',
      'transformDataFormat'
    ],
    inputSchema: FileSchema,
    eventSurface: [],
    dependencies: ['FileManager'],
    invariants: {
      data_integrity: 'Data transformations preserve semantic meaning',
      error_recovery: 'Failed loads fallback to default data'
    }
  },

  // === UI STATE AFFORDANCES ===
  StatusManager: {
    id: 'StatusManager',
    type: 'ui_state',
    cognitiveFunction: 'Manages real-time UI feedback and status indicators',
    exposedMethods: [
      'updateStatus',
      'updateMetrics',
      'updatePerformance',
      'getUIElements'
    ],
    inputSchema: UISchema,
    domTarget: '.status-line',
    eventSurface: [],
    dependencies: [],
    invariants: {
      status_accuracy: 'Status reflects actual system state',
      performance_tracking: 'Performance metrics are accurate and timely'
    }
  },

  // === EVENT COORDINATION ===
  EventCoordinator: {
    id: 'EventCoordinator',
    type: 'system_orchestration',
    cognitiveFunction: 'Coordinates events between atomic affordances',
    exposedMethods: [
      'setupGlobalKeyboards',
      'coordinateEvents',
      'createEventBus'
    ],
    inputSchema: {},
    domTarget: 'document',
    eventSurface: ['keydown', 'custom'],
    dependencies: ['all'],
    invariants: {
      event_isolation: 'Affordance events do not interfere with each other',
      system_coherence: 'Global shortcuts work regardless of focus state'
    }
  }
};

// === VALIDATION UTILITIES ===

export function validateAffordanceContract(affordanceId, inputData) {
  const manifest = AffordanceManifest[affordanceId];
  if (!manifest) {
    throw new Error(`Unknown affordance: ${affordanceId}`);
  }

  // Schema validation logic would go here
  // For now, basic existence check
  return { valid: true, errors: [] };
}

export function getAffordanceDependencies(affordanceId) {
  const manifest = AffordanceManifest[affordanceId];
  return manifest?.dependencies || [];
}

export function logAffordanceExecution(affordanceId, methodName, params = {}) {
  console.log(`[${affordanceId}] ${methodName}`, params);
}

export function introspectAffordance(affordanceId) {
  const manifest = AffordanceManifest[affordanceId];
  if (!manifest) return null;

  return {
    id: manifest.id,
    type: manifest.type,
    cognitiveFunction: manifest.cognitiveFunction,
    methods: manifest.exposedMethods,
    dependencies: manifest.dependencies,
    invariants: manifest.invariants,
    schema: manifest.inputSchema
  };
} 