// src/components/ThreeForceGraph.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ForceGraph from 'three-forcegraph';
import { useStats } from '../../hooks/useStats';

// Manual OrbitControls implementation for better Astro compatibility
class SimpleOrbitControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled: boolean = true;
  enableRotate: boolean = true;
  enableZoom: boolean = true;
  enablePan: boolean = true;
  
  private isMouseDown: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private rotateSpeed: number = 1.0;
  private zoomSpeed: number = 1.0;
  private panSpeed: number = 1.0;
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private onMouseDown(event: MouseEvent) {
    if (!this.enabled) return;
    this.isMouseDown = true;
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }
  
  private onMouseMove(event: MouseEvent) {
    if (!this.enabled || !this.isMouseDown) return;
    
    const deltaX = event.clientX - this.mouseX;
    const deltaY = event.clientY - this.mouseY;
    
    if (this.enableRotate) {
      // Rotate around Y axis (horizontal movement)
      const angleY = deltaX * 0.01 * this.rotateSpeed;
      // Rotate around X axis (vertical movement)  
      const angleX = deltaY * 0.01 * this.rotateSpeed;
      
      // Simple orbital rotation
      const distance = this.camera.position.length();
      const phi = Math.atan2(this.camera.position.z, this.camera.position.x) - angleY;
      const theta = Math.acos(this.camera.position.y / distance) + angleX;
      
      // Clamp theta to prevent flipping
      const clampedTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));
      
      this.camera.position.x = distance * Math.sin(clampedTheta) * Math.cos(phi);
      this.camera.position.y = distance * Math.cos(clampedTheta);
      this.camera.position.z = distance * Math.sin(clampedTheta) * Math.sin(phi);
      
      this.camera.lookAt(0, 0, 0);
    }
    
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }
  
  private onMouseUp() {
    this.isMouseDown = false;
  }
  
  private onWheel(event: WheelEvent) {
    if (!this.enabled || !this.enableZoom) return;
    
    event.preventDefault();
    const scale = event.deltaY > 0 ? 1.1 : 0.9;
    this.camera.position.multiplyScalar(scale);
    
    // Prevent going too close or too far
    const distance = this.camera.position.length();
    if (distance < 10) {
      this.camera.position.normalize().multiplyScalar(10);
    } else if (distance > 500) {
      this.camera.position.normalize().multiplyScalar(500);
    }
  }
  
  update() {
    // No continuous updates needed for this simple implementation
  }
  
  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.removeEventListener('wheel', this.onWheel.bind(this));
  }
}

interface GraphData {
  nodes: Array<{
    id: string;
    label?: string;
    type?: string;
    isLiteral?: boolean;
  }>;
  links: Array<{
    source: string;
    target: string;
    label?: string;
    predicate: string;
  }>;
  stats: {
    tripleCount: number;
    nodeCount: number;
    linkCount: number;
  };
}

interface ThreeForceGraphProps {
  dataUrl: string; // URL to fetch the RDF-lifted JSON
  fallbackData?: GraphData; // Optional local fallback for offline/debug
  nodeSizeFrom?: (id: string, degree: number) => number; // Custom node sizing logic
  statusHandler?: (msg: string) => void; // Optional logging mechanism
  cameraZ?: number; // Optional camera depth (default: 100)
  backgroundColor?: string; // Optional background color
  inspect?: boolean; // If true, attach Spector.js WebGL debugger
  enableStats?: boolean; // If true, show performance stats
  enableControls?: boolean; // If true, enable camera controls (pan, zoom, rotate)
}

