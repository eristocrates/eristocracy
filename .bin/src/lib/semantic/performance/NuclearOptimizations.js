/**
 * @file NuclearOptimizations.js 
 * @description Phase 1 & 2 nuclear performance optimizations for ForceGraph3D
 * WARNING: These modifications bypass ForceGraph3D's normal rendering pipeline
 */

import * as THREE from 'three';

// Shared materials for material consolidation
let sharedNodeMaterial = null;
let sharedLinkMaterial = null;
let instancedNodeMesh = null;
let instancedLinkMesh = null;

/**
 * PHASE 1: Material Consolidation
 * Forces all objects to share materials, eliminates expensive features
 */
export class Phase1MaterialConsolidation {
  constructor(graphInstance) {
    this.graph = graphInstance;
    this.originalState = {
      enablePointerInteraction: null,
      nodeLabel: null,
      linkDirectionalParticles: null,
      linkDirectionalArrowLength: null,
      linkMaterial: null
    };
  }

  /**
   * Apply Phase 1 optimizations
   */
  apply(options = {}) {
    console.log('🚨 APPLYING PHASE 1: Material Consolidation');

    // Store original state for restoration
    this.storeOriginalState();

    // Create shared materials
    this.createSharedMaterials(options);

    // Apply material sharing
    if (options.forceMaterialSharing) {
      this.applyMaterialSharing();
    }

    // Eliminate expensive features
    if (options.disableLabels) {
      this.disableLabels();
    }

    if (options.disablePointerTracking) {
      this.disablePointerTracking();
    }

    if (options.disableParticles) {
      this.disableParticles();
    }

    // Force refresh
    this.graph.refresh();

    console.log('✅ Phase 1 optimizations applied');
  }

  createSharedMaterials(options) {
    const materialType = options.forceSimpleMaterials ? 'basic' : 'lambert';

    if (materialType === 'basic') {
      sharedNodeMaterial = new THREE.MeshBasicMaterial({
        color: 0x4444ff,
        transparent: true,
        opacity: 0.8
      });

      sharedLinkMaterial = new THREE.MeshBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.6
      });
    } else {
      sharedNodeMaterial = new THREE.MeshLambertMaterial({
        color: 0x4444ff,
        transparent: true,
        opacity: 0.8
      });

      sharedLinkMaterial = new THREE.MeshLambertMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.6
      });
    }

    console.log(`🎨 Created shared ${materialType} materials`);
  }

  applyMaterialSharing() {
    // Force all links to use shared material
    this.graph.linkMaterial(() => sharedLinkMaterial);
    console.log('🔗 Applied shared link materials');
  }

  disableLabels() {
    this.graph.nodeLabel(() => null);
    this.graph.linkLabel(() => null);
    console.log('🚫 Disabled all labels');
  }

  disablePointerTracking() {
    this.graph.enablePointerInteraction(false);
    console.log('🚫 Disabled pointer interaction');
  }

  disableParticles() {
    this.graph.linkDirectionalParticles(0);
    this.graph.linkDirectionalArrowLength(0);
    console.log('🚫 Disabled particles and arrows');
  }

  storeOriginalState() {
    // Store original values (if we need to restore later)
    this.originalState.enablePointerInteraction = this.graph.enablePointerInteraction();
  }

  /**
   * Restore original state
   */
  restore() {
    console.log('🔄 Restoring Phase 1 original state...');

    // Reset materials to default
    this.graph.linkMaterial(null);

    // Re-enable features
    this.graph.enablePointerInteraction(true);
    this.graph.nodeLabel('name');
    this.graph.linkLabel('name');
    this.graph.linkDirectionalParticles(0);
    this.graph.linkDirectionalArrowLength(0);

    this.graph.refresh();
    console.log('✅ Phase 1 state restored');
  }
}

/**
 * PHASE 2: Geometry Replacement with InstancedMesh
 * Replaces ForceGraph3D's individual objects with InstancedMesh
 */
export class Phase2InstancedRendering {
  constructor(graphInstance) {
    this.graph = graphInstance;
    this.scene = graphInstance.scene();
    this.nodeCount = 0;
    this.linkCount = 0;
    this.nodeInstances = new Map(); // Track node index mapping
    this.linkInstances = new Map(); // Track link index mapping
  }

