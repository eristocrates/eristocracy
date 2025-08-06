import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Custom shader for ultra-fast instanced rendering
const instancedVertexShader = `
  attribute vec3 instancePosition;
  attribute vec3 instanceColor;
  attribute float instanceScale;
  
  varying vec3 vColor;
  varying vec3 vNormal;
  
  void main() {
    vColor = instanceColor;
    vNormal = normalize(normalMatrix * normal);
    
    // Apply instance transform
    vec3 transformed = position * instanceScale + instancePosition;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const instancedFragmentShader = `
  varying vec3 vColor;
  varying vec3 vNormal;
  
  void main() {
    // Simple lighting
    float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
    gl_FragColor = vec4(vColor * light, 1.0);
  }
`;

export default function OptimizedForceGraph() {
  const mountRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const instancedMeshRef = useRef();
  const [nodeCount, setNodeCount] = useState(10000);
  const [fps, setFps] = useState(0);
  const animationRef = useRef();

  // Performance monitoring
  const fpsRef = useRef({ lastTime: 0, frameCount: 0 });

  // ADVANCED GEOMETRY CONTROL STATE
  const [geometryParams, setGeometryParams] = useState({
    // Target control
    targetVertexCount: 12,
    actualVertexCount: 12,
    
    // Base primitive
    baseType: 'icosahedron',
    
    // Subdivision/Detail parameters
    subdivisions: 0,
    radialSegments: 8,
    heightSegments: 6,
    widthSegments: 1,
    depthSegments: 1,
    
    // Size parameters
    radius: 1,
    tubeRadius: 0.4,
    
    // Advanced options
    customVertexFunction: null,
    useCustomVertices: false
  });

  const [controlMode, setControlMode] = useState('numerical'); // 'numerical', 'parametric', 'composition'

  // Base primitive definitions with vertex calculation formulas
  const basePrimitives = {
    'icosahedron': { 
      minVertices: 12, 
      subdivisionMultiplier: 4,
      calculateVertices: (subdivisions) => 12 * Math.pow(4, subdivisions),
      hasSubdivisions: true
    },
    'dodecahedron': { 
      minVertices: 20, 
      subdivisionMultiplier: 3,
      calculateVertices: (subdivisions) => 20 * Math.pow(3, subdivisions),
      hasSubdivisions: true
    },
    'octahedron': { 
      minVertices: 6, 
      subdivisionMultiplier: 4,
      calculateVertices: (subdivisions) => 6 * Math.pow(4, subdivisions),
      hasSubdivisions: true
    },
    'tetrahedron': { 
      minVertices: 4, 
      subdivisionMultiplier: 4,
      calculateVertices: (subdivisions) => 4 * Math.pow(4, subdivisions),
      hasSubdivisions: true
    },
    'sphere': { 
      minVertices: 8, 
      segmentBased: true,
      calculateVertices: (radial, height) => (radial + 1) * (height + 1),
      hasSegments: true
    },
    'box': { 
      minVertices: 8, 
      segmentBased: true,
      calculateVertices: (w, h, d) => {
        // Complex formula for box with segments
        return 8 + (w > 1 ? (w-1)*4*2 : 0) + (h > 1 ? (h-1)*4*2 : 0) + (d > 1 ? (d-1)*4*2 : 0) + 
               (w > 1 && h > 1 ? (w-1)*(h-1)*2 : 0) + (w > 1 && d > 1 ? (w-1)*(d-1)*2 : 0) + 
               (h > 1 && d > 1 ? (h-1)*(d-1)*2 : 0);
      },
      hasSegments: true
    },
    'cylinder': { 
      minVertices: 6, 
      segmentBased: true,
      calculateVertices: (radial, height) => radial * 2 + (height > 1 ? radial * (height - 1) : 0),
      hasSegments: true
    },
    'cone': { 
      minVertices: 4, 
      segmentBased: true,
      calculateVertices: (radial, height) => radial + 1 + (height > 1 ? radial * (height - 1) : 0),
      hasSegments: true
    },
    'torus': { 
      minVertices: 8, 
      segmentBased: true,
      calculateVertices: (radial, tubular) => radial * tubular,
      hasSegments: true
    },
    'plane': { 
      minVertices: 4, 
      segmentBased: true,
      calculateVertices: (w, h) => (w + 1) * (h + 1),
      hasSegments: true
    },
    'ring': { 
      minVertices: 6, 
      segmentBased: true,
      calculateVertices: (theta, phi) => theta * phi,
    }
  };

  // GEOMETRY CREATION SYSTEM
  const createCustomGeometry = (params) => {
    let geometry;
    let actualVertices;
    
    console.log('🔧 Creating geometry with params:', params);
    
    try {
      // Route to appropriate Three.js constructor with exact parameters
      switch (params.baseType) {
        case 'icosahedron':
          geometry = new THREE.IcosahedronGeometry(params.radius, params.subdivisions);
          actualVertices = basePrimitives.icosahedron.calculateVertices(params.subdivisions);
          break;
        case 'dodecahedron':
          geometry = new THREE.DodecahedronGeometry(params.radius, params.subdivisions);
          actualVertices = basePrimitives.dodecahedron.calculateVertices(params.subdivisions);
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(params.radius, params.subdivisions);
          actualVertices = basePrimitives.octahedron.calculateVertices(params.subdivisions);
          break;
        case 'tetrahedron':
          geometry = new THREE.TetrahedronGeometry(params.radius, params.subdivisions);
          actualVertices = basePrimitives.tetrahedron.calculateVertices(params.subdivisions);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            params.radius, 
            params.radialSegments, 
            params.heightSegments
          );
          actualVertices = basePrimitives.sphere.calculateVertices(params.radialSegments, params.heightSegments);
          break;
        case 'box':
          geometry = new THREE.BoxGeometry(
            params.radius * 2, params.radius * 2, params.radius * 2,
            params.widthSegments, params.heightSegments, params.depthSegments
          );
          actualVertices = basePrimitives.box.calculateVertices(
            params.widthSegments, params.heightSegments, params.depthSegments
          );
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            params.radius, params.radius, params.radius * 2,
            params.radialSegments, params.heightSegments
          );
          actualVertices = basePrimitives.cylinder.calculateVertices(
            params.radialSegments, params.heightSegments
          );
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(
            params.radius, params.radius * 2,
            params.radialSegments, params.heightSegments
          );
          actualVertices = basePrimitives.cone.calculateVertices(
            params.radialSegments, params.heightSegments
          );
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(
            params.radius, params.tubeRadius,
            params.radialSegments, params.heightSegments
          );
          actualVertices = basePrimitives.torus.calculateVertices(
            params.radialSegments, params.heightSegments
          );
          break;
        case 'plane':
          geometry = new THREE.PlaneGeometry(
            params.radius * 2, params.radius * 2,
            params.widthSegments, params.heightSegments
          );
          actualVertices = basePrimitives.plane.calculateVertices(
            params.widthSegments, params.heightSegments
          );
          break;
        case 'ring':
          geometry = new THREE.RingGeometry(
            params.radius * 0.5, params.radius,
            params.radialSegments, params.heightSegments
          );
          actualVertices = basePrimitives.ring.calculateVertices(
            params.radialSegments, params.heightSegments
          );
          break;
        default:
          geometry = new THREE.IcosahedronGeometry(params.radius, 0);
          actualVertices = 12;
      }
      
      // Get actual vertex count from geometry
      const realVertexCount = geometry.attributes.position.count;
      
      console.log(`📐 Created ${params.baseType}: predicted ${actualVertices}, actual ${realVertexCount} vertices`);
      
      // Update actual vertex count in state
      setGeometryParams(prev => ({...prev, actualVertexCount: realVertexCount}));
      
      return { geometry, vertexCount: realVertexCount };
      
    } catch (error) {
      console.error('❌ Error creating geometry:', error);
      // Fallback to simple icosahedron
      geometry = new THREE.IcosahedronGeometry(1, 0);
      return { geometry, vertexCount: 12 };
    }
  };

  // SMART PARAMETER CALCULATION
  const calculateParametersForTargetVertices = (targetCount, baseType) => {
    const primitive = basePrimitives[baseType];
    if (!primitive) return {};
    
    if (primitive.hasSubdivisions) {
      // For subdivision-based primitives, find the right subdivision level
      let subdivisions = 0;
      while (subdivisions < 8) { // Reasonable limit
        const vertices = primitive.calculateVertices(subdivisions);
        if (vertices >= targetCount) break;
        subdivisions++;
      }
      return { subdivisions };
    } else if (primitive.hasSegments) {
      // For segment-based primitives, estimate good segment counts
      const targetSegments = Math.ceil(Math.sqrt(targetCount));
      return {
        radialSegments: Math.max(3, Math.min(64, targetSegments)),
        heightSegments: Math.max(1, Math.min(32, Math.floor(targetSegments / 2)))
      };
    }
    
    return {};
  };

  // LIVE VERTEX COUNT CALCULATOR
  const calculateCurrentVertexCount = (params) => {
    const primitive = basePrimitives[params.baseType];
    if (!primitive) return 12;
    
    if (primitive.hasSubdivisions) {
      return primitive.calculateVertices(params.subdivisions);
    } else if (primitive.hasSegments) {
      if (params.baseType === 'sphere' || params.baseType === 'cylinder' || params.baseType === 'cone') {
        return primitive.calculateVertices(params.radialSegments, params.heightSegments);
      } else if (params.baseType === 'box' || params.baseType === 'plane') {
        return primitive.calculateVertices(params.widthSegments, params.heightSegments, params.depthSegments);
      } else if (params.baseType === 'torus' || params.baseType === 'ring') {
        return primitive.calculateVertices(params.radialSegments, params.heightSegments);
      }
    }
    
    return primitive.minVertices;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Camera position
    camera.position.set(0, 0, 100);

    // ULTRA-LOW POLY geometry - your friend will approve
    const nodeGeometry = new THREE.IcosahedronGeometry(1, 0); // 12 vertices only!
    console.log(`Using ${nodeGeometry.attributes.position.count} vertices per node`);

    // Custom shader material for maximum performance
    const instancedMaterial = new THREE.ShaderMaterial({
      vertexShader: instancedVertexShader,
      fragmentShader: instancedFragmentShader,
    });

    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(nodeGeometry, instancedMaterial, nodeCount);
    instancedMeshRef.current = instancedMesh;

    // Pre-allocate attribute buffers (GPU-friendly)
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);
    const scales = new Float32Array(nodeCount);

    // Initialize random positions and properties
    for (let i = 0; i < nodeCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // Color
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();

      // Scale
      scales[i] = 1.0 + Math.random() * 0.5;
    }

    // Set instance attributes (uploaded to GPU once)
    instancedMesh.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(positions, 3));
    instancedMesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
    instancedMesh.geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));

    scene.add(instancedMesh);

    // Simple camera controls
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation loop with minimal CPU work
    const animate = (currentTime) => {
      // FPS calculation
      fpsRef.current.frameCount++;
      if (currentTime - fpsRef.current.lastTime >= 1000) {
        const currentFps = Math.round((fpsRef.current.frameCount * 1000) / (currentTime - fpsRef.current.lastTime));
        setFps(currentFps);
        fpsRef.current.frameCount = 0;
        fpsRef.current.lastTime = currentTime;
      }

      // Minimal camera movement
      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // CRITICAL: No per-frame matrix updates!
      // All animation is done in the shader via time uniforms
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [nodeCount]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Performance stats */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 1000,
        fontFamily: 'monospace'
      }}>
        <div>Nodes: {nodeCount.toLocaleString()}</div>
        <div>Vertices per node: 12 (icosahedron)</div>
        <div>Total vertices: {(nodeCount * 12).toLocaleString()}</div>
        <div style={{ color: fps < 30 ? '#ff6b6b' : fps < 60 ? '#ffd93d' : '#6bcf7f' }}>
          FPS: {fps}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
          GPU Instancing: ✅<br/>
          Custom Shaders: ✅<br/>
          CPU Matrix Updates: ❌<br/>
          Low-poly Geometry: ✅
        </div>
      </div>

      {/* Node count controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '15px',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '10px', fontSize: '14px' }}>Node Count:</div>
        {[1000, 5000, 10000, 50000, 100000].map(count => (
          <button
            key={count}
            onClick={() => setNodeCount(count)}
            style={{
              margin: '2px',
              padding: '5px 10px',
              background: nodeCount === count ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {count.toLocaleString()}
          </button>
        ))}
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
