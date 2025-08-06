/**
 * Advanced Metrics Collection Utilities
 * Extracts maximum performance data from browser APIs
 */

export class AdvancedMetricsCollector {
  constructor() {
    this.observers = [];
    this.timers = [];
    this.setupAdvancedObservers();
  }

  setupAdvancedObservers() {
    // Long Task Observer (detects main thread blocking)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.onLongTask(entry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.onLayoutShift(entry);
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }
    }

    // Event Loop Lag Detection
    this.setupEventLoopLagDetection();

    // Memory Pressure Detection
    this.setupMemoryPressureDetection();
  }

  setupEventLoopLagDetection() {
    let lastTime = performance.now();

    const measureLag = () => {
      const now = performance.now();
      const lag = now - lastTime - 16; // Expected 16ms for 60fps

      if (lag > 0) {
        this.onEventLoopLag(lag);
      }

      lastTime = now;
      setTimeout(measureLag, 16);
    };

    measureLag();
  }

  setupMemoryPressureDetection() {
    if (performance.memory) {
      let lastHeapSize = performance.memory.usedJSHeapSize;

      const timer = setInterval(() => {
        const currentHeapSize = performance.memory.usedJSHeapSize;
        const delta = currentHeapSize - lastHeapSize;

        // Detect potential memory leaks
        if (delta > 1024 * 1024) { // > 1MB growth
          this.onMemoryGrowth(delta);
        }

        // Detect GC events (heap size decrease)
        if (delta < -1024 * 1024) { // > 1MB reduction
          this.onGarbageCollection(-delta);
        }

        lastHeapSize = currentHeapSize;
      }, 1000);

      this.timers.push(timer);
    }
  }

  // Event handlers (override these)
  onLongTask(entry) {
    console.log('🐌 Long task detected:', entry.duration + 'ms');
  }

  onLayoutShift(entry) {
    console.log('📐 Layout shift:', entry.value);
  }

  onEventLoopLag(lag) {
    if (lag > 50) { // Only log significant lag
      console.log('⏱️ Event loop lag:', lag + 'ms');
    }
  }

  onMemoryGrowth(bytes) {
    console.log('📈 Memory growth:', (bytes / 1024 / 1024).toFixed(1) + 'MB');
  }

  onGarbageCollection(bytes) {
    console.log('🗑️ Garbage collection:', (bytes / 1024 / 1024).toFixed(1) + 'MB freed');
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.timers.forEach(timer => clearInterval(timer));
  }
}

/**
 * Three.js Specific Performance Analysis
 */
export class ThreeJSProfiler {
  constructor() {
    this.frameStats = {
      drawCallHistory: [],
      triangleHistory: [],
      objectCounts: [],
      shaderSwitches: 0,
      lastShaderSwitch: null
    };
  }

  analyzeScene(scene) {
    const analysis = {
      totalObjects: 0,
      visibleObjects: 0,
      triangleCount: 0,
      materialCount: new Set(),
      geometryTypes: new Map(),
      lightCount: 0,
      complexityScore: 0
    };

    scene.traverse((object) => {
      analysis.totalObjects++;

      if (object.visible) {
        analysis.visibleObjects++;
      }

      if (object.isMesh) {
        if (object.geometry) {
          const positions = object.geometry.attributes.position;
          if (positions) {
            analysis.triangleCount += positions.count / 3;
          }

          const geomName = object.geometry.constructor.name;
          analysis.geometryTypes.set(geomName,
            (analysis.geometryTypes.get(geomName) || 0) + 1);
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => analysis.materialCount.add(mat.uuid));
          } else {
            analysis.materialCount.add(object.material.uuid);
          }
        }
      }

      if (object.isLight) {
        analysis.lightCount++;
      }
    });

    // Calculate complexity score
    analysis.complexityScore = this.calculateComplexityScore(analysis);

    return analysis;
  }

  calculateComplexityScore(analysis) {
    let score = 0;

    // Triangle complexity
    if (analysis.triangleCount > 100000) score += 50;
    else if (analysis.triangleCount > 10000) score += 25;
    else if (analysis.triangleCount > 1000) score += 10;

    // Object count complexity
    if (analysis.totalObjects > 1000) score += 30;
    else if (analysis.totalObjects > 100) score += 15;

    // Material switching complexity
    if (analysis.materialCount.size > 20) score += 20;
    else if (analysis.materialCount.size > 10) score += 10;

    return Math.min(100, score);
  }

  profileRenderer(renderer) {
    if (!renderer.info) return null;

    const info = renderer.info;
    const profile = {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      frame: info.render.frame,
      geometries: info.memory.geometries,
      textures: info.memory.textures
    };

    // Track draw call efficiency
    const efficiency = this.calculateRenderEfficiency(profile);
    profile.efficiency = efficiency;

    return profile;
  }

  calculateRenderEfficiency(profile) {
    // Efficiency based on triangles per draw call
    const trianglesPerCall = profile.triangles / Math.max(1, profile.drawCalls);

    if (trianglesPerCall > 1000) return 'Excellent';
    if (trianglesPerCall > 100) return 'Good';
    if (trianglesPerCall > 10) return 'Fair';
    return 'Poor';
  }

  detectBottlenecks(renderProfile, sceneAnalysis) {
    const bottlenecks = [];

    if (renderProfile.drawCalls > 100) {
      bottlenecks.push({
        type: 'draw-calls',
        severity: 'high',
        message: `Too many draw calls: ${renderProfile.drawCalls}`
      });
    }

    if (sceneAnalysis.triangleCount > 100000) {
      bottlenecks.push({
        type: 'geometry',
        severity: 'medium',
        message: `High triangle count: ${Math.round(sceneAnalysis.triangleCount)}`
      });
    }

    if (sceneAnalysis.materialCount.size > 20) {
      bottlenecks.push({
        type: 'materials',
        severity: 'medium',
        message: `Many materials: ${sceneAnalysis.materialCount.size}`
      });
    }

    return bottlenecks;
  }
}

