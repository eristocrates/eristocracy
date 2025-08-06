/**
 * @file RealTimePerformanceMonitor.js
 * @description Real-time performance monitoring for kinesthetic parameter feedback
 * Live FPS, draw calls, triangle count with parameter impact correlation
 */

import * as d3 from 'd3';
import { curveMonotoneX } from 'd3-shape';

export class RealTimePerformanceMonitor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      updateInterval: 250, // Update every 250ms for smooth feedback
      historyLength: 60,   // Keep 60 samples (15 seconds at 250ms intervals)
      thresholds: {
        fps: { good: 60, warning: 45, critical: 30 },
        drawCalls: { good: 50, warning: 200, critical: 1000 },
        triangles: { good: 50000, warning: 200000, critical: 500000 }
      },
      ...options
    };

    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0
    };

    this.history = {
      fps: [],
      drawCalls: [],
      triangles: [],
      frameTime: []
    };

    this.callbacks = {
      onStatsUpdate: null,
      onPerformanceAlert: null
    };

    this.isRunning = false;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.renderer = null;

    this.initializeUI();
  }

  /**
   * Initialize the performance monitoring UI
   */
  initializeUI() {
    const monitor = d3.select(this.container).append('div')
      .attr('class', 'performance-monitor')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('border', '1px solid #333')
      .style('border-radius', '6px')
      .style('padding', '12px')
      .style('margin-bottom', '12px')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Header
    monitor.append('div')
      .attr('class', 'monitor-header')
      .style('font-weight', 'bold')
      .style('margin-bottom', '8px')
      .style('color', '#74b9ff')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .html('📊 REAL-TIME PERFORMANCE <span class="monitor-status">●</span>');

    // Core metrics display
    const metricsContainer = monitor.append('div')
      .attr('class', 'metrics-container')
      .style('display', 'grid')
      .style('grid-template-columns', '1fr 1fr')
      .style('gap', '8px')
      .style('margin-bottom', '8px');

    // FPS indicator
    const fpsIndicator = metricsContainer.append('div')
      .attr('class', 'fps-indicator')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px');

    fpsIndicator.append('span')
      .style('font-weight', 'bold')
      .text('FPS:');

    fpsIndicator.append('span')
      .attr('class', 'fps-value')
      .style('font-weight', 'bold')
      .style('color', '#00b894')
      .text('--');

    // Frame time indicator
    const frameTimeIndicator = metricsContainer.append('div')
      .attr('class', 'frametime-indicator')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px');

    frameTimeIndicator.append('span')
      .style('font-weight', 'bold')
      .text('Frame:');

    frameTimeIndicator.append('span')
      .attr('class', 'frametime-value')
      .style('font-weight', 'bold')
      .style('color', '#ffeaa7')
      .text('--ms');

    // Draw calls indicator
    const drawCallsIndicator = metricsContainer.append('div')
      .attr('class', 'drawcalls-indicator')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px');

    drawCallsIndicator.append('span')
      .style('font-weight', 'bold')
      .text('Draws:');

    drawCallsIndicator.append('span')
      .attr('class', 'drawcalls-value')
      .style('font-weight', 'bold')
      .style('color', '#6c5ce7')
      .text('--');

    // Triangles indicator  
    const trianglesIndicator = metricsContainer.append('div')
      .attr('class', 'triangles-indicator')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px');

    trianglesIndicator.append('span')
      .style('font-weight', 'bold')
      .text('Tris:');

    trianglesIndicator.append('span')
      .attr('class', 'triangles-value')
      .style('font-weight', 'bold')
      .style('color', '#fd79a8')
      .text('--');

    // Performance delta display (for parameter changes)
    this.deltaDisplay = monitor.append('div')
      .attr('class', 'performance-delta')
      .style('text-align', 'center')
      .style('font-size', '9px')
      .style('height', '12px')
      .style('color', '#888')
      .style('margin-bottom', '6px');

    // Mini performance graph
    this.createMiniGraph(monitor);

    // Performance budget bar
    this.createPerformanceBudgetBar(monitor);
  }

  /**
   * Create mini real-time performance graph
   */
  createMiniGraph(container) {
    const graphContainer = container.append('div')
      .attr('class', 'mini-graph-container')
      .style('margin-bottom', '8px');

    const svg = graphContainer.append('svg')
      .attr('width', 280)
      .attr('height', 40)
      .style('background', 'rgba(255,255,255,0.05)')
      .style('border-radius', '3px');

    // FPS line
    this.fpsLine = d3.line()
      .x((d, i) => i * (280 / this.options.historyLength))
      .y(d => 40 - (d / 120) * 40) // Scale 0-120 FPS to 40-0 pixels
      .curve(d3.curveMonotoneX);

    this.fpsPath = svg.append('path')
      .attr('class', 'fps-line')
      .style('fill', 'none')
      .style('stroke', '#00b894')
      .style('stroke-width', 1.5);

    // Target FPS line (60fps)
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', 280)
      .attr('y1', 40 - (60 / 120) * 40)
      .attr('y2', 40 - (60 / 120) * 40)
      .style('stroke', '#74b9ff')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.5);

    // Graph labels
    svg.append('text')
      .attr('x', 4)
      .attr('y', 12)
      .style('font-size', '8px')
      .style('fill', '#888')
      .text('120');

    svg.append('text')
      .attr('x', 4)
      .attr('y', 36)
      .style('font-size', '8px')
      .style('fill', '#888')
      .text('0');
  }

  /**
   * Create performance budget visualization
   */
  createPerformanceBudgetBar(container) {
    const budgetContainer = container.append('div')
      .attr('class', 'budget-container')
      .style('margin-bottom', '4px');

    budgetContainer.append('div')
      .style('font-size', '9px')
      .style('color', '#888')
      .style('margin-bottom', '3px')
      .text('16.67ms Frame Budget');

    const budgetBar = budgetContainer.append('div')
      .attr('class', 'budget-bar')
      .style('width', '100%')
      .style('height', '6px')
      .style('background', '#333')
      .style('border-radius', '3px')
      .style('position', 'relative');

    this.budgetFill = budgetBar.append('div')
      .attr('class', 'budget-fill')
      .style('height', '100%')
      .style('background', '#00b894')
      .style('border-radius', '3px')
      .style('width', '0%')
      .style('transition', 'width 0.2s ease, background-color 0.2s ease');
  }

  /**
   * Start monitoring with ForceGraph3D renderer
   */
  start(graphInstance) {
    if (!graphInstance) {
      console.warn('RealTimePerformanceMonitor: No graph instance provided');
      return;
    }

    this.renderer = graphInstance.renderer();
    if (!this.renderer) {
      console.warn('RealTimePerformanceMonitor: No renderer available');
      return;
    }

    this.isRunning = true;
    this.updateLoop();

    // Update status indicator
    d3.select(this.container).select('.monitor-status')
      .style('color', '#00b894')
      .text('●');

    console.log('🔬 Real-time performance monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false;

    // Update status indicator
    d3.select(this.container).select('.monitor-status')
      .style('color', '#fd79a8')
      .text('○');

    console.log('🔬 Real-time performance monitoring stopped');
  }

  /**
   * Main update loop
   */
  updateLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.frameCount++;

    // Update every interval
    if (currentTime - this.lastTime >= this.options.updateInterval) {
      this.updateStats(currentTime);
      this.updateUI();
      this.lastTime = currentTime;
      this.frameCount = 0;
    }

    requestAnimationFrame(() => this.updateLoop());
  }

  /**
   * Update performance statistics
   */
  updateStats(currentTime) {
    const deltaTime = currentTime - this.lastTime;

    // Calculate FPS
    this.stats.fps = Math.round((this.frameCount * 1000) / deltaTime);
    this.stats.frameTime = parseFloat((deltaTime / this.frameCount).toFixed(2));

    // Get renderer info
    if (this.renderer && this.renderer.info) {
      const info = this.renderer.info;
      this.stats.drawCalls = info.render.calls || 0;
      this.stats.triangles = info.render.triangles || 0;

      // Track dramatic changes for nuclear optimizations
      if (this.history.drawCalls.length > 0) {
        const lastDrawCalls = this.history.drawCalls[this.history.drawCalls.length - 1];
        const reduction = lastDrawCalls - this.stats.drawCalls;

        // Log significant draw call reductions (likely from nuclear optimization)
        if (reduction > 10000) {
          console.log(`🚀 MASSIVE DRAW CALL REDUCTION: ${lastDrawCalls} → ${this.stats.drawCalls} (${reduction} fewer calls!)`);
          this.showNuclearImpact(lastDrawCalls, this.stats.drawCalls);
        }
      }
    }

    // Memory usage
    if (performance.memory) {
      this.stats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }

    // Update history
    this.updateHistory();

    // Trigger callbacks
    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate(this.stats);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts();
  }

  /**
   * Show nuclear optimization impact
   */
  showNuclearImpact(before, after) {
    const reduction = before - after;
    const percentReduction = Math.round((reduction / before) * 100);

    this.deltaDisplay
      .text(`💀 NUCLEAR: ${percentReduction}% draw call reduction!`)
      .style('color', '#00b894')
      .style('font-weight', 'bold')
      .style('font-size', '10px')
      .transition()
      .delay(5000)
      .style('color', '#888')
      .style('font-weight', 'normal')
      .style('font-size', '9px')
      .text('');
  }

  /**
   * Update performance history
   */
  updateHistory() {
    Object.keys(this.history).forEach(metric => {
      this.history[metric].push(this.stats[metric]);
      if (this.history[metric].length > this.options.historyLength) {
        this.history[metric].shift();
      }
    });
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const container = d3.select(this.container);

    // Update FPS
    container.select('.fps-value')
      .text(this.stats.fps)
      .style('color', this.getThresholdColor('fps', this.stats.fps));

    // Update frame time
    container.select('.frametime-value')
      .text(`${this.stats.frameTime}ms`)
      .style('color', this.getFrameTimeColor(this.stats.frameTime));

    // Update draw calls
    container.select('.drawcalls-value')
      .text(this.formatNumber(this.stats.drawCalls))
      .style('color', this.getThresholdColor('drawCalls', this.stats.drawCalls));

    // Update triangles
    container.select('.triangles-value')
      .text(this.formatNumber(this.stats.triangles))
      .style('color', this.getThresholdColor('triangles', this.stats.triangles));

    // Update mini graph
    if (this.fpsPath && this.history.fps.length > 1) {
      this.fpsPath.datum(this.history.fps)
        .attr('d', this.fpsLine);
    }

    // Update performance budget bar
    if (this.budgetFill) {
      const budgetPercent = Math.min(100, (this.stats.frameTime / 16.67) * 100);
      const budgetColor = budgetPercent > 100 ? '#fd79a8' :
        budgetPercent > 80 ? '#ffeaa7' : '#00b894';

      this.budgetFill
        .style('width', `${budgetPercent}%`)
        .style('background', budgetColor);
    }
  }

  /**
   * Show parameter change impact
   */
  showParameterImpact(parameterName, expectedImpact, delta) {
    let impactText = '';
    let impactColor = '#888';

    switch (expectedImpact) {
      case 'vertices':
      case 'exponential_vertices':
        const vertexDelta = Math.round(delta * 1000);
        impactText = `${delta > 0 ? '+' : ''}${vertexDelta} vertices`;
        impactColor = delta > 0 ? '#fd79a8' : '#00b894';
        break;
      case 'draw_calls':
        impactText = delta > 0 ? '↑ More draw calls' : '↓ Fewer draw calls';
        impactColor = delta > 0 ? '#fd79a8' : '#00b894';
        break;
      default:
        impactText = `${parameterName}: ${delta > 0 ? '↑' : '↓'}`;
        impactColor = delta > 0 ? '#ffeaa7' : '#00b894';
    }

    this.deltaDisplay
      .text(impactText)
      .style('color', impactColor)
      .style('font-weight', 'bold')
      .transition()
      .delay(3000)
      .style('color', '#888')
      .style('font-weight', 'normal')
      .text('');
  }

  /**
   * Check for performance alerts
   */
  checkPerformanceAlerts() {
    const alerts = [];

    if (this.stats.fps < this.options.thresholds.fps.critical) {
      alerts.push({ type: 'fps', severity: 'critical', value: this.stats.fps });
    } else if (this.stats.fps < this.options.thresholds.fps.warning) {
      alerts.push({ type: 'fps', severity: 'warning', value: this.stats.fps });
    }

    if (this.stats.drawCalls > this.options.thresholds.drawCalls.critical) {
      alerts.push({ type: 'drawCalls', severity: 'critical', value: this.stats.drawCalls });
    }

    if (alerts.length > 0 && this.callbacks.onPerformanceAlert) {
      this.callbacks.onPerformanceAlert(alerts);
    }
  }

  /**
   * Get color based on performance threshold
   */
  getThresholdColor(metric, value) {
    const thresholds = this.options.thresholds[metric];
    if (!thresholds) return '#888';

    if (metric === 'fps') {
      if (value >= thresholds.good) return '#00b894';
      if (value >= thresholds.warning) return '#ffeaa7';
      return '#fd79a8';
    } else {
      if (value <= thresholds.good) return '#00b894';
      if (value <= thresholds.warning) return '#ffeaa7';
      return '#fd79a8';
    }
  }

  /**
   * Get frame time color (16.67ms = 60fps target)
   */
  getFrameTimeColor(frameTime) {
    if (frameTime <= 16.67) return '#00b894';
    if (frameTime <= 22.22) return '#ffeaa7'; // 45fps
    return '#fd79a8';
  }

  /**
   * Format large numbers
   */
  formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Set callbacks for external integration
   */
  onStatsUpdate(callback) {
    this.callbacks.onStatsUpdate = callback;
  }

  onPerformanceAlert(callback) {
    this.callbacks.onPerformanceAlert = callback;
  }

  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get performance history
   */
  getHistory() {
    return { ...this.history };
  }
}

export default RealTimePerformanceMonitor; 