/**
 * Performance Parameter Schema
 * 
 * Comprehensive parameter definitions for ForceGraph3D performance tuning
 * and core force simulation controls. Includes nuclear optimization parameters.
 */

export const PerformanceImpactCategories = {
  cpu: {
    color: '#ff6b6b',
    description: 'CPU/JavaScript computation',
    severity: 'high'
  },
  gpu: {
    color: '#4ecdc4',
    description: 'GPU/WebGL rendering',
    severity: 'high'
  },
  memory: {
    color: '#45b7d1',
    description: 'Memory allocation',
    severity: 'medium'
  },
  draw_calls: {
    color: '#96ceb4',
    description: 'Rendering commands',
    severity: 'critical'
  },
  simulation: {
    color: '#ffeaa7',
    description: 'Force simulation',
    severity: 'medium'
  },
  visual: {
    color: '#dda0dd',
    description: 'Visual appearance',
    severity: 'low'
  },
  nuclear: {
    color: '#ff4757',
    description: 'Nuclear optimization',
    severity: 'extreme'
  }
};

export const PerformanceParameterSchema = {
  // === CORE FORCE SIMULATION ===
  linkDistance: {
    type: 'number',
    min: 10,
    max: 100000,
    step: 5,
    default: 80,
    unit: 'px',
    label: 'Link Distance',
    impact: 'simulation',
    forceGraphMethod: null, // Handled specially via d3Force('link').distance()
    category: 'Force Simulation'
  },

  chargeStrength: {
    type: 'number',
    min: -1000000,
    max: 0,
    step: 10,
    default: -400,
    unit: '',
    label: 'Charge Strength',
    impact: 'simulation',
    forceGraphMethod: null, // Handled specially via d3Force('charge').strength()
    category: 'Force Simulation'
  },

  nodeCollisionRadius: {
    type: 'number',
    min: 5,
    max: 10000,
    step: 1,
    default: 25,
    unit: 'px',
    label: 'Collision Radius',
    impact: 'simulation',
    forceGraphMethod: null, // Handled via collision force
    category: 'Force Simulation'
  },

  // === VISUAL BASIC ===
  nodeRadius: {
    type: 'number',
    min: 1,
    max: 50,
    step: 0.5,
    default: 10,
    unit: 'px',
    label: 'Node Radius',
    impact: 'visual',
    forceGraphMethod: 'nodeVal',
    category: 'Visual'
  },

  nodeOpacity: {
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.9,
    unit: '',
    label: 'Node Opacity',
    impact: 'visual',
    forceGraphMethod: 'nodeOpacity',
    category: 'Visual'
  },

  linkWidth: {
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    default: 1,
    unit: 'px',
    label: 'Link Width',
    impact: 'visual',
    forceGraphMethod: 'linkWidth',
    category: 'Visual'
  },

  linkOpacity: {
    type: 'number',
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.06,
    unit: '',
    label: 'Link Opacity',
    impact: 'visual',
    forceGraphMethod: 'linkOpacity',
    category: 'Visual'
  },

  labelFontSize: {
    type: 'number',
    min: 6,
    max: 24,
    step: 1,
    default: 10,
    unit: 'px',
    label: 'Label Font Size',
    impact: 'visual',
    forceGraphMethod: 'nodeLabel',
    category: 'Visual'
  },

  backgroundColor: {
    type: 'color',
    default: '#000000',
    label: 'Background Color',
    impact: 'visual',
    forceGraphMethod: 'backgroundColor',
    category: 'Visual'
  },

  // === NODE COLORS ===
  classNodeColor: {
    type: 'color',
    default: '#4A90E2',
    label: 'Class Node Color',
    impact: 'visual',
    forceGraphMethod: 'nodeColor',
    category: 'Node Colors'
  },

  instanceNodeColor: {
    type: 'color',
    default: '#7ED321',
    label: 'Instance Node Color',
    impact: 'visual',
    forceGraphMethod: 'nodeColor',
    category: 'Node Colors'
  },

  literalNodeColor: {
    type: 'color',
    default: '#F5A623',
    label: 'Literal Node Color',
    impact: 'visual',
    forceGraphMethod: 'nodeColor',
    category: 'Node Colors'
  },

  blankNodeColor: {
    type: 'color',
    default: '#BD10E0',
    label: 'Blank Node Color',
    impact: 'visual',
    forceGraphMethod: 'nodeColor',
    category: 'Node Colors'
  },

  // === LINK COLORS ===
  objectPropertyColor: {
    type: 'color',
    default: '#50E3C2',
    label: 'Object Property Color',
    impact: 'visual',
    forceGraphMethod: 'linkColor',
    category: 'Link Colors'
  },

  datatypePropertyColor: {
    type: 'color',
    default: '#B8E986',
    label: 'Datatype Property Color',
    impact: 'visual',
    forceGraphMethod: 'linkColor',
    category: 'Link Colors'
  },

  rdfPropertyColor: {
    type: 'color',
    default: '#9013FE',
    label: 'RDF Property Color',
    impact: 'visual',
    forceGraphMethod: 'linkColor',
    category: 'Link Colors'
  },

  // === DATA FILTERING (NOW TOGGLEABLE) ===
  showInstances: {
    type: 'boolean',
    default: true,
    label: 'Show Instances',
    impact: 'cpu',
    forceGraphMethod: null, // Handled by data filtering
    category: 'Data Filtering'
  },

  showClasses: {
    type: 'boolean',
    default: true,
    label: 'Show Classes',
    impact: 'cpu',
    forceGraphMethod: null,
    category: 'Data Filtering'
  },

  showLiterals: {
    type: 'boolean',
    default: true,
    label: 'Show Literals',
    impact: 'cpu',
    forceGraphMethod: null,
    category: 'Data Filtering'
  },

  // === PERFORMANCE LIMITS (NOW TOGGLEABLE AND OFF BY DEFAULT) ===
  enableMaxNodeLimit: {
    type: 'boolean',
    default: false,
    label: 'Enable Max Node Limit',
    impact: 'memory',
    forceGraphMethod: null,
    category: 'Performance Limits'
  },

  maxNodeCount: {
    type: 'number',
    min: 50,
    max: 5000,
    step: 50,
    default: 200,
    unit: '',
    label: 'Max Node Count',
    impact: 'memory',
    forceGraphMethod: null,
    category: 'Performance Limits'
  },

  enableMinDegreeFilter: {
    type: 'boolean',
    default: false,
    label: 'Enable Min Degree Filter',
    impact: 'cpu',
    forceGraphMethod: null,
    category: 'Performance Limits'
  },

  minNodeDegree: {
    type: 'number',
    min: 0,
    max: 20,
    step: 1,
    default: 0,
    unit: '',
    label: 'Min Node Degree',
    impact: 'cpu',
    forceGraphMethod: null,
    category: 'Performance Limits'
  },

  // === NODE SIZING ===
  nodeSizeByDegree: {
    type: 'boolean',
    default: true,
    label: 'Size Nodes by Degree',
    impact: 'visual',
    forceGraphMethod: null, // Custom implementation
    category: 'Node Sizing'
  },

  minNodeSize: {
    type: 'number',
    min: 1,
    max: 20,
    step: 0.5,
    default: 4,
    unit: 'px',
    label: 'Min Node Size',
    impact: 'visual',
    forceGraphMethod: null,
    category: 'Node Sizing'
  },

  maxNodeSize: {
    type: 'number',
    min: 5,
    max: 500,
    step: 5,
    default: 20,
    unit: 'px',
    label: 'Max Node Size',
    impact: 'visual',
    forceGraphMethod: null,
    category: 'Node Sizing'
  },

  // === RENDERING PERFORMANCE ===
  enablePointerInteraction: {
    type: 'boolean',
    default: true,
    label: 'Pointer Interaction',
    impact: 'cpu',
    forceGraphMethod: 'enablePointerInteraction',
    category: 'Rendering'
  },

  enableNodeDrag: {
    type: 'boolean',
    default: true,
    label: 'Node Dragging',
    impact: 'cpu',
    forceGraphMethod: 'enableNodeDrag',
    category: 'Interaction'
  },

  showNavInfo: {
    type: 'boolean',
    default: true,
    label: 'Navigation Info',
    impact: 'visual',
    forceGraphMethod: 'showNavInfo',
    category: 'UI'
  },

  // === INSTANCED RENDERING ===
  instancedNodes: {
    type: 'boolean',
    default: false,
    label: 'Instanced Nodes',
    impact: 'draw_calls',
    forceGraphMethod: null, // Custom implementation
    category: 'GPU Optimization'
  },

  instancedLinks: {
    type: 'boolean',
    default: false,
    label: 'Instanced Links',
    impact: 'draw_calls',
    forceGraphMethod: null,
    category: 'GPU Optimization'
  },

  instancedNodeType: {
    type: 'select',
    options: [
      { value: 'sphere', label: 'Sphere' },
      { value: 'cube', label: 'Cube' },
      { value: 'tetrahedron', label: 'Tetrahedron' },
      { value: 'octahedron', label: 'Octahedron' },
      { value: 'icosahedron', label: 'Icosahedron' },
      { value: 'dodecahedron', label: 'Dodecahedron' }
    ],
    default: 'sphere',
    label: 'Instanced Node Type',
    impact: 'gpu',
    forceGraphMethod: null, // Custom implementation
    category: 'GPU Optimization'
  },

  instancedGeometryLOD: {
    type: 'number',
    min: 3,
    max: 32,
    step: 1,
    default: 8,
    unit: '',
    label: 'Geometry LOD',
    impact: 'gpu',
    forceGraphMethod: null,
    category: 'GPU Optimization'
  },

  // === NUCLEAR OPTIMIZATIONS ===
  phase1: {
    type: 'boolean',
    default: false,
    label: '💀 Phase 1: Material Consolidation',
    impact: 'nuclear',
    forceGraphMethod: null,
    category: 'Nuclear Optimization',
    warning: 'Disables labels and pointer interaction'
  },

  phase2: {
    type: 'boolean',
    default: false,
    label: '💀 Phase 2: Instanced Rendering',
    impact: 'nuclear',
    forceGraphMethod: null,
    category: 'Nuclear Optimization',
    warning: 'Replaces all nodes/links with instanced meshes'
  },

  // === ANIMATION & SIMULATION ===
  warmupTicks: {
    type: 'number',
    min: 0,
    max: 300,
    step: 10,
    default: 0,
    unit: '',
    label: 'Warmup Ticks',
    impact: 'simulation',
    forceGraphMethod: 'warmupTicks',
    category: 'Simulation'
  },

  cooldownTicks: {
    type: 'number',
    min: 0,
    max: 1000,
    step: 10,
    default: 1000,
    unit: '',
    label: 'Cooldown Ticks',
    impact: 'simulation',
    forceGraphMethod: 'cooldownTicks',
    category: 'Simulation'
  },

  cooldownTime: {
    type: 'number',
    min: 1000,
    max: 30000,
    step: 1000,
    default: 15000,
    unit: 'ms',
    label: 'Cooldown Time',
    impact: 'simulation',
    forceGraphMethod: 'cooldownTime',
    category: 'Simulation'
  }
};