  /**
   * Apply Phase 2 optimizations
   */
  apply(options = {}) {
    console.log('💀 APPLYING PHASE 2: Instanced Rendering');

    const graphData = this.graph.graphData();
    this.nodeCount = graphData.nodes ? graphData.nodes.length : 0;
    this.linkCount = graphData.links ? graphData.links.length : 0;

    console.log(`📊 Processing ${this.nodeCount} nodes, ${this.linkCount} links`);

    if (options.enableInstancedNodes && this.nodeCount > 0) {
      this.createInstancedNodes(options);
      this.hijackNodeRendering();
    }

    if (options.enableInstancedLinks && this.linkCount > 0) {
      this.createInstancedLinks(options);
      this.hijackLinkRendering();
    }

    console.log('✅ Phase 2 instanced rendering applied');
  }

  createInstancedNodes(options) {
    const geometry = this.createNodeGeometry(options.instancedNodeGeometry || 'sphere');
    const material = sharedNodeMaterial || new THREE.MeshBasicMaterial({ color: 0x4444ff });

    instancedNodeMesh = new THREE.InstancedMesh(geometry, material, this.nodeCount);

    // Add to scene
    this.scene.add(instancedNodeMesh);

    // Set initial transforms for all instances
    const graphData = this.graph.graphData();
    graphData.nodes.forEach((node, index) => {
      this.nodeInstances.set(node.id, index);

      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(
        node.x || Math.random() * 100 - 50,
        node.y || Math.random() * 100 - 50,
        node.z || Math.random() * 100 - 50
      );
      const scale = new THREE.Vector3(1, 1, 1);

      matrix.compose(position, new THREE.Quaternion(), scale);
      instancedNodeMesh.setMatrixAt(index, matrix);
    });

    instancedNodeMesh.instanceMatrix.needsUpdate = true;
    console.log(`🔷 Created instanced nodes mesh with ${this.nodeCount} instances`);
  }

  createInstancedLinks(options) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    const material = sharedLinkMaterial || new THREE.MeshBasicMaterial({ color: 0x999999 });

    instancedLinkMesh = new THREE.InstancedMesh(geometry, material, this.linkCount);

    // Add to scene  
    this.scene.add(instancedLinkMesh);

    // Set initial transforms for all link instances
    const graphData = this.graph.graphData();
    graphData.links.forEach((link, index) => {
      this.linkInstances.set(`${link.source.id}-${link.target.id}`, index);

      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3(0, 0, 0);
      const scale = new THREE.Vector3(0.1, 1, 0.1);

      matrix.compose(position, new THREE.Quaternion(), scale);
      instancedLinkMesh.setMatrixAt(index, matrix);
    });

    instancedLinkMesh.instanceMatrix.needsUpdate = true;
    console.log(`🔗 Created instanced links mesh with ${this.linkCount} instances`);
  }

  hijackNodeRendering() {
    // Replace ForceGraph3D's node rendering with our InstancedMesh
    this.graph.nodeThreeObject(() => {
      // Return null so ForceGraph3D doesn't render default nodes
      return null;
    });

    // Hijack position updates to control our InstancedMesh
    this.graph.nodePositionUpdate((threeObj, coords, node) => {
      const instanceIndex = this.nodeInstances.get(node.id);
      if (instanceIndex !== undefined && instancedNodeMesh) {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(coords.x, coords.y, coords.z);
        const scale = new THREE.Vector3(1, 1, 1);

        matrix.compose(position, new THREE.Quaternion(), scale);
        instancedNodeMesh.setMatrixAt(instanceIndex, matrix);
        instancedNodeMesh.instanceMatrix.needsUpdate = true;
      }

      return true; // Skip ForceGraph3D's default positioning
    });

    console.log('🎯 Hijacked node rendering with InstancedMesh');
  }

  hijackLinkRendering() {
    // Replace ForceGraph3D's link rendering
    this.graph.linkThreeObject(() => {
      // Return null so ForceGraph3D doesn't render default links
      return null;
    });

    // Hijack link position updates
    this.graph.linkPositionUpdate((threeObj, coords, link) => {
      const linkKey = `${link.source.id}-${link.target.id}`;
      const instanceIndex = this.linkInstances.get(linkKey);

      if (instanceIndex !== undefined && instancedLinkMesh) {
        const start = coords.start;
        const end = coords.end;

        // Calculate position and orientation
        const position = new THREE.Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5);

        const direction = new THREE.Vector3()
          .subVectors(end, start);
        const length = direction.length();

        direction.normalize();
        const quaternion = new THREE.Quaternion()
          .setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        const scale = new THREE.Vector3(0.1, length, 0.1);

        const matrix = new THREE.Matrix4();
        matrix.compose(position, quaternion, scale);
        instancedLinkMesh.setMatrixAt(instanceIndex, matrix);
        instancedLinkMesh.instanceMatrix.needsUpdate = true;
      }

      return true; // Skip ForceGraph3D's default positioning
    });

    console.log('🎯 Hijacked link rendering with InstancedMesh');
  }

  createNodeGeometry(type) {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'octahedron':
        return new THREE.OctahedronGeometry(0.5);
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(0.5);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(0.5, 8, 6);
    }
  }

  /**
   * Clean up instanced meshes
   */
  cleanup() {
    console.log('🧹 Cleaning up Phase 2 instanced rendering...');

    if (instancedNodeMesh) {
      this.scene.remove(instancedNodeMesh);
      instancedNodeMesh.geometry.dispose();
      instancedNodeMesh.material.dispose();
      instancedNodeMesh = null;
    }

    if (instancedLinkMesh) {
      this.scene.remove(instancedLinkMesh);
      instancedLinkMesh.geometry.dispose();
      instancedLinkMesh.material.dispose();
      instancedLinkMesh = null;
    }

    // Restore normal rendering
    this.graph.nodeThreeObject(null);
    this.graph.linkThreeObject(null);
    this.graph.nodePositionUpdate(null);
    this.graph.linkPositionUpdate(null);

    this.nodeInstances.clear();
    this.linkInstances.clear();

    console.log('✅ Phase 2 cleanup complete');
  }
}

