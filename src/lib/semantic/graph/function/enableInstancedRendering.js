/**
 * @file enableInstancedRendering.js
 * @description Atomic function: Enables instanced rendering for performance
 * @affordance:PerformanceAffordance
 * @method:enableInstancedRendering
 */

import { logAffordanceExecution } from '../../affordances/AffordanceManifest.js';
import * as THREE from 'three';

/**
 * Enables instanced rendering for a ForceGraph3D instance
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} strategy - Optimization strategy from setGraphData
 * @param {Object} config - Configuration options
 * @returns {Object} Instancing state and cleanup functions
 */
export function enableInstancedRendering(graph, strategy, config = {}) {
  logAffordanceExecution('PerformanceAffordance', 'enableInstancedRendering', {
    hasGraph: !!graph,
    strategy: strategy.renderingMode,
    useInstancing: strategy.useInstancing
  });

  if (!graph) {
    throw new Error('enableInstancedRendering: graph instance is required');
  }

  if (!strategy.useInstancing) {
    console.log('Instancing not recommended for current node count');
    return { enabled: false };
  }

  const {
    nodeGeometry = 'sphere',
    nodeColor = '#0078d4',
    nodeSize = 4,
    maxInstances = 50000,
    enableLOD = strategy.useLOD
  } = config;

  // Create instanced meshes for nodes
  const instancedState = createInstancedNodeMeshes(strategy, {
    geometry: nodeGeometry,
    color: nodeColor,
    size: nodeSize,
    maxInstances,
    enableLOD
  });

  // Configure ForceGraph3D to use instanced rendering
  configureGraphInstancing(graph, instancedState, strategy);

  // Setup update mechanism
  const updateFunctions = setupInstancedUpdates(instancedState, strategy);

  return {
    enabled: true,
    renderingMode: strategy.renderingMode,
    instancedMeshes: instancedState.meshes,
    updatePositions: updateFunctions.updatePositions,
    updateColors: updateFunctions.updateColors,
    cleanup: () => cleanupInstancedMeshes(instancedState)
  };
}

/**
 * Creates instanced meshes for different LOD levels
 * @param {Object} strategy - Optimization strategy
 * @param {Object} config - Mesh configuration
 * @returns {Object} Instanced mesh state
 */
function createInstancedNodeMeshes(strategy, config) {
  const meshes = {};
  const matrices = {};
  const colors = {};

  // Create geometry based on config
  const geometries = createNodeGeometries(config);

  // Create instanced meshes for each LOD level
  const lodLevels = strategy.useLOD ? ['high', 'medium', 'low'] : ['default'];

  lodLevels.forEach(lod => {
    const geometry = geometries[lod];
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.InstancedMesh(geometry, material, config.maxInstances);
    mesh.frustumCulled = false; // We'll handle culling manually
    mesh.count = 0; // Start with no instances

    // Setup instance attributes
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    meshes[lod] = mesh;
    matrices[lod] = matrix;
    colors[lod] = color;
  });

  return {
    meshes,
    matrices,
    colors,
    lodLevels,
    currentInstanceCount: 0
  };
}

/**
 * Creates geometries for different LOD levels
 * @param {Object} config - Geometry configuration
 * @returns {Object} Geometries by LOD level
 */
function createNodeGeometries(config) {
  const baseSize = config.size;

  return {
    high: new THREE.SphereGeometry(baseSize, 16, 12),
    medium: new THREE.SphereGeometry(baseSize, 8, 6),
    low: new THREE.SphereGeometry(baseSize, 4, 3),
    default: new THREE.SphereGeometry(baseSize, 8, 6)
  };
}

/**
 * Configures ForceGraph3D to use instanced rendering
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} instancedState - Instanced mesh state
 * @param {Object} strategy - Optimization strategy
 */
function configureGraphInstancing(graph, instancedState, strategy) {
  // Override node rendering to use instances
  graph.nodeThreeObject(() => null); // Disable individual node meshes

  // Add instanced meshes to the scene
  Object.values(instancedState.meshes).forEach(mesh => {
    graph.scene().add(mesh);
  });

  // Configure Points fallback for ultra-performance mode
  if (strategy.usePoints) {
    setupPointsRendering(graph, strategy);
  }
}

/**
 * Sets up Points-based rendering for maximum performance
 * @param {Object} graph - ForceGraph3D instance
 * @param {Object} strategy - Optimization strategy
 */
function setupPointsRendering(graph, strategy) {
  // Create Points geometry for ultra-performance
  const pointsGeometry = new THREE.BufferGeometry();
  const pointsMaterial = new THREE.PointsMaterial({
    color: '#0078d4',
    size: 2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.8
  });

  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  graph.scene().add(points);

  // Store reference for updates
  graph.__pointsObject = points;
}

/**
 * Sets up update functions for instanced rendering
 * @param {Object} instancedState - Instanced mesh state
 * @param {Object} strategy - Optimization strategy
 * @returns {Object} Update functions
 */
function setupInstancedUpdates(instancedState, strategy) {
  const updatePositions = (nodes, camera) => {
    if (!nodes || nodes.length === 0) return;

    let instanceIndex = 0;

    nodes.forEach((node, nodeIndex) => {
      if (!node.x || !node.y || !node.z) return;

      // Calculate LOD level based on distance to camera
      const lodLevel = strategy.useLOD ?
        calculateLODLevel(node, camera) : 'default';

      const mesh = instancedState.meshes[lodLevel];
      if (!mesh) return;

      // Create transformation matrix
      const matrix = new THREE.Matrix4();
      matrix.makeTranslation(node.x, node.y, node.z);

      // Set instance matrix
      mesh.setMatrixAt(instanceIndex, matrix);

      // Set instance color (if node has color property)
      if (node.color) {
        const color = new THREE.Color(node.color);
        mesh.setColorAt(instanceIndex, color);
      }

      instanceIndex++;
    });

    // Update all meshes
    Object.values(instancedState.meshes).forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.count = instanceIndex;
    });

    instancedState.currentInstanceCount = instanceIndex;
  };

  const updateColors = (nodes, colorFunction) => {
    if (!nodes || !colorFunction) return;

    nodes.forEach((node, index) => {
      const color = new THREE.Color(colorFunction(node));

      // Update color in all LOD levels
      Object.values(instancedState.meshes).forEach(mesh => {
        mesh.setColorAt(index, color);
      });
    });

    // Mark colors for update
    Object.values(instancedState.meshes).forEach(mesh => {
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    });
  };

  return {
    updatePositions,
    updateColors
  };
}

/**
 * Calculates LOD level based on distance to camera
 * @param {Object} node - Node object with position
 * @param {Object} camera - Three.js camera
 * @returns {string} LOD level
 */
function calculateLODLevel(node, camera) {
  if (!camera || !node.x) return 'default';

  const distance = camera.position.distanceTo(
    new THREE.Vector3(node.x, node.y, node.z)
  );

  if (distance < 100) return 'high';
  if (distance < 500) return 'medium';
  return 'low';
}

/**
 * Cleanup instanced meshes
 * @param {Object} instancedState - Instanced mesh state
 */
function cleanupInstancedMeshes(instancedState) {
  Object.values(instancedState.meshes).forEach(mesh => {
    mesh.geometry.dispose();
    mesh.material.dispose();

    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
  });
} 