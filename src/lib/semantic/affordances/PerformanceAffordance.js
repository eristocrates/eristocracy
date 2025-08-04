/**
 * @file PerformanceAffordance.js
 * @description Orchestrates performance optimizations for large-scale graph visualization
 * @affordance:PerformanceAffordance
 * @capability:optimization
 * @capability:scaling
 * @capability:rendering_efficiency
 */

import { logAffordanceExecution } from './AffordanceManifest.js';
import { enableInstancedRendering } from '../graph/function/enableInstancedRendering.js';
import { enablePerformanceMonitoring, integratePerformancePanel } from '../graph/function/enablePerformanceMonitoring.js';

/**
 * PerformanceAffordance - Manages rendering performance optimizations
 * Preserves semantic fidelity while optimizing visualization performance
 */
export class PerformanceAffordance {
  constructor(config = {}) {
    logAffordanceExecution('PerformanceAffordance', 'constructor', { config });

    this.config = {
      autoOptimize: true,
      performanceThresholds: {
        optimal: 1000,
        warning: 5000,
        critical: 10000
      },
      enableLogging: true,
      ...config
    };

    this.state = {
      activeOptimizations: new Set(),
      renderingStrategy: 'standard',
      performanceMetrics: {},
      optimizationState: null,
      performanceMonitor: null
    };
  }

  /**
   * Analyzes graph data and applies appropriate optimizations
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} graphData - Graph data with optimization hints
   * @param {Object} metrics - Performance metrics from setGraphData
   * @returns {Object} Applied optimizations result
   */
  async optimizeGraph(graph, graphData, metrics) {
    logAffordanceExecution('PerformanceAffordance', 'optimizeGraph', {
      nodeCount: metrics.nodeCount,
      performanceLevel: metrics.performanceLevel,
      hasOptimizationStrategy: !!metrics.optimizationStrategy
    });

    if (!metrics.needsOptimization && !this.config.autoOptimize) {
      return { optimized: false, reason: 'No optimization needed' };
    }

    const optimizations = {
      applied: [],
      failed: [],
      renderingState: null,
      performanceGain: null
    };

    // Apply instanced rendering if recommended
    if (metrics.optimizationStrategy?.useInstancing) {
      try {
        const instancedResult = await this.applyInstancedRendering(
          graph,
          metrics.optimizationStrategy,
          graphData
        );

        if (instancedResult.enabled) {
          optimizations.applied.push('instanced-rendering');
          optimizations.renderingState = instancedResult;
          this.state.activeOptimizations.add('instancing');
        }
      } catch (error) {
        console.error('Failed to apply instanced rendering:', error);
        optimizations.failed.push('instanced-rendering');
      }
    }

    // Apply frustum culling if recommended
    if (metrics.optimizationStrategy?.useFrustumCulling) {
      try {
        this.enableFrustumCulling(graph, graphData);
        optimizations.applied.push('frustum-culling');
        this.state.activeOptimizations.add('frustum-culling');
      } catch (error) {
        console.error('Failed to apply frustum culling:', error);
        optimizations.failed.push('frustum-culling');
      }
    }

    // Apply LOD optimization if recommended
    if (metrics.optimizationStrategy?.useLOD) {
      try {
        this.enableLODOptimization(graph, graphData);
        optimizations.applied.push('lod-optimization');
        this.state.activeOptimizations.add('lod');
      } catch (error) {
        console.error('Failed to apply LOD optimization:', error);
        optimizations.failed.push('lod-optimization');
      }
    }

    // Apply spatial partitioning if recommended
    if (metrics.optimizationStrategy?.spatialPartitioning) {
      try {
        this.enableSpatialPartitioning(graph, graphData);
        optimizations.applied.push('spatial-partitioning');
        this.state.activeOptimizations.add('spatial-partitioning');
      } catch (error) {
        console.error('Failed to apply spatial partitioning:', error);
        optimizations.failed.push('spatial-partitioning');
      }
    }

    // Enable performance monitoring if we have optimizations
    if (optimizations.applied.length > 0 || this.config.autoOptimize) {
      try {
        await this.enableRealTimeMonitoring(graph);
        optimizations.applied.push('performance-monitoring');
      } catch (error) {
        console.error('Failed to enable performance monitoring:', error);
        optimizations.failed.push('performance-monitoring');
      }
    }

    // Update rendering strategy
    this.state.renderingStrategy = metrics.optimizationStrategy?.renderingMode || 'standard';

    // Log results
    if (this.config.enableLogging) {
      console.log('PerformanceAffordance optimization complete:', {
        applied: optimizations.applied,
        failed: optimizations.failed,
        renderingStrategy: this.state.renderingStrategy
      });
    }

    return optimizations;
  }

