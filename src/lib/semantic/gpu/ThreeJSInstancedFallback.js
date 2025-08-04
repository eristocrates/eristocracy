/**
 * @file ThreeJSInstancedFallback.js
 * @description Three.js InstancedMesh fallback when WebGPU isn't available
 * Still provides massive draw call reduction (335 → 2-3 calls)
 */

export class ThreeJSInstancedFallback {
  constructor() {
    this.isActive = false;
    this.nodeInstancedMesh = null;
    this.linkInstancedMesh = null;
    this.nodeCount = 0;
    this.linkCount = 0;
    this.originalNodes = [];
    this.originalLinks = [];
  }

  /**
   * Override ForceGraph3D with Three.js InstancedMesh rendering
   */
  overrideForceGraphRendering(forceGraphInstance) {
    console.log('🎨 Applying Three.js InstancedMesh fallback...');

    this.graph = forceGraphInstance;
    const scene = this.graph.scene();

    // Hook into data updates
    const originalGraphData = this.graph.graphData.bind(this.graph);
    this.graph.graphData = (data) => {
      const result = originalGraphData(data);

      if (data && data.nodes && data.nodes.length > 0) {
        this.createInstancedMeshes(scene, data);
        this.hideOriginalMeshes(scene);
        console.log(`🎨 Three.js instancing: ${data.nodes.length} nodes → 1 draw call`);
        this.showStatus(`🚀 THREE.JS INSTANCING: ${data.nodes.length} nodes in 1 call`, 'success');
      }

      return result;
    };

    this.isActive = true;
    console.log('🎨 Three.js InstancedMesh fallback active');
    return true;
  }

  /**
   * Create InstancedMesh for all nodes
   */
  createInstancedMeshes(scene, data) {
    const { nodes, links } = data;
    this.nodeCount = nodes.length;
    this.linkCount = links.length;

    // Remove existing instanced meshes
    if (this.nodeInstancedMesh) {
      scene.remove(this.nodeInstancedMesh);
    }

    // Create instanced mesh for nodes
    const geometry = new THREE.SphereGeometry(2, 16, 12);
    const material = new THREE.MeshBasicMaterial({ color: 0x0078d4 });

    this.nodeInstancedMesh = new THREE.InstancedMesh(geometry, material, nodes.length);

    // Set up instance data
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Position and scale
      dummy.position.set(node.x || 0, node.y || 0, node.z || 0);

      // Scale based on edge count
      const scale = Math.max(0.5, Math.min(3, (node.edgeCount || 1) * 0.3));
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      this.nodeInstancedMesh.setMatrixAt(i, dummy.matrix);

      // Color based on semantic type
      if (node.isLiteral) {
        color.setHex(0xff6666); // Red for literals
      } else if (node.type?.includes('class')) {
        color.setHex(0x66aaff); // Blue for classes
      } else {
        color.setHex(0x66ff66); // Green for instances
      }

      this.nodeInstancedMesh.setColorAt(i, color);
    }

    this.nodeInstancedMesh.instanceMatrix.needsUpdate = true;
    this.nodeInstancedMesh.instanceColor.needsUpdate = true;

    // Add to scene
    scene.add(this.nodeInstancedMesh);

    console.log(`🎨 Created InstancedMesh with ${nodes.length} instances`);

    // Create simple lines for links (could be instanced too, but links are usually fewer)
    this.createSimpleLinks(scene, links, nodes);
  }

  /**
   * Create simple line geometry for links
   */
  createSimpleLinks(scene, links, nodes) {
    // Remove existing link geometry
    if (this.linkInstancedMesh) {
      scene.remove(this.linkInstancedMesh);
    }

    // Create a single geometry for all links
    const positions = [];
    const colors = [];
    const linkColor = new THREE.Color(0x333333);

    for (const link of links) {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        // Line from source to target
        positions.push(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
        positions.push(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);

        // Colors for line endpoints
        colors.push(linkColor.r, linkColor.g, linkColor.b);
        colors.push(linkColor.r, linkColor.g, linkColor.b);
      }
    }

    const linkGeometry = new THREE.BufferGeometry();
    linkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    linkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const linkMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      opacity: 0.6,
      transparent: true
    });

    this.linkInstancedMesh = new THREE.LineSegments(linkGeometry, linkMaterial);
    scene.add(this.linkInstancedMesh);

    console.log(`🔗 Created batched links: ${links.length} links → 1 draw call`);
  }

  /**
   * Hide original ForceGraph3D meshes
   */
  hideOriginalMeshes(scene) {
    scene.traverse((child) => {
      // Hide individual node/link objects created by ForceGraph3D
      if (child.userData?.nodeObject || child.userData?.linkObject) {
        child.visible = false;
      }

      // Also hide any Mesh objects that look like nodes/links
      if (child instanceof THREE.Mesh && child !== this.nodeInstancedMesh) {
        if (child.geometry instanceof THREE.SphereGeometry ||
          child.geometry instanceof THREE.BoxGeometry) {
          child.visible = false;
        }
      }

      // Hide line objects
      if (child instanceof THREE.Line || child instanceof THREE.LineSegments) {
        if (child !== this.linkInstancedMesh) {
          child.visible = false;
        }
      }
    });
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('webgpu-status') || this.createStatusElement();

    statusElement.textContent = message;
    statusElement.className = `webgpu-status ${type}`;

    // Update styles based on type
    if (type === 'success') {
      statusElement.style.borderColor = '#00ff00';
      statusElement.style.background = 'rgba(0, 100, 0, 0.8)';
    } else if (type === 'warning') {
      statusElement.style.borderColor = '#ffaa00';
      statusElement.style.background = 'rgba(100, 80, 0, 0.8)';
    }
  }

  /**
   * Create status element if needed
   */
  createStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'webgpu-status';
    statusElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      transition: all 0.3s ease;
      border: 2px solid #00ff00;
      background: rgba(0, 100, 0, 0.8);
      color: white;
    `;

    document.body.appendChild(statusElement);
    return statusElement;
  }

  /**
   * Get stats
   */
  getStats() {
    const originalDrawCalls = (this.nodeCount * 2) + (this.linkCount * 2);
    const currentDrawCalls = this.isActive ? 2 : originalDrawCalls; // 1 for nodes, 1 for links

    return {
      nodeCount: this.nodeCount,
      linkCount: this.linkCount,
      originalDrawCalls,
      currentDrawCalls,
      drawCallsReduced: originalDrawCalls - currentDrawCalls,
      isActive: this.isActive,
      improvement: `${Math.round(originalDrawCalls / currentDrawCalls)}x fewer draw calls`
    };
  }

  /**
   * Update positions (called during animation)
   */
  updatePositions(nodes) {
    if (!this.nodeInstancedMesh || !this.isActive) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < Math.min(nodes.length, this.nodeCount); i++) {
      const node = nodes[i];
      dummy.position.set(node.x || 0, node.y || 0, node.z || 0);
      dummy.updateMatrix();
      this.nodeInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.nodeInstancedMesh.instanceMatrix.needsUpdate = true;
  }
} 