// src/components/react/SimpleThreeForceGraph.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ForceGraph from 'three-forcegraph';
import { useStats } from '../../hooks/useStats';
import PerformanceMonitor from './PerformanceMonitor';

interface SimpleThreeForceGraphProps {
  dataUrl: string;
  enableStats?: boolean;
  enableControls?: boolean;
}

export default function SimpleThreeForceGraph({ dataUrl, enableStats = true, enableControls = true }: SimpleThreeForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const [status, setStatus] = useState('Initializing...');
  const [graphStats, setGraphStats] = useState({ nodeCount: 0, linkCount: 0 });
  const { begin, end } = useStats(enableStats);

  // Setup camera controls
  async function setupCameraControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    try {
      setStatus('Setting up camera controls...');
      
      // Dynamic import for OrbitControls to work with Astro SSR
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      
      const controls = new OrbitControls(camera, renderer.domElement);
      
      // Configure controls
      controls.enableDamping = true; // Smooth movement
      controls.dampingFactor = 0.1;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      
      // Set limits to prevent going too close/far
      controls.minDistance = 10;
      controls.maxDistance = 500;
      
      controlsRef.current = controls;
      
    } catch (error) {
      console.error('Failed to setup camera controls:', error);
      setStatus('Camera controls failed to load');
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Initializing Three.js force graph...');
    setStatus('Setting up renderer...');

    // Basic setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#1a1a1a');
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    // Setup camera controls if enabled
    if (enableControls) {
      setupCameraControls(camera, renderer);
    }

    // Create force graph
    const graph = new ForceGraph();
    scene.add(graph);

    // Load actual TTL data
    async function loadRealData() {
      try {
        setStatus('Loading arcaea-one.ttl...');
        console.log('Fetching data from:', dataUrl);
        
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const graphData = await response.json();
        console.log('Received graph data:', graphData);
        
        if (graphData.error) {
          throw new Error(graphData.error);
        }
        
        // Transform the data for three-forcegraph
        setStatus(`Processing ${graphData.stats.nodeCount} nodes...`);
        
        // Calculate connectedness for node sizing
        const connectionCounts = new Map<string, number>();
        
        // Initialize all nodes with 0 connections
        graphData.nodes.forEach((node: any) => {
          connectionCounts.set(node.id, 0);
        });
        
        // Count connections
        graphData.links.forEach((link: any) => {
          const sourceCount = connectionCounts.get(link.source) || 0;
          const targetCount = connectionCounts.get(link.target) || 0;
          connectionCounts.set(link.source, sourceCount + 1);
          connectionCounts.set(link.target, targetCount + 1);
        });
        
        const processedData = {
          nodes: graphData.nodes.map((node: any) => ({
            id: node.id,
            name: node.label || node.id.split(/[#\/]/).pop() || node.id,
            val: Math.max(1, connectionCounts.get(node.id) || 1)
          })),
          links: graphData.links.map((link: any) => ({
            source: link.source,
            target: link.target
          }))
        };
        
        console.log('Processed data:', processedData);
        graph.graphData(processedData);
        setGraphStats({ nodeCount: processedData.nodes.length, linkCount: processedData.links.length });
        setStatus(`Ready! ${processedData.nodes.length} nodes, ${processedData.links.length} links`);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Fallback to test data
        const testData = {
          nodes: [
            { id: 'error', name: 'Load Failed', val: 3 },
            { id: 'node2', name: 'Node 2', val: 1 },
            { id: 'node3', name: 'Node 3', val: 1 }
          ],
          links: [
            { source: 'error', target: 'node2' },
            { source: 'node2', target: 'node3' }
          ]
        };
        graph.graphData(testData);
      }
    }
    
    loadRealData();

    // Animation loop with stats monitoring
    function animate() {
      begin(); // Start stats monitoring
      
      requestAnimationFrame(animate);
      
      // Update controls if enabled
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      graph.tickFrame();
      renderer.render(scene, camera);
      
      end(); // End stats monitoring
    }
    animate();

    // Cleanup
    return () => {
      // Dispose camera controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      rendererRef.current = null;
      console.log('Three.js cleaned up');
    };
  }, [dataUrl]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <PerformanceMonitor 
        enabled={enableStats}
        nodeCount={graphStats.nodeCount}
        linkCount={graphStats.linkCount}
        renderer={rendererRef.current || undefined}
      />
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
        {status}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