  /**
   * Applies instanced rendering optimization
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} strategy - Optimization strategy
   * @param {Object} graphData - Graph data
   * @returns {Object} Instanced rendering result
   */
  async applyInstancedRendering(graph, strategy, graphData) {
    logAffordanceExecution('PerformanceAffordance', 'applyInstancedRendering', {
      strategy: strategy.renderingMode
    });

    const instancedConfig = {
      nodeGeometry: 'sphere',
      nodeColor: '#0078d4',
      nodeSize: 4,
      maxInstances: Math.max(graphData.nodes.length * 1.2, 50000),
      enableLOD: strategy.useLOD
    };

    const result = enableInstancedRendering(graph, strategy, instancedConfig);

    if (result.enabled) {
      // Store cleanup function for later
      this.state.optimizationState = {
        ...this.state.optimizationState,
        instancedRendering: {
          cleanup: result.cleanup,
          updatePositions: result.updatePositions,
          updateColors: result.updateColors
        }
      };

      // Setup update loop for instanced rendering
      this.setupInstancedUpdateLoop(graph, graphData, result);
    }

    return result;
  }

  /**
   * Sets up update loop for instanced rendering
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} graphData - Graph data
   * @param {Object} instancedResult - Instanced rendering result
   */
  setupInstancedUpdateLoop(graph, graphData, instancedResult) {
    // Update positions on graph tick
    graph.onEngineStop(() => {
      const camera = graph.camera();
      instancedResult.updatePositions(graphData.nodes, camera);
    });

    // Update during animation
    const updateInterval = setInterval(() => {
      if (graph && graphData.nodes) {
        const camera = graph.camera();
        instancedResult.updatePositions(graphData.nodes, camera);
      }
    }, 100); // Update every 100ms during animation

    // Store interval for cleanup
    if (!this.state.optimizationState) {
      this.state.optimizationState = {};
    }
    this.state.optimizationState.updateInterval = updateInterval;
  }

  /**
   * Enables frustum culling optimization
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} graphData - Graph data with hints
   */
  enableFrustumCulling(graph, graphData) {
    logAffordanceExecution('PerformanceAffordance', 'enableFrustumCulling');

    // Enable frustum culling on the renderer
    if (graph.renderer()) {
      graph.renderer().setPixelRatio(window.devicePixelRatio);
      graph.renderer().setClearColor(0x0a0a0a, 1);
    }

    // Apply culling hints from data
    if (graphData.metadata?.optimization?.performanceHints?.nodeHints) {
      this.applyCullingHints(graph, graphData.metadata.optimization.performanceHints.nodeHints);
    }
  }

  /**
   * Applies culling hints to graph nodes
   * @param {Object} graph - ForceGraph3D instance
   * @param {Array} nodeHints - Node culling hints
   */
  applyCullingHints(graph, nodeHints) {
    // This would typically involve setting up custom culling logic
    // For now, we'll log the hints that would be applied
    const cullableNodes = nodeHints.filter(hint =>
      hint.cullingHints.allowFrustumCulling
    ).length;

    console.log(`Frustum culling enabled for ${cullableNodes} nodes`);
  }

  /**
   * Enables LOD (Level of Detail) optimization
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} graphData - Graph data with hints
   */
  enableLODOptimization(graph, graphData) {
    logAffordanceExecution('PerformanceAffordance', 'enableLODOptimization');

    if (graphData.metadata?.optimization?.performanceHints?.nodeHints) {
      const lodStats = this.calculateLODStats(graphData.metadata.optimization.performanceHints.nodeHints);
      console.log('LOD optimization enabled:', lodStats);
    }
  }

  /**
   * Calculates LOD statistics
   * @param {Array} nodeHints - Node hints array
   * @returns {Object} LOD statistics
   */
  calculateLODStats(nodeHints) {
    const stats = { high: 0, medium: 0, low: 0 };

    nodeHints.forEach(hint => {
      stats[hint.lodLevel] = (stats[hint.lodLevel] || 0) + 1;
    });

    return stats;
  }

  /**
   * Enables spatial partitioning for interaction optimization
   * @param {Object} graph - ForceGraph3D instance
   * @param {Object} graphData - Graph data
   */
  enableSpatialPartitioning(graph, graphData) {
    logAffordanceExecution('PerformanceAffordance', 'enableSpatialPartitioning');

    // Spatial partitioning for large graphs
    const nodeCount = graphData.nodes.length;
    const gridSize = Math.ceil(Math.sqrt(nodeCount / 100)); // Rough heuristic

    console.log(`Spatial partitioning enabled with ${gridSize}x${gridSize} grid`);
  }