export default function ThreeForceGraph({
  dataUrl,
  fallbackData,
  nodeSizeFrom = (id: string, degree: number) => Math.max(1, degree),
  statusHandler,
  cameraZ = 100,
  backgroundColor = '#000000',
  inspect = false,
  enableStats = false,
  enableControls = true
}: ThreeForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const spectorRef = useRef<any>(null);
  const [internalStatus, setInternalStatus] = useState('Initializing...');
  const { begin, end } = useStats(enableStats);

  // Unified status handler - use prop or internal state
  const updateStatus = (msg: string) => {
    if (statusHandler) {
      statusHandler(msg);
    } else {
      setInternalStatus(msg);
    }
  };

  // Spector.js integration
  useEffect(() => {
    if (inspect && rendererRef.current) {
      activateSpector(rendererRef.current.domElement);
    }

    return () => {
      if (spectorRef.current) {
        try {
          spectorRef.current.dispose();
        } catch (e) {
          console.warn('Failed to dispose Spector.js:', e);
        }
        spectorRef.current = null;
      }
    };
  }, [inspect]);

  // Setup camera controls
  function setupCameraControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    try {
      updateStatus('Setting up camera controls...');
      
      // Use our simple OrbitControls implementation
      const controls = new SimpleOrbitControls(camera, renderer.domElement);
      
      controlsRef.current = controls;
      updateStatus('Camera controls ready - Click and drag to rotate, scroll to zoom');
      
    } catch (error) {
      console.error('Failed to setup camera controls:', error);
      updateStatus('Camera controls failed to load');
    }
  }

  async function activateSpector(rendererDom: HTMLCanvasElement) {
    try {
      updateStatus('Activating WebGL inspector...');
      const SPECTOR = await import('spectorjs');
      const spector = new SPECTOR.Spector();
      spector.displayUI();
      spector.captureCanvas(rendererDom, 1, true);
      spectorRef.current = spector;
      updateStatus('WebGL inspector active');
    } catch (error) {
      console.error('Failed to activate Spector.js:', error);
      updateStatus('WebGL inspector failed to load');
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;

    updateStatus('Initializing renderer...');

    // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(backgroundColor);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Init scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = cameraZ;

    // Setup camera controls if enabled
    if (enableControls) {
      setupCameraControls(camera, renderer);
    }

    // Init forcegraph
    const Graph = new ForceGraph();
    
    // Calculate connectedness and transform data
    const processGraphData = (graphData: GraphData) => {
      updateStatus(`Processing ${graphData.stats.nodeCount} nodes, ${graphData.stats.linkCount} links...`);
      
      // Count connections for each node
      const connectionCounts = new Map<string, number>();
      
      // Initialize all nodes with 0 connections
      graphData.nodes.forEach((node) => {
        connectionCounts.set(node.id, 0);
      });
      
      // Count incoming and outgoing connections
      graphData.links.forEach((link) => {
        const sourceCount = connectionCounts.get(link.source) || 0;
        const targetCount = connectionCounts.get(link.target) || 0;
        connectionCounts.set(link.source, sourceCount + 1);
        connectionCounts.set(link.target, targetCount + 1);
      });
      
      // Transform data with custom node sizing
      return {
        nodes: graphData.nodes.map((node) => ({
          id: node.id,
          name: node.label || node.id,
          val: nodeSizeFrom(node.id, connectionCounts.get(node.id) || 0)
        })),
        links: graphData.links.map((link) => ({
          source: link.source,
          target: link.target
        }))
      };
    };
    
    // Load data from URL
    async function loadData() {
      try {
        updateStatus(`Fetching data from ${dataUrl}...`);
        const response = await fetch(dataUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const graphData = await response.json();
        
        if (graphData.error) {
          throw new Error(graphData.error);
        }
        
        updateStatus('Processing graph data...');
        const processedData = processGraphData(graphData);
        
        Graph.graphData(processedData);
        updateStatus(`Ready! ${processedData.nodes.length} nodes, ${processedData.links.length} links`);
        
      } catch (error) {
        console.error('Failed to load graph data:', error);
        updateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Use fallback data if provided
        if (fallbackData) {
          updateStatus('Using fallback data...');
          const processedFallback = processGraphData(fallbackData);
          Graph.graphData(processedFallback);
          updateStatus(`Fallback loaded: ${processedFallback.nodes.length} nodes, ${processedFallback.links.length} links`);
        } else {
          // Minimal error state
          Graph.graphData({
            nodes: [{ id: 'error' } as any],
            links: []
          });
        }
      }
    }
    
    scene.add(Graph);
    loadData();

    // Animate
    function animate() {
      begin(); // Start stats monitoring
      
      requestAnimationFrame(animate);
      
      // Update controls if enabled
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      Graph.tickFrame(); // update positions
      renderer.render(scene, camera);
      
      end(); // End stats monitoring
    }
    animate();

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Dispose camera controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      // Dispose Spector.js if active
      if (spectorRef.current) {
        try {
          spectorRef.current.dispose();
        } catch (e) {
          console.warn('Failed to dispose Spector.js:', e);
        }
        spectorRef.current = null;
      }
      
      // Clean up Three.js
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      rendererRef.current = null;
    };

  }, [dataUrl, fallbackData, nodeSizeFrom, statusHandler, cameraZ, backgroundColor]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {!statusHandler && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '10px', 
            background: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            zIndex: 1000
          }}
        >
          {internalStatus}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