/**
 * Nuclear Optimization Manager
 * Coordinates Phase 1 and Phase 2 optimizations
 */
export class NuclearOptimizationManager {
  constructor(graphInstance) {
    this.graph = graphInstance;
    this.phase1 = new Phase1MaterialConsolidation(graphInstance);
    this.phase2 = new Phase2InstancedRendering(graphInstance);
    this.activeOptimizations = new Set();
  }

  /**
   * Apply nuclear optimizations based on parameter settings
   */
  applyOptimizations(parameters) {
    console.log('💀 NUCLEAR OPTIMIZATION DEPLOYMENT INITIATED');

    // Phase 1: Material Consolidation
    const phase1Options = {
      forceMaterialSharing: parameters.forceMaterialSharing,
      disableLabels: parameters.disableLabels,
      disablePointerTracking: parameters.disablePointerTracking,
      disableParticles: parameters.disableParticles,
      forceSimpleMaterials: parameters.forceSimpleMaterials
    };

    if (Object.values(phase1Options).some(Boolean)) {
      this.phase1.apply(phase1Options);
      this.activeOptimizations.add('phase1');
    }

    // Phase 2: Instanced Rendering  
    const phase2Options = {
      enableInstancedNodes: parameters.enableInstancedNodes,
      enableInstancedLinks: parameters.enableInstancedLinks,
      instancedNodeGeometry: parameters.instancedNodeGeometry
    };

    if (phase2Options.enableInstancedNodes || phase2Options.enableInstancedLinks) {
      this.phase2.apply(phase2Options);
      this.activeOptimizations.add('phase2');
    }

    // Final refresh and stats
    this.graph.refresh();
    this.logOptimizationResults();
  }

  /**
   * Restore normal rendering
   */
  restore() {
    console.log('🔄 Restoring normal rendering...');

    if (this.activeOptimizations.has('phase2')) {
      this.phase2.cleanup();
    }

    if (this.activeOptimizations.has('phase1')) {
      this.phase1.restore();
    }

    this.activeOptimizations.clear();
    this.graph.refresh();

    console.log('✅ Normal rendering restored');
  }

  logOptimizationResults() {
    const renderer = this.graph.renderer();
    if (renderer && renderer.info) {
      const info = renderer.info.render;
      console.log('📊 POST-NUCLEAR OPTIMIZATION STATS:');
      console.log(`   Draw Calls: ${info.calls}`);
      console.log(`   Triangles: ${info.triangles}`);
      console.log(`   Geometries: ${renderer.info.memory.geometries}`);
      console.log(`   Active Optimizations: [${Array.from(this.activeOptimizations).join(', ')}]`);
    }
  }
}

export default NuclearOptimizationManager; 