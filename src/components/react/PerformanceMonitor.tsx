// src/components/react/PerformanceMonitor.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStats } from '../../hooks/useStats';

interface PerformanceMonitorProps {
  enabled?: boolean;
  nodeCount?: number;
  linkCount?: number;
  renderer?: THREE.WebGLRenderer;
}

export default function PerformanceMonitor({ 
  enabled = true, 
  nodeCount = 0, 
  linkCount = 0,
  renderer 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { begin, end } = useStats(enabled);

  useEffect(() => {
    if (!enabled) return;

    // Update metrics every second
    intervalRef.current = setInterval(() => {
      if (renderer && renderer.info) {
        setMetrics(prev => ({
          ...prev,
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures
        }));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, renderer]);

  if (!enabled) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '60px',
        right: '0px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        borderRadius: '0 0 0 8px',
        minWidth: '200px'
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#00ff00' }}>
        📊 Performance Monitor
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div>Nodes:</div>
        <div style={{ color: '#00ffff' }}>{nodeCount.toLocaleString()}</div>
        
        <div>Links:</div>
        <div style={{ color: '#00ffff' }}>{linkCount.toLocaleString()}</div>
        
        <div>Draw Calls:</div>
        <div style={{ color: metrics.drawCalls > 1000 ? '#ff6b6b' : '#4ecdc4' }}>
          {metrics.drawCalls.toLocaleString()}
        </div>
        
        <div>Triangles:</div>
        <div style={{ color: '#fff3a0' }}>{metrics.triangles.toLocaleString()}</div>
        
        <div>Geometries:</div>
        <div style={{ color: '#a8e6cf' }}>{metrics.geometries}</div>
        
        <div>Textures:</div>
        <div style={{ color: '#ffd3a5' }}>{metrics.textures}</div>
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
        💡 Stats.js panel shows FPS/MS in top-right
      </div>
    </div>
  );
}
