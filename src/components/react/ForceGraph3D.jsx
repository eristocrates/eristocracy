import ForceGraph3D from 'react-force-graph-3d';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ReactForce3D() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ lastTime: 0, frameCount: 0 });
  const graphRef = useRef();
  
  // Instancing references
  const instancedNodesRef = useRef(null);
  const instancedLinksRef = useRef(null);
  const nodeInstancesRef = useRef(new Map()); // Map node IDs to instance indices
  const linkInstancesRef = useRef(new Map()); // Map link IDs to instance indices

  useEffect(() => {
    const loadRdfData = async () => {
      try {
        setLoading(true);
        console.log('Loading RDF data...');
        
        const response = await fetch('/api/graph-data.json');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const graphData = await response.json();
        console.log('Loaded graph data:', graphData.stats);
        
        setData({
          nodes: graphData.nodes || [],
          links: graphData.links || []
        });
        setStats(graphData.stats);
        setError(null);
      } catch (err) {
        console.error('Failed to load RDF data:', err);
        setError(err.message);
        // Fallback to empty data
        setData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    };

    loadRdfData();
  }, []);

  // Setup instanced rendering when data changes
  useEffect(() => {
    if (!graphRef.current || !data.nodes.length) return;

    console.log('Setting up instanced rendering for', data.nodes.length, 'nodes and', data.links.length, 'links');
    
    // Get the Three.js scene
    const scene = graphRef.current.scene();
    if (!scene) return;

    // Remove existing instanced meshes
    if (instancedNodesRef.current) {
      scene.remove(instancedNodesRef.current);
    }
    if (instancedLinksRef.current) {
      scene.remove(instancedLinksRef.current);
    }

    // Create instanced nodes
    const nodeCount = data.nodes.length;
    if (nodeCount > 0) {
      const nodeGeometry = new THREE.SphereGeometry(2, 8, 6); // More visible sphere
      const nodeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4285f4,
        transparent: false,
        opacity: 1.0
      });
      
      instancedNodesRef.current = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
      instancedNodesRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      
      // Map node IDs to instance indices
      nodeInstancesRef.current.clear();
      data.nodes.forEach((node, index) => {
        nodeInstancesRef.current.set(node.id, index);
        
        // Initialize with default position so they're visible immediately
        const matrix = new THREE.Matrix4();
        matrix.makeScale(1, 1, 1);
        matrix.setPosition(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100, 
          (Math.random() - 0.5) * 100
        );
        instancedNodesRef.current.setMatrixAt(index, matrix);
      });
      instancedNodesRef.current.instanceMatrix.needsUpdate = true;
      
      scene.add(instancedNodesRef.current);
      console.log('Created instanced nodes:', nodeCount);
    }

    // Create instanced links
    const linkCount = data.links.length;
    if (linkCount > 0) {
      const linkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 6); // More visible cylinder
      const linkMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x666666, 
        transparent: true, 
        opacity: 0.6 
      });
      
      instancedLinksRef.current = new THREE.InstancedMesh(linkGeometry, linkMaterial, linkCount);
      instancedLinksRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      
      // Map link IDs to instance indices
      linkInstancesRef.current.clear();
      data.links.forEach((link, index) => {
        const linkId = `${link.source}-${link.target}`;
        linkInstancesRef.current.set(linkId, index);
        
        // Initialize with default position
        const matrix = new THREE.Matrix4();
        matrix.makeScale(1, 10, 1); // Start with some length
        matrix.setPosition(0, 0, 0);
        instancedLinksRef.current.setMatrixAt(index, matrix);
      });
      instancedLinksRef.current.instanceMatrix.needsUpdate = true;
      
      scene.add(instancedLinksRef.current);
      console.log('Created instanced links:', linkCount);
    }

  }, [data]);

  // FPS counter with adaptive rendering
  useEffect(() => {
    let animationId;
    
    const calculateFPS = (currentTime) => {
      fpsRef.current.frameCount++;
      
      if (currentTime - fpsRef.current.lastTime >= 1000) {
        const currentFps = Math.round((fpsRef.current.frameCount * 1000) / (currentTime - fpsRef.current.lastTime));
        setFps(currentFps);
        
        // Adaptive quality based on FPS - gentle adjustments only
        if (graphRef.current) {
          if (currentFps < 10) {
            // Low performance - reduce quality slightly
            graphRef.current.nodeResolution(6);
            graphRef.current.linkResolution(3);
          } else if (currentFps > 30) {
            // Good performance - maintain quality
            graphRef.current.nodeResolution(8);
            graphRef.current.linkResolution(4);
          }
        }
        
        fpsRef.current.frameCount = 0;
        fpsRef.current.lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(calculateFPS);
    };
    
    animationId = requestAnimationFrame(calculateFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        fontSize: '18px'
      }}>
        Loading RDF data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#ff6b6b',
        fontSize: '18px',
        flexDirection: 'column'
      }}>
        <div>Error loading RDF data:</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Stats overlay */}
      {stats && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000,
          fontFamily: 'monospace'
        }}>
          <div>Nodes: {stats.nodeCount}</div>
          <div>Links: {stats.linkCount}</div>
          <div>Triples: {stats.tripleCount}</div>
          <div style={{ color: fps < 30 ? '#ff6b6b' : fps < 60 ? '#ffd93d' : '#6bcf7f' }}>
            FPS: {fps}
          </div>
        </div>
      )}
      
      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeAutoColorBy="type"
        nodeLabel="label"
        linkLabel="label"
        // Balanced settings with instancing for performance
        linkDirectionalParticles={0}  // Keep particles off for performance
        nodeRelSize={2}  // More visible nodes
        linkWidth={0.5}  // More visible links
        backgroundColor="#000011"
        // Enable basic interactions
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enablePointerInteraction={true}  // Enable hover for labels
        enableNodeDrag={true}  // Allow basic drag
        // Reasonable rendering settings
        rendererConfig={{
          antialias: true,  // Better quality
          powerPreference: "high-performance"
        }}
        // Better geometry for visibility
        nodeResolution={8}  // More detailed spheres
        linkResolution={4}  // Better link geometry  
        // Reasonable force settings
        numDimensions={3}
        dagMode={false}
        d3AlphaDecay={0.0228}  // Default decay
        d3VelocityDecay={0.4}  // Default damping
        warmupTicks={0}  // Default warmup
        cooldownTicks={Infinity}  // Let it run normally
        cooldownTime={15000}  // Reasonable time
        // TEMPORARILY DISABLE INSTANCING to see the data
        // nodeThreeObject={() => {
        //   // Return invisible placeholder - instanced mesh handles actual rendering
        //   const placeholder = new THREE.Object3D();
        //   placeholder.visible = false;
        //   return placeholder;
        // }}
        // linkThreeObject={() => {
        //   // Return invisible placeholder - instanced mesh handles actual rendering  
        //   const placeholder = new THREE.Object3D();
        //   placeholder.visible = false;
        //   return placeholder;
        // }}
        // Custom position updates to sync with instanced meshes
        nodePositionUpdate={(nodeObject, coords, node) => {
          if (!instancedNodesRef.current || !nodeInstancesRef.current.has(node.id)) return;
          
          const instanceIndex = nodeInstancesRef.current.get(node.id);
          const matrix = new THREE.Matrix4();
          
          // Create transformation matrix: position + scale
          const scale = 2; // Make them more visible
          matrix.makeScale(scale, scale, scale);
          matrix.setPosition(coords.x || 0, coords.y || 0, coords.z || 0);
          
          instancedNodesRef.current.setMatrixAt(instanceIndex, matrix);
          instancedNodesRef.current.instanceMatrix.needsUpdate = true;
          
          // Don't prevent default - let both render for now
          return false;
        }}
        linkPositionUpdate={(linkObject, coords, link) => {
          if (!instancedLinksRef.current || !linkInstancesRef.current.has(`${link.source}-${link.target}`)) return;
          
          const instanceIndex = linkInstancesRef.current.get(`${link.source}-${link.target}`);
          const matrix = new THREE.Matrix4();
          
          // Calculate link position, rotation, and length
          const start = coords.start;
          const end = coords.end;
          
          if (!start || !end) return;
          
          const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.y - start.y, 2) + 
            Math.pow(end.z - start.z, 2)
          );
          
          // Position at midpoint
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const midZ = (start.z + end.z) / 2;
          
          // Calculate rotation to align with link direction
          const direction = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
          direction.normalize();
          
          // Create transformation matrix
          matrix.makeScale(1, distance, 1); // Scale Y to match link length
          
          // Rotate to align with direction
          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(up, direction);
          
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.makeRotationFromQuaternion(quaternion);
          
          matrix.multiplyMatrices(rotationMatrix, matrix);
          matrix.setPosition(midX, midY, midZ);
          
          instancedLinksRef.current.setMatrixAt(instanceIndex, matrix);
          instancedLinksRef.current.instanceMatrix.needsUpdate = true;
          
          // Don't prevent default - let both render for now
          return false;
        }}
        // Let simulation run normally to see data patterns
        onEngineStop={() => {
          console.log('Force simulation stopped - graph stabilized');
        }}
      />
    </div>
  );
}
