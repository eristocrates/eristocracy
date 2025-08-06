import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

// 🔬 COMPREHENSIVE PERFORMANCE PROFILER
const PerformanceProfiler = forwardRef(({ 
  renderer, 
  scene, 
  camera, 
  data, 
  renderStats, 
  geometryParams, 
  isVisible = true 
}, ref) => {
  const [stats, setStats] = useState({
    fps: 0,
    frameTime: 0,
    cpuTime: 0,
    gpuTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    renderCalls: 0,
    // WebGL-specific stats
    bufferMemory: 0,
    textureMemory: 0,
    // Custom metrics
    nodeCount: 0,
    linkCount: 0,
    visibleNodes: 0,
    culledNodes: 0,
    updateQueue: 0,
    // Timing breakdown
    timings: {
      physics: 0,
      culling: 0,
      instancing: 0,
      rendering: 0,
      updates: 0
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const profileRef = useRef({
    frameCount: 0,
    lastTime: performance.now(),
    frameStart: 0,
    timingAccumulator: {
      physics: 0,
      culling: 0,
      instancing: 0,
      rendering: 0,
      updates: 0
    },
    sampleCount: 0
  });

  const webglExtensionsRef = useRef({
    timerQuery: null,
    memoryInfo: null,
    debugRendererInfo: null
  });

  // Timing cache for performance measurements
  const timingCacheRef = useRef({});

  // Initialize WebGL extensions for detailed profiling
  useEffect(() => {
    if (!renderer) return;

    const gl = renderer.getContext();
    const ext = webglExtensionsRef.current;

    // Timer query extension for GPU timing
    ext.timerQuery = gl.getExtension('EXT_disjoint_timer_query_webgl2') || 
                     gl.getExtension('EXT_disjoint_timer_query');

    // Memory info extension
    ext.memoryInfo = gl.getExtension('WEBGL_debug_renderer_info');

    // Debug renderer info
    ext.debugRendererInfo = gl.getExtension('WEBGL_debug_renderer_info');

    console.log('🔬 Performance Profiler Extensions:', {
      timerQuery: !!ext.timerQuery,
      memoryInfo: !!ext.memoryInfo,
      debugRendererInfo: !!ext.debugRendererInfo
    });
  }, [renderer]);

  // Expose timing methods to parent component
  useImperativeHandle(ref, () => ({
    startTiming: (category) => {
      const startTime = performance.now();
      timingCacheRef.current[category] = startTime;
      return startTime;
    },
    endTiming: (category, startTime) => {
      const endTime = performance.now();
      const actualStartTime = startTime || timingCacheRef.current[category] || endTime;
      const duration = endTime - actualStartTime;
      
      // Update timing stats
      setStats(prev => ({
        ...prev,
        timings: {
          ...prev.timings,
          [category]: duration
        }
      }));
      
      return duration;
    }
  }), []);

  // Main profiling loop
  useEffect(() => {
    if (!renderer || !isVisible) return;

    let animationId;
    const profile = profileRef.current;
    const ext = webglExtensionsRef.current;

    const runProfiler = (currentTime) => {
      profile.frameCount++;
      
      // Calculate frame timing
      const frameTime = currentTime - profile.frameStart;
      profile.frameStart = currentTime;

      // Update stats every 500ms
      if (currentTime - profile.lastTime >= 500) {
        const deltaTime = currentTime - profile.lastTime;
        const fps = Math.round((profile.frameCount * 1000) / deltaTime);
        
        // Get renderer info
        const info = renderer.info;
        
        // Get memory usage
        const memoryUsage = performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
        } : { used: 0, total: 0, limit: 0 };

        // WebGL memory estimation
        const bufferMemory = estimateBufferMemory(scene);
        const textureMemory = estimateTextureMemory(scene);

        // Scene analysis
        const sceneStats = analyzeScene(scene, data);

        // Calculate average timings
        const avgTimings = {};
        Object.keys(profile.timingAccumulator).forEach(key => {
          avgTimings[key] = profile.sampleCount > 0 ? 
            Math.round(profile.timingAccumulator[key] / profile.sampleCount * 100) / 100 : 0;
        });

        setStats({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          cpuTime: Math.round((frameTime - (avgTimings.rendering || 0)) * 100) / 100,
          gpuTime: avgTimings.rendering || 0,
          memoryUsage: memoryUsage.used,
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
          renderCalls: info.render.calls,
          bufferMemory: Math.round(bufferMemory / 1048576 * 100) / 100, // MB
          textureMemory: Math.round(textureMemory / 1048576 * 100) / 100, // MB
          nodeCount: sceneStats.nodeCount,
          linkCount: sceneStats.linkCount,
          visibleNodes: sceneStats.visibleNodes,
          culledNodes: sceneStats.culledNodes,
          updateQueue: sceneStats.updateQueue,
          timings: avgTimings
        });

        // Reset counters
        profile.frameCount = 0;
        profile.lastTime = currentTime;
        profile.sampleCount = 0;
        Object.keys(profile.timingAccumulator).forEach(key => {
          profile.timingAccumulator[key] = 0;
        });
      }

      animationId = requestAnimationFrame(runProfiler);
    };

    animationId = requestAnimationFrame(runProfiler);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [renderer, scene, camera, data, isVisible]);

  // Timing utilities for external use
  const startTiming = (category) => {
    return performance.now();
  };

  const endTiming = (category, startTime) => {
    const duration = performance.now() - startTime;
    const profile = profileRef.current;
    profile.timingAccumulator[category] += duration;
    profile.sampleCount++;
    return duration;
  };

  // Scene analysis helper
  const analyzeScene = (scene, data) => {
    let nodeCount = 0;
    let linkCount = 0;
    let visibleNodes = 0;
    let culledNodes = 0;
    let updateQueue = 0;

    if (data) {
      nodeCount = data.nodes?.length || 0;
      linkCount = data.links?.length || 0;
    }

    // Traverse scene to count visible objects
    scene.traverse((object) => {
      if (object.userData && object.userData.nodeId) {
        if (object.visible) {
          visibleNodes++;
        } else {
          culledNodes++;
        }
      }
      if (object.userData && object.userData.needsUpdate) {
        updateQueue++;
      }
    });

    return { nodeCount, linkCount, visibleNodes, culledNodes, updateQueue };
  };

  // Memory estimation helpers
  const estimateBufferMemory = (scene) => {
    let totalBytes = 0;
    scene.traverse((object) => {
      if (object.geometry) {
        const geom = object.geometry;
        for (const attributeName in geom.attributes) {
          const attribute = geom.attributes[attributeName];
          totalBytes += attribute.array.byteLength;
        }
        if (geom.index) {
          totalBytes += geom.index.array.byteLength;
        }
      }
    });
    return totalBytes;
  };

  const estimateTextureMemory = (scene) => {
    let totalBytes = 0;
    const textures = new Set();
    
    scene.traverse((object) => {
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          Object.values(material).forEach(value => {
            if (value && value.isTexture && !textures.has(value)) {
              textures.add(value);
              // Rough estimation: width * height * 4 bytes per pixel
              const image = value.image;
              if (image && image.width && image.height) {
                totalBytes += image.width * image.height * 4;
              }
            }
          });
        });
      }
    });
    
    return totalBytes;
  };

  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.critical) return '#ff4757';
    if (value >= thresholds.warning) return '#ffa502';
    return '#2ed573';
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(0,0,0,0.95)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 2000,
      minWidth: '320px',
      maxWidth: '400px',
      maxHeight: '90vh',
      overflowY: 'auto',
      border: '1px solid #333',
      boxShadow: '0 4px 12px rgba(0,0,0,0.8)'
    }}>
      {/* Header with collapse toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isCollapsed ? '0' : '10px',
        cursor: 'pointer',
        padding: '5px 0'
      }} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          🔬 PERFORMANCE PROFILER
        </div>
        <div style={{ fontSize: '14px' }}>
          {isCollapsed ? '▶' : '▼'}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Core Performance Metrics */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#74b9ff' }}>
              ⚡ CORE METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Nodes: {stats.nodeCount.toLocaleString()}</div>
              <div>Links: {stats.linkCount.toLocaleString()}</div>
              <div>Triples: {data?.tripleCount?.toLocaleString() || 'N/A'}</div>
              <div>Vertices/Node: {renderStats?.verticesPerNode || 0}</div>
              <div>Total Vertices: {renderStats?.totalVertices?.toLocaleString() || 0}</div>
              <div style={{ color: stats.fps < 30 ? '#ff6b6b' : stats.fps < 60 ? '#ffd93d' : '#6bcf7f' }}>
                FPS: {stats.fps}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#ffd93d' }}>
              📊 CORE METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div style={{ color: getPerformanceColor(stats.fps, { warning: 45, critical: 30 }) }}>
                FPS: {stats.fps}
              </div>
              <div style={{ color: getPerformanceColor(stats.frameTime, { warning: 16.7, critical: 33.3 }) }}>
                Frame: {stats.frameTime}ms
              </div>
              <div>CPU: {stats.cpuTime}ms</div>
              <div>GPU: {stats.gpuTime}ms</div>
            </div>
          </div>

          {/* Rendering Statistics */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#6c5ce7' }}>
              🎨 RENDERING
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div style={{ color: getPerformanceColor(stats.drawCalls, { warning: 100, critical: 1000 }) }}>
                Draw Calls: {stats.drawCalls.toLocaleString()}
              </div>
              <div>Triangles: {stats.triangles.toLocaleString()}</div>
              <div>Geometries: {stats.geometries}</div>
              <div>Textures: {stats.textures}</div>
            </div>
          </div>

          {/* Memory Usage */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#fd79a8' }}>
              💾 MEMORY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div style={{ color: getPerformanceColor(stats.memoryUsage, { warning: 100, critical: 500 }) }}>
                JS Heap: {stats.memoryUsage}MB
              </div>
              <div>Buffers: {stats.bufferMemory}MB</div>
              <div>Textures: {stats.textureMemory}MB</div>
              <div>Total GPU: {(stats.bufferMemory + stats.textureMemory).toFixed(1)}MB</div>
            </div>
          </div>

          {/* Scene Analysis */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#00cec9' }}>
              🌐 SCENE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Nodes: {stats.nodeCount.toLocaleString()}</div>
              <div>Links: {stats.linkCount.toLocaleString()}</div>
              <div style={{ color: getPerformanceColor(stats.culledNodes / Math.max(stats.visibleNodes + stats.culledNodes, 1) * 100, { warning: 20, critical: 50 }) }}>
                Visible: {stats.visibleNodes.toLocaleString()}
              </div>
              <div>Culled: {stats.culledNodes.toLocaleString()}</div>
            </div>
          </div>

          {/* Optimization Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#74b9ff' }}>
              🚀 OPTIMIZATIONS
            </div>
            
            {/* PHASE 1 PERFORMANCE STATS */}
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(116,185,255,0.1)', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#74b9ff' }}>PHASE 1 OPTIMIZATIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
                <div style={{ color: renderStats?.gpuInstancing ? '#2ed573' : '#ff4757' }}>
                  GPU Instancing: {renderStats?.gpuInstancing ? '✅' : '❌'}
                </div>
                <div style={{ color: renderStats?.customShaders ? '#2ed573' : '#ff4757' }}>
                  Custom Shaders: {renderStats?.customShaders ? '✅' : '❌'}
                </div>
                <div style={{ color: renderStats?.cpuMatrixUpdates ? '#ff4757' : '#2ed573' }}>
                  CPU Matrix Updates: {renderStats?.cpuMatrixUpdates ? '❌' : '✅'}
                </div>
                <div style={{ color: renderStats?.verticesPerNode <= 12 ? '#2ed573' : '#ffa502' }}>
                  Low-poly Geometry: {renderStats?.verticesPerNode <= 12 ? '✅' : '❌'}
                </div>
                <div>
                  Vertices per node: {renderStats?.verticesPerNode || 0}
                </div>
                <div style={{ color: renderStats?.totalVertices > 100000 ? '#ffa502' : '#2ed573' }}>
                  Total vertices: {renderStats?.totalVertices?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* PHASE 2 PERFORMANCE STATS */}
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(0,188,212,0.1)', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#00bcd4' }}>PHASE 2 OPTIMIZATIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
                <div style={{ color: geometryParams?.frustumCullingEnabled ? '#2ed573' : '#ff4757' }}>
                  Frustum Culling: {geometryParams?.frustumCullingEnabled ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.lodEnabled ? '#2ed573' : '#ff4757' }}>
                  Distance LOD: {geometryParams?.lodEnabled ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.adaptiveLodEnabled ? '#2ed573' : '#ff4757' }}>
                  Adaptive LOD: {geometryParams?.adaptiveLodEnabled ? '✅' : '❌'}
                </div>
                <div>
                  LOD Factor: {data?.performanceStats?.adaptiveLodFactor?.toFixed(2) || '1.00'}
                </div>
                <div>
                  Frame Time: {stats?.frameTime?.toFixed(1) || '0.0'}ms
                </div>
              </div>
            </div>

            {/* PHASE 3 PERFORMANCE STATS */}
            <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(156,39,176,0.1)', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#9c27b0' }}>PHASE 3 OPTIMIZATIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
                <div style={{ color: geometryParams?.memoryPoolOptimization ? '#2ed573' : '#ff4757' }}>
                  Memory Pools: {geometryParams?.memoryPoolOptimization ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.spatialPartitioning ? '#2ed573' : '#ff4757' }}>
                  Spatial Octree: {geometryParams?.spatialPartitioning ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.instanceAttributeStreaming ? '#2ed573' : '#ff4757' }}>
                  Attribute Streaming: {geometryParams?.instanceAttributeStreaming ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.temporalFrameSmoothing ? '#2ed573' : '#ff4757' }}>
                  Temporal Smoothing: {geometryParams?.temporalFrameSmoothing ? '✅' : '❌'}
                </div>
                <div style={{ color: geometryParams?.asyncUpdateEnabled ? '#2ed573' : '#ff4757' }}>
                  Async Processing: {geometryParams?.asyncUpdateEnabled ? '✅' : '❌'}
                </div>
                <div>
                  Active Chunks: {data?.streamingState?.visibleChunks?.size || 0}
                </div>
                <div>
                  Update Queue: {data?.streamingState?.updateQueue?.length || 0}
                </div>
                <div>
                  Low-Freq Nodes: {data?.temporalSmoothing?.lowFrequencyNodes?.size || 0}
                </div>
              </div>
            </div>

            {/* Base Geometry and Material Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
              <div style={{ color: geometryParams?.baseType === 'icosahedron' ? '#2ed573' : '#ffa502' }}>
                Base Type: {geometryParams?.baseType || 'unknown'}
              </div>
              <div style={{ color: geometryParams?.materialType === 'shader' ? '#2ed573' : geometryParams?.materialType === 'basic' ? '#2ed573' : '#ffa502' }}>
                Material: {geometryParams?.materialType || 'unknown'}
              </div>
            </div>
          </div>

          {/* Timing Breakdown */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#fd79a8' }}>
              ⏱️ TIMING BREAKDOWN
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Physics: {stats.timings.physics}ms</div>
              <div>Culling: {stats.timings.culling}ms</div>
              <div>Instancing: {stats.timings.instancing}ms</div>
              <div>Rendering: {stats.timings.rendering}ms</div>
              <div>Updates: {stats.timings.updates}ms</div>
              <div>Queue: {stats.updateQueue}</div>
            </div>
          </div>

          {/* Performance Recommendations */}
          {(stats.fps < 45 || stats.drawCalls > 1000 || stats.memoryUsage > 200) && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px', 
              background: 'rgba(255, 71, 87, 0.2)', 
              borderRadius: '4px',
              border: '1px solid #ff4757'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff4757' }}>
                ⚠️ PERFORMANCE ALERTS
              </div>
              {stats.fps < 45 && <div>• Low FPS detected</div>}
              {stats.drawCalls > 1000 && <div>• Excessive draw calls</div>}
              {stats.memoryUsage > 200 && <div>• High memory usage</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
});

// Export timing utilities for use in main component
export const createPerformanceTimer = (profilerRef) => {
  return {
    timeStart: (category) => performance.now(),
    timeEnd: (category, startTime) => {
      if (profilerRef.current && profilerRef.current.endTiming) {
        return profilerRef.current.endTiming(category, startTime);
      }
      return performance.now() - (startTime || 0);
    }
  };
};

export default PerformanceProfiler;
