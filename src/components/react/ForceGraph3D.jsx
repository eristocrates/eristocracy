import ForceGraph3D from 'react-force-graph-3d';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// ENHANCED SLIDER COMPONENT with click-to-edit numerical input
const EnhancedSlider = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  unit = '', 
  color = '#fff',
  decimals = 0 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '0');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleValueClick = () => {
    setEditValue(value?.toString() || '0');
    setIsEditing(true);
  };

  const handleInputSubmit = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(max, (parseFloat(editValue) || 0) + step);
      setEditValue(newValue.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(min, (parseFloat(editValue) || 0) - step);
      setEditValue(newValue.toString());
    }
  };

  const displayValue = decimals > 0 ? value?.toFixed(decimals) : Math.round(value || 0);

  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '4px', 
        fontSize: '10px', 
        fontWeight: 'bold', 
        color 
      }}>
        {label}: {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleInputSubmit}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step}
            style={{
              width: '60px',
              padding: '2px 4px',
              fontSize: '10px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '3px',
              marginLeft: '4px'
            }}
          />
        ) : (
          <span 
            onClick={handleValueClick}
            style={{ 
              cursor: 'pointer', 
              textDecoration: 'underline',
              marginLeft: '4px',
              padding: '2px 4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px'
            }}
          >
            {displayValue}{unit}
          </span>
        )}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || min}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
};

// COLOR PICKER COMPONENT
const ColorPicker = ({ label, value, onChange, color = '#fff' }) => {
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '4px', 
        fontSize: '10px', 
        fontWeight: 'bold', 
        color 
      }}>
        {label}:
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '30px',
            height: '20px',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '2px 4px',
            fontSize: '10px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '3px'
          }}
        />
      </div>
    </div>
  );
};

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