/**
 * System Performance Monitor
 */
export class SystemPerformanceMonitor {
  constructor() {
    this.isSupported = this.checkSupport();
    this.data = {
      deviceMemory: navigator.deviceMemory || 'Unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
      connection: this.getConnectionInfo(),
      battery: null
    };

    this.setupBatteryMonitoring();
    this.setupConnectionMonitoring();
  }

  checkSupport() {
    return {
      memory: 'memory' in performance,
      deviceMemory: 'deviceMemory' in navigator,
      connection: 'connection' in navigator,
      battery: 'getBattery' in navigator
    };
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  async setupBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.data.battery = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        console.warn('Battery API not available');
      }
    }
  }

  setupConnectionMonitoring() {
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.data.connection = this.getConnectionInfo();
      });
    }
  }

  getSystemLoad() {
    // Estimate system load based on frame timing
    const loadEstimate = {
      cpu: 'Unknown',
      memory: 'Unknown',
      thermal: 'Unknown'
    };

    if (performance.memory) {
      const memoryRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      loadEstimate.memory = memoryRatio > 0.8 ? 'High' : memoryRatio > 0.5 ? 'Medium' : 'Low';
    }

    return loadEstimate;
  }
}

/**
 * Performance Comparison Tool
 */
export class PerformanceComparator {
  constructor() {
    this.snapshots = [];
  }

  takeSnapshot(label, metrics) {
    const snapshot = {
      label,
      timestamp: Date.now(),
      metrics: JSON.parse(JSON.stringify(metrics)),
      summary: this.generateSummary(metrics)
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  generateSummary(metrics) {
    return {
      avgFPS: this.average(metrics.frame?.fps || []),
      avgFrameTime: this.average(metrics.frame?.frameTime || []),
      avgDrawCalls: this.average(metrics.threejs?.drawCalls || []),
      avgTriangles: this.average(metrics.threejs?.triangles || []),
      avgMemory: this.average(metrics.javascript?.heapSize || [])
    };
  }

  compare(snapshot1Label, snapshot2Label) {
    const snap1 = this.snapshots.find(s => s.label === snapshot1Label);
    const snap2 = this.snapshots.find(s => s.label === snapshot2Label);

    if (!snap1 || !snap2) {
      throw new Error('Snapshots not found');
    }

    const comparison = {
      fps: {
        before: snap1.summary.avgFPS,
        after: snap2.summary.avgFPS,
        delta: snap2.summary.avgFPS - snap1.summary.avgFPS,
        improvement: ((snap2.summary.avgFPS - snap1.summary.avgFPS) / snap1.summary.avgFPS * 100).toFixed(1) + '%'
      },
      drawCalls: {
        before: snap1.summary.avgDrawCalls,
        after: snap2.summary.avgDrawCalls,
        delta: snap2.summary.avgDrawCalls - snap1.summary.avgDrawCalls,
        improvement: ((snap1.summary.avgDrawCalls - snap2.summary.avgDrawCalls) / snap1.summary.avgDrawCalls * 100).toFixed(1) + '%'
      },
      memory: {
        before: snap1.summary.avgMemory,
        after: snap2.summary.avgMemory,
        delta: snap2.summary.avgMemory - snap1.summary.avgMemory,
        improvement: ((snap1.summary.avgMemory - snap2.summary.avgMemory) / snap1.summary.avgMemory * 100).toFixed(1) + '%'
      }
    };

    return comparison;
  }

  average(array) {
    return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
  }
} 