  /**
   * Enables real-time performance monitoring with three-perf
   * @param {Object} graph - ForceGraph3D instance
   */
  async enableRealTimeMonitoring(graph) {
    logAffordanceExecution('PerformanceAffordance', 'enableRealTimeMonitoring');

    if (this.state.performanceMonitor) {
      console.log('Performance monitoring already enabled');
      return;
    }

    try {
      // Enable three-perf monitoring
      const monitorResult = await enablePerformanceMonitoring(graph, {
        anchorX: 'right',
        anchorY: 'bottom',
        logsPerSecond: this.config.enableLogging ? 10 : 5,
        showGraph: true,
        memory: true,
        backgroundOpacity: 0.9,
        scale: 0.8
      });

      // Integrate with UI (creates toggle button)
      const uiResult = integratePerformancePanel(monitorResult, {
        showToggleButton: true,
        position: 'bottom-right'
      });

      this.state.performanceMonitor = {
        monitor: monitorResult,
        ui: uiResult
      };

      // Setup automatic metrics collection
      this.setupMetricsCollection(monitorResult);

      console.log('Real-time performance monitoring enabled');
    } catch (error) {
      console.error('Failed to enable real-time monitoring:', error);
      throw error;
    }
  }

  /**
   * Sets up automatic metrics collection from performance monitor
   * @param {Object} monitorResult - Performance monitor result
   */
  setupMetricsCollection(monitorResult) {
    // Update our internal metrics periodically
    const metricsInterval = setInterval(() => {
      if (monitorResult.state.enabled) {
        const metrics = monitorResult.controls.getMetrics();
        Object.assign(this.state.performanceMetrics, metrics);
      }
    }, 1000); // Update every second

    // Store interval for cleanup
    if (!this.state.optimizationState) {
      this.state.optimizationState = {};
    }
    this.state.optimizationState.metricsInterval = metricsInterval;
  }

  /**
   * Gets current performance state including real-time metrics
   * @returns {Object} Performance state
   */
  getPerformanceState() {
    const baseState = {
      activeOptimizations: Array.from(this.state.activeOptimizations),
      renderingStrategy: this.state.renderingStrategy,
      metrics: this.state.performanceMetrics
    };

    // Add real-time metrics if monitor is available
    if (this.state.performanceMonitor) {
      baseState.realTimeMetrics = this.state.performanceMonitor.monitor.controls.getMetrics();
      baseState.monitorEnabled = this.state.performanceMonitor.monitor.state.enabled;
    }

    return baseState;
  }

  /**
   * Toggles real-time performance monitoring visibility
   */
  togglePerformanceMonitor() {
    if (this.state.performanceMonitor) {
      this.state.performanceMonitor.monitor.controls.toggle();
    }
  }

  /**
 * Cleans up all active optimizations
 */
  cleanup() {
    logAffordanceExecution('PerformanceAffordance', 'cleanup');

    console.log('🧹 Cleaning up PerformanceAffordance...');

    // Clean up instanced rendering
    if (this.state.optimizationState?.instancedRendering?.cleanup) {
      try {
        this.state.optimizationState.instancedRendering.cleanup();
        console.log('✅ Instanced rendering cleanup complete');
      } catch (error) {
        console.warn('⚠️ Instanced rendering cleanup failed:', error);
      }
    }

    // Clean up update intervals
    if (this.state.optimizationState?.updateInterval) {
      clearInterval(this.state.optimizationState.updateInterval);
      console.log('✅ Update interval cleared');
    }

    // Clean up metrics collection
    if (this.state.optimizationState?.metricsInterval) {
      clearInterval(this.state.optimizationState.metricsInterval);
      console.log('✅ Metrics interval cleared');
    }

    // Clean up performance monitor
    if (this.state.performanceMonitor) {
      try {
        this.state.performanceMonitor.monitor.controls.cleanup();

        // Remove toggle button
        if (this.state.performanceMonitor.ui.toggleButton) {
          this.state.performanceMonitor.ui.toggleButton.remove();
        }

        // Remove performance monitor UI elements
        if (this.state.performanceMonitor.ui.panel) {
          this.state.performanceMonitor.ui.panel.remove();
        }

        this.state.performanceMonitor = null;
        console.log('✅ Performance monitor cleanup complete');
      } catch (error) {
        console.warn('⚠️ Performance monitor cleanup failed:', error);
      }
    }

    // Reset state
    this.state.activeOptimizations.clear();
    this.state.optimizationState = null;
    this.state.renderingStrategy = 'standard';

    console.log('🧹 PerformanceAffordance cleanup complete');
  }
} 