export default function ReactForce3D() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [fps, setFps] = useState(0);
  const [renderStats, setRenderStats] = useState({
    verticesPerNode: 0,
    totalVertices: 0,
    gpuInstancing: false,
    customShaders: false,
    cpuMatrixUpdates: true
  });
  
  // COMPREHENSIVE GEOMETRY & MATERIAL CONTROL SYSTEM
  const [geometryParams, setGeometryParams] = useState({
    // Actual vertex tracking
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
    
    // Advanced shape parameters
    phiSegments: 8,
    thetaSegments: 6,
    phiStart: 0,
    phiLength: Math.PI * 2,
    thetaStart: 0,
    thetaLength: Math.PI,
    
    // Geometric modifiers
    innerRadius: 0.5,
    outerRadius: 1,
    p: 2, // For superellipsoid
    q: 2, // For superellipsoid
    
    // MATERIAL PARAMETERS
    materialType: 'basic', // basic, lambert, phong, standard, toon, points, line, shader
    
    // Color properties
    color: '#ff6b6b',
    emissive: '#000000',
    specular: '#111111',
    
    // Surface properties
    opacity: 1.0,
    transparent: false,
    metalness: 0.0,
    roughness: 0.5,
    shininess: 30,
    reflectivity: 1.0,
    refractionRatio: 0.98,
    
    // Rendering properties
    wireframe: false,
    wireframeLinewidth: 1,
    flatShading: false,
    vertexColors: false,
    fog: true,
    
    // Point/Line specific
    pointSize: 1.0,
    linewidth: 1.0,
    
    // Advanced material features
    alphaTest: 0.0,
    depthTest: true,
    depthWrite: true,
    side: 'front', // front, back, double
    blending: 'normal', // normal, additive, subtractive, multiply
    
    // Performance controls
    useCustomShaders: true,
    useGPUBuffers: true,
    batchUpdates: true,
    updateFrequency: 1,
    cullDistance: 1000,
    lodEnabled: true
  });

  // FOUNDATIONAL PARAMETRIC GEOMETRY PRIMITIVES
  const basePrimitives = {
    // PLATONIC SOLIDS
    'tetrahedron': { 
      minVertices: 4, 
      calculateVertices: (subdivisions) => 4 * Math.pow(4, subdivisions),
      hasSubdivisions: true,
      category: 'Platonic Solids'
    },
    'cube': { 
      minVertices: 8,
      calculateVertices: (w, h, d) => (w + 1) * (h + 1) * (d + 1) * 8,
      hasSegments: true,
      category: 'Platonic Solids'
    },
    'octahedron': { 
      minVertices: 6, 
      calculateVertices: (subdivisions) => 6 * Math.pow(4, subdivisions),
      hasSubdivisions: true,
      category: 'Platonic Solids'
    },
    'dodecahedron': { 
      minVertices: 20, 
      calculateVertices: (subdivisions) => 20 * Math.pow(3, subdivisions),
      hasSubdivisions: true,
      category: 'Platonic Solids'
    },
    'icosahedron': { 
      minVertices: 12, 
      calculateVertices: (subdivisions) => 12 * Math.pow(4, subdivisions),
      hasSubdivisions: true,
      category: 'Platonic Solids'
    },

    // ARCHIMEDEAN SOLIDS & VARIATIONS
    'truncatedIcosahedron': {
      minVertices: 60,
      calculateVertices: (subdivisions) => 60 * Math.pow(4, subdivisions),
      hasSubdivisions: true,
      category: 'Archimedean Solids'
    },
    'truncatedDodecahedron': {
      minVertices: 60,
      calculateVertices: (subdivisions) => 60 * Math.pow(3, subdivisions),
      hasSubdivisions: true,
      category: 'Archimedean Solids'
    },

    // SPHERICAL PRIMITIVES
    'sphere': { 
      minVertices: 8, 
      calculateVertices: (radial, height) => (radial + 1) * (height + 1),
      hasSegments: true,
      category: 'Spherical'
    },
    'sphereUV': {
      minVertices: 8,
      calculateVertices: (phi, theta) => phi * theta,
      hasAngularSegments: true,
      category: 'Spherical'
    },
    'geosphere': {
      minVertices: 12,
      calculateVertices: (subdivisions) => 12 * Math.pow(4, subdivisions),
      hasSubdivisions: true,
      category: 'Spherical'
    },

    // CYLINDRICAL PRIMITIVES
    'cylinder': { 
      minVertices: 6, 
      calculateVertices: (radial, height) => radial * 2 + (height > 1 ? radial * (height - 1) : 0),
      hasSegments: true,
      category: 'Cylindrical'
    },
    'cone': { 
      minVertices: 4, 
      calculateVertices: (radial, height) => radial + 1 + (height > 1 ? radial * (height - 1) : 0),
      hasSegments: true,
      category: 'Cylindrical'
    },
    'capsule': {
      minVertices: 8,
      calculateVertices: (radial, height) => radial * (2 + height),
      hasSegments: true,
      category: 'Cylindrical'
    },

    // TOROIDAL PRIMITIVES
    'torus': { 
      minVertices: 8, 
      calculateVertices: (radial, tubular) => radial * tubular,
      hasSegments: true,
      category: 'Toroidal'
    },
    'torusKnot': {
      minVertices: 8,
      calculateVertices: (tubular, radial) => tubular * radial,
      hasSegments: true,
      category: 'Toroidal'
    },

    // PLANAR PRIMITIVES
    'plane': { 
      minVertices: 4, 
      calculateVertices: (w, h) => (w + 1) * (h + 1),
      hasSegments: true,
      category: 'Planar'
    },
    'circle': {
      minVertices: 3,
      calculateVertices: (segments) => segments + 1,
      hasRadialSegments: true,
      category: 'Planar'
    },
    'ring': { 
      minVertices: 6, 
      calculateVertices: (theta, phi) => theta * phi,
      hasSegments: true,
      category: 'Planar'
    },

    // PARAMETRIC SURFACES
    'parametricSphere': {
      minVertices: 8,
      calculateVertices: (u, v) => u * v,
      hasParametric: true,
      category: 'Parametric'
    },
    'klein': {
      minVertices: 8,
      calculateVertices: (u, v) => u * v,
      hasParametric: true,
      category: 'Parametric'
    },
    'mobius': {
      minVertices: 8,
      calculateVertices: (u, v) => u * v,
      hasParametric: true,
      category: 'Parametric'
    },

    // CONVEX HULL PRIMITIVES
    'convexHull': {
      minVertices: 4,
      calculateVertices: (points) => points,
      hasPointCloud: true,
      category: 'Convex'
    },

    // MINIMAL PRIMITIVES
    'point': {
      minVertices: 1,
      calculateVertices: () => 1,
      category: 'Minimal'
    },
    'line': {
      minVertices: 2,
      calculateVertices: (segments) => segments + 1,
      hasLinearSegments: true,
      category: 'Minimal'
    },
    'triangle': {
      minVertices: 3,
      calculateVertices: () => 3,
      category: 'Minimal'
    }
  };
  
  const fpsRef = useRef({ lastTime: 0, frameCount: 0 });
  const graphRef = useRef();
  
  // Optimized instancing references
  const instancedNodesRef = useRef(null);
  const instancedLinksRef = useRef(null);
  const nodeInstancesRef = useRef(new Map());
  const linkInstancesRef = useRef(new Map());
  const positionBufferRef = useRef(null);
  const colorBufferRef = useRef(null);
  const scaleBufferRef = useRef(null);
  const updateCounterRef = useRef(0);

  // CACHED GEOMETRY AND MATERIAL REFERENCES - Fix #1
  const cachedGeometryRef = useRef(null);
  const cachedMaterialRef = useRef(null);
  const lastGeometryParamsRef = useRef(null);

  // SAFE VERTEX COUNT CALCULATOR - No state updates
  const getCurrentVertexCount = useCallback(() => {
    if (cachedGeometryRef.current) {
      return cachedGeometryRef.current.attributes.position.count;
    }
    // Fallback calculation without creating geometry
    const primitive = basePrimitives[geometryParams.baseType];
    if (!primitive) return 12;
    
    try {
      if (primitive.hasSubdivisions) {
        return primitive.calculateVertices(geometryParams.subdivisions);
      } else if (primitive.hasSegments) {
        return primitive.calculateVertices(geometryParams.radialSegments, geometryParams.heightSegments);
      }
    } catch (e) {
      console.warn('Error calculating vertex count:', e);
    }
    
    return primitive.minVertices;
  }, [geometryParams.baseType, geometryParams.subdivisions, geometryParams.radialSegments, geometryParams.heightSegments]);
  // MEMOIZED GEOMETRY CREATION - Fix #1: Cache geometries
  const createMemoizedGeometry = useCallback((params) => {
    // Create a key from relevant geometry parameters
    const geometryKey = JSON.stringify({
      baseType: params.baseType,
      subdivisions: params.subdivisions,
      radialSegments: params.radialSegments,
      heightSegments: params.heightSegments,
      widthSegments: params.widthSegments,
      depthSegments: params.depthSegments,
      radius: params.radius,
      tubeRadius: params.tubeRadius,
      phiSegments: params.phiSegments,
      thetaSegments: params.thetaSegments,
      phiStart: params.phiStart,
      phiLength: params.phiLength,
      thetaStart: params.thetaStart,
      thetaLength: params.thetaLength,
      innerRadius: params.innerRadius,
      p: params.p,
      q: params.q
    });

    // Check if we can reuse cached geometry
    if (lastGeometryParamsRef.current === geometryKey && cachedGeometryRef.current) {
      console.log('🔄 Reusing cached geometry for', params.baseType);
      return {
        geometry: cachedGeometryRef.current,
        vertexCount: cachedGeometryRef.current.attributes.position.count
      };
    }

    // Create new geometry
    const result = createAdvancedGeometry(params);
    
    // Cache it
    if (cachedGeometryRef.current) {
      cachedGeometryRef.current.dispose(); // Clean up old geometry
    }
    cachedGeometryRef.current = result.geometry;
    lastGeometryParamsRef.current = geometryKey;
    
    // DON'T update state here - this can cause infinite loops
    // The actual vertex count will be available when needed
    
    return result;
  }, []);

  // COMPREHENSIVE MATERIAL CREATION SYSTEM
  const createAdvancedMaterial = (params, node) => {
    let material;
    
    // Base material properties
    const baseProps = {
      color: new THREE.Color(params.color),
      opacity: params.opacity,
      transparent: params.transparent || params.opacity < 1,
      wireframe: params.wireframe,
      flatShading: params.flatShading,
      vertexColors: params.vertexColors,
      fog: params.fog,
      alphaTest: params.alphaTest,
      depthTest: params.depthTest,
      depthWrite: params.depthWrite,
      side: params.side === 'front' ? THREE.FrontSide : 
            params.side === 'back' ? THREE.BackSide : THREE.DoubleSide,
    };

    // Set blending mode
    let blendingMode = THREE.NormalBlending;
    switch (params.blending) {
      case 'additive': blendingMode = THREE.AdditiveBlending; break;
      case 'subtractive': blendingMode = THREE.SubtractiveBlending; break;
      case 'multiply': blendingMode = THREE.MultiplyBlending; break;
      default: blendingMode = THREE.NormalBlending;
    }
    baseProps.blending = blendingMode;

    try {
      switch (params.materialType) {
        case 'basic':
          material = new THREE.MeshBasicMaterial(baseProps);
          break;
          
        case 'lambert':
          material = new THREE.MeshLambertMaterial({
            ...baseProps,
            emissive: new THREE.Color(params.emissive),
            reflectivity: params.reflectivity,
            refractionRatio: params.refractionRatio
          });
          break;
          
        case 'phong':
          material = new THREE.MeshPhongMaterial({
            ...baseProps,
            emissive: new THREE.Color(params.emissive),
            specular: new THREE.Color(params.specular),
            shininess: params.shininess,
            reflectivity: params.reflectivity,
            refractionRatio: params.refractionRatio
          });
          break;
          
        case 'standard':
          material = new THREE.MeshStandardMaterial({
            ...baseProps,
            emissive: new THREE.Color(params.emissive),
            metalness: params.metalness,
            roughness: params.roughness
          });
          break;
          
        case 'toon':
          material = new THREE.MeshToonMaterial({
            ...baseProps,
            emissive: new THREE.Color(params.emissive)
          });
          break;
          
        case 'points':
          material = new THREE.PointsMaterial({
            color: new THREE.Color(params.color),
            size: params.pointSize,
            opacity: params.opacity,
            transparent: params.transparent || params.opacity < 1,
            vertexColors: params.vertexColors,
            fog: params.fog,
            alphaTest: params.alphaTest,
            blending: blendingMode
          });
          break;
          
        case 'line':
          material = new THREE.LineBasicMaterial({
            color: new THREE.Color(params.color),
            linewidth: params.linewidth,
            opacity: params.opacity,
            transparent: params.transparent || params.opacity < 1,
            vertexColors: params.vertexColors,
            fog: params.fog,
            blending: blendingMode
          });
          break;
          
        case 'shader':
          // Use custom instanced shader
          material = new THREE.ShaderMaterial({
            vertexShader: instancedVertexShader,
            fragmentShader: instancedFragmentShader,
            uniforms: {
              time: { value: 0 },
              opacity: { value: params.opacity }
            },
            transparent: params.transparent || params.opacity < 1,
            blending: blendingMode
          });
          break;
          
        default:
          console.warn(`Unknown material type: ${params.materialType}, falling back to basic`);
          material = new THREE.MeshBasicMaterial(baseProps);
      }
      
      console.log(`🎨 Created ${params.materialType} material for node`);
      return material;
      
    } catch (error) {
      console.error('❌ Error creating material:', error);
      // Fallback to basic material
      return new THREE.MeshBasicMaterial({ color: 0xff6b6b });
    }
  };

  // MEMOIZED MATERIAL CREATION - Fix #1: Cache materials
  const createMemoizedMaterial = useCallback((params) => {
    const materialKey = JSON.stringify({
      materialType: params.materialType,
      color: params.color,
      emissive: params.emissive,
      specular: params.specular,
      opacity: params.opacity,
      transparent: params.transparent,
      metalness: params.metalness,
      roughness: params.roughness,
      shininess: params.shininess,
      wireframe: params.wireframe,
      flatShading: params.flatShading,
      vertexColors: params.vertexColors,
      side: params.side,
      blending: params.blending,
      pointSize: params.pointSize,
      linewidth: params.linewidth
    });

    // Check if we can reuse cached material
    if (cachedMaterialRef.current && cachedMaterialRef.current.key === materialKey) {
      console.log('🔄 Reusing cached material for', params.materialType);
      return cachedMaterialRef.current.material;
    }

    // Create new material
    const material = createAdvancedMaterial(params);
    
    // Cache it
    if (cachedMaterialRef.current) {
      cachedMaterialRef.current.material.dispose(); // Clean up old material
    }
    cachedMaterialRef.current = { material, key: materialKey };
    
    return material;
  }, []);

  // MEMOIZED NODE OBJECT CREATION - Fix #3: Prevent constant recreation
  const createNodeObject = useMemo(() => {
    // Don't create node objects until data is loaded
    if (loading || !data.nodes.length) {
      return () => new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xff6b6b }));
    }
    
    return (node) => {
      // Use memoized functions to get cached geometry and material
      const { geometry } = createMemoizedGeometry(geometryParams);
      const material = createMemoizedMaterial(geometryParams);
      
      // Create mesh with cached geometry and material
      let mesh;
      if (geometryParams.materialType === 'points') {
        mesh = new THREE.Points(geometry, material);
      } else if (geometryParams.materialType === 'line') {
        mesh = new THREE.LineSegments(geometry, material);
      } else {
        mesh = new THREE.Mesh(geometry, material);
      }
      
      // Scale based on node importance or type
      const scale = node.size || 1;
      mesh.scale.setScalar(scale);
      
      console.log(`🔧 Created node with ${geometry.attributes.position.count} vertices using ${geometryParams.baseType} + ${geometryParams.materialType}`);
      
      return mesh;
    };
  }, [geometryParams, createMemoizedGeometry, createMemoizedMaterial, loading, data.nodes.length]);

  useEffect(() => {
    const loadRdfData = async () => {
      try {
        console.log('🔄 Starting data load...');
        setLoading(true);
        console.log('Loading RDF data...');
        
        const response = await fetch('/api/graph-data.json');
        console.log('📡 API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const graphData = await response.json();
        console.log('📊 Loaded graph data:', graphData.stats);
        console.log('📈 Node count:', graphData.nodes?.length || 0);
        console.log('🔗 Link count:', graphData.links?.length || 0);
        
        setData({
          nodes: graphData.nodes || [],
          links: graphData.links || []
        });
        setStats(graphData.stats);
        setError(null);
        console.log('✅ Data loading complete, setting loading to false');
      } catch (err) {
        console.error('❌ Failed to load RDF data:', err);
        setError(err.message);
        // Fallback to empty data
        setData({ nodes: [], links: [] });
      } finally {
        console.log('🏁 Setting loading to false in finally block');
        setLoading(false);
      }
    };

    loadRdfData();
  }, []);

  // COMPREHENSIVE GEOMETRY CREATION SYSTEM
  const createAdvancedGeometry = (params) => {
    let geometry;
    let actualVertices;
    
    console.log('🔧 Creating advanced geometry with params:', params);
    
    try {
      switch (params.baseType) {
        // PLATONIC SOLIDS
        case 'tetrahedron':
          geometry = new THREE.TetrahedronGeometry(params.radius, params.subdivisions);
          break;
        case 'cube':
          geometry = new THREE.BoxGeometry(
            params.radius * 2, params.radius * 2, params.radius * 2,
            params.widthSegments, params.heightSegments, params.depthSegments
          );
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(params.radius, params.subdivisions);
          break;
        case 'dodecahedron':
          geometry = new THREE.DodecahedronGeometry(params.radius, params.subdivisions);
          break;
        case 'icosahedron':
          geometry = new THREE.IcosahedronGeometry(params.radius, params.subdivisions);
          break;

        // SPHERICAL PRIMITIVES
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            params.radius, 
            params.radialSegments, 
            params.heightSegments,
            params.phiStart,
            params.phiLength,
            params.thetaStart,
            params.thetaLength
          );
          break;
        case 'sphereUV':
          geometry = new THREE.SphereGeometry(
            params.radius,
            params.phiSegments,
            params.thetaSegments
          );
          break;
        case 'geosphere':
          geometry = new THREE.IcosahedronGeometry(params.radius, params.subdivisions);
          break;

        // CYLINDRICAL PRIMITIVES
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            params.radius, params.radius, params.radius * 2,
            params.radialSegments, params.heightSegments
          );
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(
            params.radius, params.radius * 2,
            params.radialSegments, params.heightSegments
          );
          break;
        case 'capsule':
          geometry = new THREE.CapsuleGeometry(
            params.radius, params.radius * 2,
            params.radialSegments, params.heightSegments
          );
          break;

        // TOROIDAL PRIMITIVES
        case 'torus':
          geometry = new THREE.TorusGeometry(
            params.radius, params.tubeRadius,
            params.radialSegments, params.heightSegments
          );
          break;
        case 'torusKnot':
          geometry = new THREE.TorusKnotGeometry(
            params.radius, params.tubeRadius,
            params.radialSegments, params.heightSegments,
            params.p || 2, params.q || 3
          );
          break;

        // PLANAR PRIMITIVES
        case 'plane':
          geometry = new THREE.PlaneGeometry(
            params.radius * 2, params.radius * 2,
            params.widthSegments, params.heightSegments
          );
          break;
        case 'circle':
          geometry = new THREE.CircleGeometry(
            params.radius, params.radialSegments
          );
          break;
        case 'ring':
          geometry = new THREE.RingGeometry(
            params.innerRadius, params.radius,
            params.thetaSegments, params.phiSegments
          );
          break;

        // MINIMAL PRIMITIVES
        case 'point':
          // Single point geometry
          const pointPositions = new Float32Array([0, 0, 0]);
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
          break;
        case 'line':
          // Simple line geometry
          const linePositions = new Float32Array([
            -params.radius, 0, 0,
            params.radius, 0, 0
          ]);
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
          break;
        case 'triangle':
          // Simple triangle
          const triPositions = new Float32Array([
            0, params.radius, 0,
            -params.radius, -params.radius, 0,
            params.radius, -params.radius, 0
          ]);
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(triPositions, 3));
          break;

        // ADVANCED CASES
        case 'truncatedIcosahedron':
          // Approximation using subdivided icosahedron
          geometry = new THREE.IcosahedronGeometry(params.radius, Math.min(params.subdivisions + 1, 3));
          break;
        case 'truncatedDodecahedron':
          // Approximation using subdivided dodecahedron
          geometry = new THREE.DodecahedronGeometry(params.radius, Math.min(params.subdivisions + 1, 2));
          break;

        default:
          console.warn(`Unknown geometry type: ${params.baseType}, falling back to icosahedron`);
          geometry = new THREE.IcosahedronGeometry(params.radius, 0);
      }
      
      // Get actual vertex count from geometry
      const realVertexCount = geometry.attributes.position.count;
      actualVertices = realVertexCount;
      
      console.log(`📐 Created ${params.baseType}: ${realVertexCount} vertices`);
      
      // NO STATE UPDATE HERE - Fix #2: Remove the flickering-causing state update
      
      return { geometry, vertexCount: realVertexCount };
      
    } catch (error) {
      console.error('❌ Error creating geometry:', error);
      // Fallback to simple icosahedron
      geometry = new THREE.IcosahedronGeometry(1, 0);
      return { geometry, vertexCount: 12 };
    }
  };

  // SMART PARAMETER CALCULATION FOR TARGET VERTICES
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
    } else if (primitive.hasAngularSegments) {
      const targetSegments = Math.ceil(Math.sqrt(targetCount));
      return {
        phiSegments: Math.max(3, Math.min(64, targetSegments)),
        thetaSegments: Math.max(3, Math.min(32, Math.floor(targetSegments / 2)))
      };
    } else if (primitive.hasRadialSegments) {
      return {
        radialSegments: Math.max(3, Math.min(64, targetCount - 1))
      };
    }
    
    return {};
  };

  // LIVE VERTEX COUNT CALCULATOR
  const calculateCurrentVertexCount = (params) => {
    const primitive = basePrimitives[params.baseType];
    if (!primitive) return 12;
    
    try {
      if (primitive.hasSubdivisions) {
        return primitive.calculateVertices(params.subdivisions);
      } else if (primitive.hasSegments) {
        if (params.baseType === 'sphere' || params.baseType === 'cylinder' || params.baseType === 'cone') {
          return primitive.calculateVertices(params.radialSegments, params.heightSegments);
        } else if (params.baseType === 'cube' || params.baseType === 'plane') {
          return primitive.calculateVertices(params.widthSegments, params.heightSegments, params.depthSegments);
        } else if (params.baseType === 'torus' || params.baseType === 'ring') {
          return primitive.calculateVertices(params.radialSegments, params.heightSegments);
        }
      } else if (primitive.hasAngularSegments) {
        return primitive.calculateVertices(params.phiSegments, params.thetaSegments);
      } else if (primitive.hasRadialSegments) {
        return primitive.calculateVertices(params.radialSegments);
      }
    } catch (e) {
      console.warn('Error calculating vertex count:', e);
    }
    
    return primitive.minVertices;
  };

  // Setup optimized instanced rendering when data or geometry changes
  useEffect(() => {
    if (!graphRef.current || !data.nodes.length) return;

    console.log('🚀 Setting up ADVANCED instanced rendering for', data.nodes.length, 'nodes with geometry:', geometryParams.baseType);
    
    // Get the Three.js scene
    const scene = graphRef.current.scene();
    if (!scene) return;

    // Remove existing instanced meshes
    if (instancedNodesRef.current) {
      scene.remove(instancedNodesRef.current);
      instancedNodesRef.current.geometry.dispose();
      instancedNodesRef.current.material.dispose();
    }
    if (instancedLinksRef.current) {
      scene.remove(instancedLinksRef.current);
    }

    // Create ADVANCED instanced nodes
    const nodeCount = data.nodes.length;
    if (nodeCount > 0) {
      const { geometry: nodeGeometry, vertexCount } = createAdvancedGeometry(geometryParams);
      
      // Choose material based on settings
      let nodeMaterial;
      if (geometryParams.useCustomShaders) {
        nodeMaterial = new THREE.ShaderMaterial({
          vertexShader: instancedVertexShader,
          fragmentShader: instancedFragmentShader,
        });
      } else {
        nodeMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x4285f4,
          transparent: false,
          opacity: 1.0
        });
      }
      
      instancedNodesRef.current = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
      
      if (geometryParams.useGPUBuffers && geometryParams.useCustomShaders) {
        // Pre-allocate attribute buffers (GPU-friendly)
        const positions = new Float32Array(nodeCount * 3);
        const colors = new Float32Array(nodeCount * 3);
        const scales = new Float32Array(nodeCount);
        
        // Store references for updates
        positionBufferRef.current = positions;
        colorBufferRef.current = colors;
        scaleBufferRef.current = scales;
        
        // Map node IDs to instance indices and initialize
        nodeInstancesRef.current.clear();
        data.nodes.forEach((node, index) => {
          nodeInstancesRef.current.set(node.id, index);
          
          // Initialize with random positions
          positions[index * 3] = (Math.random() - 0.5) * 100;
          positions[index * 3 + 1] = (Math.random() - 0.5) * 100;
          positions[index * 3 + 2] = (Math.random() - 0.5) * 100;
          
          // Color by node type
          const typeColors = {
            'class': [0.2, 0.8, 0.2],
            'property': [0.8, 0.2, 0.2], 
            'individual': [0.2, 0.2, 0.8],
            'default': [0.6, 0.6, 0.6]
          };
          const color = typeColors[node.type] || typeColors.default;
          colors[index * 3] = color[0];
          colors[index * 3 + 1] = color[1];
          colors[index * 3 + 2] = color[2];
          
          // Scale based on connections
          scales[index] = 1.0 + (Math.random() * 0.5);
        });
        
        // Set instance attributes (uploaded to GPU once)
        instancedNodesRef.current.geometry.setAttribute('instancePosition', 
          new THREE.InstancedBufferAttribute(positions, 3));
        instancedNodesRef.current.geometry.setAttribute('instanceColor', 
          new THREE.InstancedBufferAttribute(colors, 3));
        instancedNodesRef.current.geometry.setAttribute('instanceScale', 
          new THREE.InstancedBufferAttribute(scales, 1));
      } else {
        // Fallback to matrix-based instancing
        instancedNodesRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        nodeInstancesRef.current.clear();
        data.nodes.forEach((node, index) => {
          nodeInstancesRef.current.set(node.id, index);
          
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
      }
      
      scene.add(instancedNodesRef.current);
      console.log('✅ Created ADVANCED instanced nodes:', nodeCount, 'using', geometryParams.baseType);
      
      // Update render stats
      setRenderStats({
        verticesPerNode: vertexCount,
        totalVertices: nodeCount * vertexCount,
        gpuInstancing: true,
        customShaders: geometryParams.useCustomShaders,
        cpuMatrixUpdates: !geometryParams.useGPUBuffers
      });
    }

    // Create optimized instanced links (simplified for now)
    const linkCount = data.links.length;
    if (linkCount > 0) {
      const linkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 4);
      const linkMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x666666, 
        transparent: true, 
        opacity: 0.6 
      });
      
      instancedLinksRef.current = new THREE.InstancedMesh(linkGeometry, linkMaterial, linkCount);
      instancedLinksRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      
      linkInstancesRef.current.clear();
      data.links.forEach((link, index) => {
        const linkId = `${link.source}-${link.target}`;
        linkInstancesRef.current.set(linkId, index);
        
        const matrix = new THREE.Matrix4();
        matrix.makeScale(1, 10, 1);
        matrix.setPosition(0, 0, 0);
        instancedLinksRef.current.setMatrixAt(index, matrix);
      });
      instancedLinksRef.current.instanceMatrix.needsUpdate = true;
      
      scene.add(instancedLinksRef.current);
      console.log('✅ Created instanced links:', linkCount);
    }

  }, [data, geometryParams]); // Re-run when geometry parameters change

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

  // CLEANUP CACHED RESOURCES - Prevent memory leaks
  useEffect(() => {
    return () => {
      if (cachedGeometryRef.current) {
        cachedGeometryRef.current.dispose();
      }
      if (cachedMaterialRef.current) {
        cachedMaterialRef.current.material.dispose();
      }
    };
  }, []);

  // Debug effect to track loading state
  useEffect(() => {
    console.log('🔍 Loading state changed to:', loading);
    console.log('📊 Current data state:', { 
      nodeCount: data.nodes?.length || 0, 
      linkCount: data.links?.length || 0 
    });
  }, [loading, data]);

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
      {/* Enhanced Performance Stats */}
      {stats && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '15px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000,
          fontFamily: 'monospace'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', color: '#4CAF50' }}>
            📊 RDF Graph Performance
          </div>
          <div>Nodes: {stats.nodeCount?.toLocaleString()}</div>
          <div>Links: {stats.linkCount?.toLocaleString()}</div>
          <div>Triples: {stats.tripleCount?.toLocaleString()}</div>
          <div>Vertices per node: {renderStats.verticesPerNode}</div>
          <div>Total vertices: {renderStats.totalVertices?.toLocaleString()}</div>
          <div style={{ color: fps < 30 ? '#ff6b6b' : fps < 60 ? '#ffd93d' : '#6bcf7f' }}>
            FPS: {fps}
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#aaa' }}>
            <div>GPU Instancing: {renderStats.gpuInstancing ? '✅' : '❌'}</div>
            <div>Custom Shaders: {renderStats.customShaders ? '✅' : '❌'}</div>
            <div>CPU Matrix Updates: {renderStats.cpuMatrixUpdates ? '❌' : '✅'}</div>
            <div>Low-poly Geometry: {renderStats.verticesPerNode <= 12 ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE GEOMETRY CONTROLS */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.95)',
        color: '#fff',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 1000,
        fontFamily: 'monospace',
        width: '380px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        border: '1px solid #333'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '15px', color: '#4CAF50', fontWeight: 'bold', textAlign: 'center' }}>
          🔮 PARAMETRIC GEOMETRY SUBSTRATE
        </div>
        
        {/* Performance Indicator */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '8px', 
          background: fps > 30 ? 'rgba(0,255,0,0.1)' : fps > 15 ? 'rgba(255,255,0,0.1)' : 'rgba(255,0,0,0.1)',
          borderRadius: '4px',
          border: `1px solid ${fps > 30 ? '#0a0' : fps > 15 ? '#aa0' : '#a00'}`,
          fontSize: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {fps > 30 ? '🟢' : fps > 15 ? '🟡' : '🔴'} {fps.toFixed(1)} FPS | 
            {(getCurrentVertexCount() * (stats?.nodeCount || 0)).toLocaleString()} vertices
          </div>
        </div>

        {/* BASE PRIMITIVE SELECTION */}
        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', color: '#4fc3f7' }}>
            � Base Primitive:
          </label>
          <select 
            value={geometryParams.baseType}
            onChange={(e) => setGeometryParams(prev => ({...prev, baseType: e.target.value}))}
            style={{ 
              width: '100%', 
              padding: '4px', 
              fontSize: '10px',
              background: '#222',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '3px'
            }}
          >
            <optgroup label="🔺 PLATONIC SOLIDS">
              <option value="tetrahedron">Tetrahedron (4 vertices)</option>
              <option value="cube">Cube (8 vertices)</option>
              <option value="octahedron">Octahedron (6 vertices)</option>
              <option value="dodecahedron">Dodecahedron (20 vertices)</option>
              <option value="icosahedron">Icosahedron (12 vertices)</option>
            </optgroup>
            <optgroup label="🔸 ARCHIMEDEAN SOLIDS">
              <option value="truncatedTetrahedron">Truncated Tetrahedron</option>
              <option value="cuboctahedron">Cuboctahedron</option>
              <option value="truncatedCube">Truncated Cube</option>
              <option value="truncatedOctahedron">Truncated Octahedron</option>
              <option value="rhombicuboctahedron">Rhombicuboctahedron</option>
              <option value="icosidodecahedron">Icosidodecahedron</option>
              <option value="rhombicosidodecahedron">Rhombicosidodecahedron</option>
            </optgroup>
            <optgroup label="🌐 SPHERICAL">
              <option value="sphere">Sphere</option>
              <option value="ellipsoid">Ellipsoid</option>
              <option value="geodesic">Geodesic Sphere</option>
            </optgroup>
            <optgroup label="🔳 CYLINDRICAL">
              <option value="cylinder">Cylinder</option>
              <option value="cone">Cone</option>
              <option value="frustum">Frustum</option>
            </optgroup>
            <optgroup label="🍩 TOROIDAL">
              <option value="torus">Torus</option>
              <option value="torusKnot">Torus Knot</option>
            </optgroup>
            <optgroup label="📐 PLANAR">
              <option value="plane">Plane</option>
              <option value="ring">Ring</option>
              <option value="circle">Circle</option>
            </optgroup>
            <optgroup label="📊 PARAMETRIC">
              <option value="parametric">Parametric Surface</option>
              <option value="convex">Convex Hull</option>
            </optgroup>
            <optgroup label="⚡ MINIMAL">
              <option value="points">Point Cloud</option>
              <option value="line">Line Segments</option>
            </optgroup>
          </select>
        </div>

        {/* SUBDIVISION CONTROLS */}
        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', color: '#81c784' }}>
            � Subdivisions: {geometryParams.subdivisions}
          </label>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={geometryParams.subdivisions}
            onChange={(e) => setGeometryParams(prev => ({...prev, subdivisions: parseInt(e.target.value)}))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '9px', color: '#aaa' }}>
            0 = Base mesh | 6 = Maximum detail
          </div>
        </div>

        {/* SEGMENT CONTROLS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', color: '#ffb74d' }}>
              🔄 Width Segments: {geometryParams.widthSegments}
            </label>
            <input
              type="range"
              min="3"
              max="64"
              value={geometryParams.widthSegments}
              onChange={(e) => setGeometryParams(prev => ({...prev, widthSegments: parseInt(e.target.value)}))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', color: '#ffb74d' }}>
              📏 Height Segments: {geometryParams.heightSegments}
            </label>
            <input
              type="range"
              min="3"
              max="64"
              value={geometryParams.heightSegments}
              onChange={(e) => setGeometryParams(prev => ({...prev, heightSegments: parseInt(e.target.value)}))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* ANGULAR CONTROLS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <EnhancedSlider
              label="🌅 Theta Start"
              value={geometryParams.thetaStart}
              min={0}
              max={Math.PI * 2}
              step={0.1}
              decimals={2}
              unit=" rad"
              onChange={(value) => setGeometryParams(prev => ({...prev, thetaStart: value}))}
              color="#ba68c8"
            />
          </div>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <EnhancedSlider
              label="🌄 Theta Length"
              value={geometryParams.thetaLength}
              min={0.1}
              max={Math.PI * 2}
              step={0.1}
              decimals={2}
              unit=" rad"
              onChange={(value) => setGeometryParams(prev => ({...prev, thetaLength: value}))}
              color="#ba68c8"
            />
          </div>
        </div>

        {/* PHI CONTROLS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <EnhancedSlider
              label="🌐 Phi Start"
              value={geometryParams.phiStart}
              min={0}
              max={Math.PI}
              step={0.1}
              decimals={2}
              unit=" rad"
              onChange={(value) => setGeometryParams(prev => ({...prev, phiStart: value}))}
              color="#f06292"
            />
          </div>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <EnhancedSlider
              label="🔄 Phi Length"
              value={geometryParams.phiLength}
              min={0.1}
              max={Math.PI}
              step={0.1}
              decimals={2}
              unit=" rad"
              onChange={(value) => setGeometryParams(prev => ({...prev, phiLength: value}))}
              color="#f06292"
            />
          </div>
        </div>

        {/* SPECIAL PARAMETERS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', color: '#64b5f6' }}>
              � P Parameter: {geometryParams.p}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={geometryParams.p}
              onChange={(e) => setGeometryParams(prev => ({...prev, p: parseInt(e.target.value)}))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', color: '#64b5f6' }}>
              🔄 Q Parameter: {geometryParams.q}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={geometryParams.q}
              onChange={(e) => setGeometryParams(prev => ({...prev, q: parseInt(e.target.value)}))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* PERFORMANCE CONTROLS */}
        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#a5d6a7' }}>⚡ Performance:</div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
              <input
                type="checkbox"
                checked={geometryParams.useCustomShaders}
                onChange={(e) => setGeometryParams(prev => ({...prev, useCustomShaders: e.target.checked}))}
                style={{ marginRight: '6px' }}
              />
              🎨 GPU Shaders
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
              <input
                type="checkbox"
                checked={geometryParams.useGPUBuffers}
                onChange={(e) => setGeometryParams(prev => ({...prev, useGPUBuffers: e.target.checked}))}
                style={{ marginRight: '6px' }}
              />
              ⚡ GPU Buffers
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
              <input
                type="checkbox"
                checked={geometryParams.batchUpdates}
                onChange={(e) => setGeometryParams(prev => ({...prev, batchUpdates: e.target.checked}))}
                style={{ marginRight: '6px' }}
              />
              📦 Batch Updates
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
              <input
                type="checkbox"
                checked={geometryParams.lodEnabled}
                onChange={(e) => setGeometryParams(prev => ({...prev, lodEnabled: e.target.checked}))}
                style={{ marginRight: '6px' }}
              />
              🎯 LOD System
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <EnhancedSlider
                label="🔄 Update Rate"
                value={geometryParams.updateFrequency}
                min={16}
                max={100}
                step={16}
                unit="ms"
                onChange={(value) => setGeometryParams(prev => ({...prev, updateFrequency: value}))}
                color="#81c784"
              />
            </div>
            <div style={{ flex: 1 }}>
              <EnhancedSlider
                label="📏 Cull Distance"
                value={geometryParams.cullDistance}
                min={50}
                max={500}
                step={50}
                onChange={(value) => setGeometryParams(prev => ({...prev, cullDistance: value}))}
                color="#81c784"
              />
            </div>
          </div>
        </div>

        {/* MATERIAL PARAMETER SYSTEM */}
        <div style={{ marginTop: '15px', borderTop: '2px solid #444', paddingTop: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#e91e63', textAlign: 'center' }}>
            🎨 MATERIAL SUBSTRATE
          </div>

          {/* MATERIAL TYPE SELECTION */}
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', color: '#e91e63' }}>
              🔮 Material Type:
            </label>
            <select 
              value={geometryParams.materialType}
              onChange={(e) => setGeometryParams(prev => ({...prev, materialType: e.target.value}))}
              style={{ 
                width: '100%', 
                padding: '4px', 
                fontSize: '10px',
                background: '#222',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '3px'
              }}
            >
              <option value="basic">MeshBasicMaterial (No lighting - Fastest)</option>
              <option value="lambert">MeshLambertMaterial (Diffuse lighting)</option>
              <option value="phong">MeshPhongMaterial (Specular highlights)</option>
              <option value="standard">MeshStandardMaterial (PBR)</option>
              <option value="toon">MeshToonMaterial (Cartoon shading)</option>
              <option value="points">PointsMaterial (Point cloud)</option>
              <option value="line">LineBasicMaterial (Line rendering)</option>
              <option value="shader">ShaderMaterial (Custom GPU)</option>
            </select>
          </div>

          {/* COLOR CONTROLS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <ColorPicker
                label="🎨 Base Color"
                value={geometryParams.color}
                onChange={(value) => setGeometryParams(prev => ({...prev, color: value}))}
                color="#ff6b6b"
              />
            </div>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <ColorPicker
                label="✨ Emissive"
                value={geometryParams.emissive}
                onChange={(value) => setGeometryParams(prev => ({...prev, emissive: value}))}
                color="#ffd93d"
              />
            </div>
          </div>

          {/* SURFACE PROPERTIES */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <EnhancedSlider
                label="💧 Opacity"
                value={geometryParams.opacity}
                min={0}
                max={1}
                step={0.05}
                decimals={2}
                onChange={(value) => setGeometryParams(prev => ({...prev, opacity: value}))}
                color="#64b5f6"
              />
            </div>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <EnhancedSlider
                label="⚡ Metalness"
                value={geometryParams.metalness}
                min={0}
                max={1}
                step={0.05}
                decimals={2}
                onChange={(value) => setGeometryParams(prev => ({...prev, metalness: value}))}
                color="#90a4ae"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <EnhancedSlider
                label="🌊 Roughness"
                value={geometryParams.roughness}
                min={0}
                max={1}
                step={0.05}
                decimals={2}
                onChange={(value) => setGeometryParams(prev => ({...prev, roughness: value}))}
                color="#81c784"
              />
            </div>
            <div style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <EnhancedSlider
                label="✨ Shininess"
                value={geometryParams.shininess}
                min={0}
                max={100}
                step={1}
                onChange={(value) => setGeometryParams(prev => ({...prev, shininess: value}))}
                color="#ffb74d"
              />
            </div>
          </div>

          {/* RENDERING PROPERTIES */}
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#ba68c8' }}>🔧 Rendering:</div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={geometryParams.wireframe}
                  onChange={(e) => setGeometryParams(prev => ({...prev, wireframe: e.target.checked}))}
                  style={{ marginRight: '6px' }}
                />
                🕸️ Wireframe
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={geometryParams.transparent}
                  onChange={(e) => setGeometryParams(prev => ({...prev, transparent: e.target.checked}))}
                  style={{ marginRight: '6px' }}
                />
                👻 Transparent
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={geometryParams.flatShading}
                  onChange={(e) => setGeometryParams(prev => ({...prev, flatShading: e.target.checked}))}
                  style={{ marginRight: '6px' }}
                />
                📐 Flat Shading
              </label>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={geometryParams.vertexColors}
                  onChange={(e) => setGeometryParams(prev => ({...prev, vertexColors: e.target.checked}))}
                  style={{ marginRight: '6px' }}
                />
                🌈 Vertex Colors
              </label>
            </div>

            {/* SIDE AND BLENDING */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '9px', color: '#ccc', marginBottom: '2px' }}>
                  Side:
                </label>
                <select 
                  value={geometryParams.side}
                  onChange={(e) => setGeometryParams(prev => ({...prev, side: e.target.value}))}
                  style={{ 
                    width: '100%', 
                    padding: '2px', 
                    fontSize: '9px',
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '3px'
                  }}
                >
                  <option value="front">Front</option>
                  <option value="back">Back</option>
                  <option value="double">Double</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '9px', color: '#ccc', marginBottom: '2px' }}>
                  Blending:
                </label>
                <select 
                  value={geometryParams.blending}
                  onChange={(e) => setGeometryParams(prev => ({...prev, blending: e.target.value}))}
                  style={{ 
                    width: '100%', 
                    padding: '2px', 
                    fontSize: '9px',
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '3px'
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="additive">Additive</option>
                  <option value="subtractive">Subtractive</option>
                  <option value="multiply">Multiply</option>
                </select>
              </div>
            </div>

            {/* POINT/LINE SPECIFIC */}
            {(geometryParams.materialType === 'points' || geometryParams.materialType === 'line') && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <div style={{ flex: 1 }}>
                  <EnhancedSlider
                    label={geometryParams.materialType === 'points' ? "🔴 Point Size" : "📏 Line Width"}
                    value={geometryParams.materialType === 'points' ? geometryParams.pointSize : geometryParams.linewidth}
                    min={0.1}
                    max={10}
                    step={0.1}
                    decimals={1}
                    onChange={(value) => setGeometryParams(prev => ({
                      ...prev, 
                      [geometryParams.materialType === 'points' ? 'pointSize' : 'linewidth']: value
                    }))}
                    color="#f06292"
                  />
                </div>
              </div>
            )}
          </div>

          {/* MATERIAL PRESETS */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#e91e63' }}>🎨 Material Presets:</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setGeometryParams(prev => ({...prev, 
                  materialType: 'basic', color: '#ff6b6b', opacity: 1, wireframe: false
                }))}
                style={{
                  padding: '4px 6px',
                  fontSize: '9px',
                  background: '#0a0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🚀 Ultra Fast
              </button>
              <button
                onClick={() => setGeometryParams(prev => ({...prev, 
                  materialType: 'lambert', color: '#4fc3f7', opacity: 0.8, metalness: 0.2, roughness: 0.7
                }))}
                style={{
                  padding: '4px 6px',
                  fontSize: '9px',
                  background: '#aa0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Balanced
              </button>
              <button
                onClick={() => setGeometryParams(prev => ({...prev, 
                  materialType: 'standard', color: '#81c784', metalness: 0.8, roughness: 0.2, opacity: 1
                }))}
                style={{
                  padding: '4px 6px',
                  fontSize: '9px',
                  background: '#a00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🎨 PBR Quality
              </button>
              <button
                onClick={() => setGeometryParams(prev => ({...prev, 
                  materialType: 'points', pointSize: 2, color: '#ffd93d', opacity: 0.9
                }))}
                style={{
                  padding: '4px 6px',
                  fontSize: '9px',
                  background: '#6a1b9a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🔴 Point Cloud
              </button>
              <button
                onClick={() => setGeometryParams(prev => ({...prev, 
                  materialType: 'basic', wireframe: true, color: '#ffffff', opacity: 0.6
                }))}
                style={{
                  padding: '4px 6px',
                  fontSize: '9px',
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🕸️ Wireframe
              </button>
            </div>
          </div>
        </div>

        {/* GEOMETRY PRESETS */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#ff9800' }}>🚀 Geometry Presets:</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setGeometryParams(prev => ({...prev, 
                baseType: 'icosahedron', subdivisions: 0, 
                useCustomShaders: true, useGPUBuffers: true, batchUpdates: true
              }))}
              style={{
                padding: '4px 6px',
                fontSize: '9px',
                background: '#0a0',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🚀 Ultra Fast
            </button>
            <button
              onClick={() => setGeometryParams(prev => ({...prev, 
                baseType: 'sphere', radialSegments: 8, heightSegments: 6,
                useCustomShaders: true, useGPUBuffers: true, batchUpdates: true
              }))}
              style={{
                padding: '4px 6px',
                fontSize: '9px',
                background: '#aa0',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              ⚡ Balanced
            </button>
            <button
              onClick={() => setGeometryParams(prev => ({...prev, 
                baseType: 'icosahedron', subdivisions: 2,
                useCustomShaders: false, useGPUBuffers: false, batchUpdates: false
              }))}
              style={{
                padding: '4px 6px',
                fontSize: '9px',
                background: '#a00',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🎨 Quality
            </button>
            <button
              onClick={() => setGeometryParams(prev => ({...prev, 
                baseType: 'dodecahedron', subdivisions: 0,
                useCustomShaders: true, useGPUBuffers: true, batchUpdates: true
              }))}
              style={{
                padding: '4px 6px',
                fontSize: '9px',
                background: '#6a1b9a',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🔮 Platonic
            </button>
          </div>
        </div>
      </div>
      
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
        // USE MEMOIZED PARAMETRIC GEOMETRY SYSTEM - Fix #3
        nodeThreeObject={createNodeObject}
        // linkThreeObject={() => {
        //   // Return invisible placeholder - instanced mesh handles actual rendering  
        //   const placeholder = new THREE.Object3D();
        //   placeholder.visible = false;
        //   return placeholder;
        // }}
        // OPTIMIZED position updates - minimal CPU work
        nodePositionUpdate={(nodeObject, coords, node) => {
          if (!instancedNodesRef.current || !positionBufferRef.current || !nodeInstancesRef.current.has(node.id)) return;
          
          const instanceIndex = nodeInstancesRef.current.get(node.id);
          const positions = positionBufferRef.current;
          
          // Direct buffer update - much faster than matrix math
          positions[instanceIndex * 3] = coords.x || 0;
          positions[instanceIndex * 3 + 1] = coords.y || 0;
          positions[instanceIndex * 3 + 2] = coords.z || 0;
          
          // Mark for GPU update (batched)
          instancedNodesRef.current.geometry.attributes.instancePosition.needsUpdate = true;
          
          return false; // Let force-graph handle its own rendering too for now
        }}
        linkPositionUpdate={(linkObject, coords, link) => {
          if (!instancedLinksRef.current || !linkInstancesRef.current.has(`${link.source}-${link.target}`)) return;
          
          const instanceIndex = linkInstancesRef.current.get(`${link.source}-${link.target}`);
          const matrix = new THREE.Matrix4();
          
          const start = coords.start;
          const end = coords.end;
          
          if (!start || !end) return;
          
          const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.y - start.y, 2) + 
            Math.pow(end.z - start.z, 2)
          );
          
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const midZ = (start.z + end.z) / 2;
          
          const direction = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
          direction.normalize();
          
          matrix.makeScale(1, distance, 1);
          
          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(up, direction);
          
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.makeRotationFromQuaternion(quaternion);
          
          matrix.multiplyMatrices(rotationMatrix, matrix);
          matrix.setPosition(midX, midY, midZ);
          
          instancedLinksRef.current.setMatrixAt(instanceIndex, matrix);
          
          // Batch update flag - don't set every frame
          if (instanceIndex % 10 === 0) { // Only update flag every 10th link
            instancedLinksRef.current.instanceMatrix.needsUpdate = true;
          }
          
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