export const PerformancePresets = {
  balanced: {
    // Core simulation - moderate settings
    linkDistance: 80,
    chargeStrength: -400,
    nodeCollisionRadius: 25,

    // Visual - standard quality
    nodeRadius: 10,
    nodeOpacity: 0.9,
    linkWidth: 1,
    linkOpacity: 0.6,
    labelFontSize: 10,
    backgroundColor: '#000000',

    // Colors - original palette
    classNodeColor: '#4A90E2',
    instanceNodeColor: '#7ED321',
    literalNodeColor: '#F5A623',
    blankNodeColor: '#BD10E0',
    objectPropertyColor: '#50E3C2',
    datatypePropertyColor: '#B8E986',
    rdfPropertyColor: '#9013FE',

    // Data - show everything
    showInstances: true,
    showClasses: true,
    showLiterals: true,

    // Performance limits - OFF by default
    enableMaxNodeLimit: false,
    maxNodeCount: 200,
    enableMinDegreeFilter: false,
    minNodeDegree: 0,

    // Node sizing
    nodeSizeByDegree: true,
    minNodeSize: 4,
    maxNodeSize: 20,

    // Interaction - full features
    enablePointerInteraction: true,
    enableNodeDrag: true,
    showNavInfo: true,

    // Performance - no instancing
    instancedNodes: false,
    instancedLinks: false,
    instancedNodeType: 'sphere',
    instancedGeometryLOD: 8,

    // Nuclear - off
    phase1: false,
    phase2: false,

    // Simulation - standard
    warmupTicks: 0,
    cooldownTicks: 1000,
    cooldownTime: 15000
  },

  performance: {
    // More aggressive settings for better performance
    linkDistance: 60,
    chargeStrength: -300,
    nodeCollisionRadius: 15,
    nodeRadius: 6,
    nodeOpacity: 0.8,
    linkWidth: 0.8,
    linkOpacity: 0.4,
    labelFontSize: 8,
    backgroundColor: '#000000',

    // Standard colors
    classNodeColor: '#4A90E2',
    instanceNodeColor: '#7ED321',
    literalNodeColor: '#F5A623',
    blankNodeColor: '#BD10E0',
    objectPropertyColor: '#50E3C2',
    datatypePropertyColor: '#B8E986',
    rdfPropertyColor: '#9013FE',

    // Reduced data
    showInstances: true,
    showClasses: true,
    showLiterals: false, // Hide literals for performance

    // Performance limits - enabled
    enableMaxNodeLimit: true,
    maxNodeCount: 150,
    enableMinDegreeFilter: true,
    minNodeDegree: 1, // Filter low-degree nodes

    // Node sizing
    nodeSizeByDegree: true,
    minNodeSize: 3,
    maxNodeSize: 15,

    // Limited interaction
    enablePointerInteraction: true,
    enableNodeDrag: false,
    showNavInfo: false,

    // Basic instancing
    instancedNodes: true,
    instancedLinks: false,
    instancedNodeType: 'sphere',
    instancedGeometryLOD: 6,

    // Nuclear - off
    phase1: false,
    phase2: false,

    // Faster simulation
    warmupTicks: 50,
    cooldownTicks: 500,
    cooldownTime: 10000
  },

  nuclear: {
    // Nuclear preset - maximum performance sacrifice
    linkDistance: 40,
    chargeStrength: -200,
    nodeCollisionRadius: 10,
    nodeRadius: 4,
    nodeOpacity: 0.7,
    linkWidth: 0.5,
    linkOpacity: 0.3,
    labelFontSize: 6,
    backgroundColor: '#000000',

    // Minimal colors
    classNodeColor: '#ffffff',
    instanceNodeColor: '#ffffff',
    literalNodeColor: '#ffffff',
    blankNodeColor: '#ffffff',
    objectPropertyColor: '#888888',
    datatypePropertyColor: '#888888',
    rdfPropertyColor: '#888888',

    // Minimal data
    showInstances: true,
    showClasses: true,
    showLiterals: false,

    // Aggressive filtering
    enableMaxNodeLimit: true,
    maxNodeCount: 100,
    enableMinDegreeFilter: true,
    minNodeDegree: 2,

    // Minimal sizing
    nodeSizeByDegree: false,
    minNodeSize: 2,
    maxNodeSize: 8,

    // No interaction
    enablePointerInteraction: false,
    enableNodeDrag: false,
    showNavInfo: false,

    // Max instancing
    instancedNodes: true,
    instancedLinks: true,
    instancedNodeType: 'sphere',
    instancedGeometryLOD: 4,

    // NUCLEAR ACTIVATED
    phase1: true,
    phase2: true,

    // Minimal simulation
    warmupTicks: 100,
    cooldownTicks: 200,
    cooldownTime: 5000
  },

  quality: {
    // High quality settings - performance second
    linkDistance: 120,
    chargeStrength: -600,
    nodeCollisionRadius: 35,
    nodeRadius: 15,
    nodeOpacity: 1.0,
    linkWidth: 2,
    linkOpacity: 0.8,
    labelFontSize: 12,
    backgroundColor: '#000000',

    // Full color palette
    classNodeColor: '#4A90E2',
    instanceNodeColor: '#7ED321',
    literalNodeColor: '#F5A623',
    blankNodeColor: '#BD10E0',
    objectPropertyColor: '#50E3C2',
    datatypePropertyColor: '#B8E986',
    rdfPropertyColor: '#9013FE',

    // Show everything
    showInstances: true,
    showClasses: true,
    showLiterals: true,

    // No limits
    enableMaxNodeLimit: false,
    maxNodeCount: 500,
    enableMinDegreeFilter: false,
    minNodeDegree: 0,

    // Large sizing
    nodeSizeByDegree: true,
    minNodeSize: 8,
    maxNodeSize: 30,

    // Full interaction
    enablePointerInteraction: true,
    enableNodeDrag: true,
    showNavInfo: true,

    // No instancing - pure quality
    instancedNodes: false,
    instancedLinks: false,
    instancedNodeType: 'icosahedron',
    instancedGeometryLOD: 16,

    // Nuclear - off
    phase1: false,
    phase2: false,

    // Detailed simulation
    warmupTicks: 0,
    cooldownTicks: 2000,
    cooldownTime: 20000
  }
}; 