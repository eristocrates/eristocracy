/**
 * Interaction & Event Handler Performance Profiler
 * Monitors input latency and event handler overhead
 */
export class InteractionProfiler {
  constructor(options = {}) {
    this.options = {
      trackEvents: ['click', 'mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'scroll', 'resize'],
      historyLength: 100,
      warningThreshold: 16, // 16ms = 1 frame at 60fps
      ...options
    };

    this.eventMetrics = new Map();
    this.inputLatencyHistory = [];
    this.isTracking = false;
    this.pendingEvents = new Map();

    this.initializeTracking();
  }

  /**
   * Initialize event tracking
   */
  initializeTracking() {
    this.options.trackEvents.forEach(eventType => {
      this.eventMetrics.set(eventType, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        recentDurations: [],
        slowEvents: [],
        frameImpact: 0
      });
    });
  }

  /**
   * Start profiling interactions
   */
  startProfiling(targetElement = document) {
    if (this.isTracking) return;

    this.isTracking = true;
    this.targetElement = targetElement;

    // Add event listeners for tracking
    this.options.trackEvents.forEach(eventType => {
      const handler = this.createEventHandler(eventType);
      this.targetElement.addEventListener(eventType, handler, {
        passive: false,
        capture: true
      });

      // Store handler for cleanup
      if (!this.eventHandlers) this.eventHandlers = new Map();
      this.eventHandlers.set(eventType, handler);
    });

    // Track frame timing for input latency correlation
    this.startFrameTracking();

    console.log('🎮 Interaction profiling started');
  }

  /**
   * Stop profiling
   */
  stopProfiling() {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Remove event listeners
    if (this.eventHandlers) {
      this.eventHandlers.forEach((handler, eventType) => {
        this.targetElement.removeEventListener(eventType, handler, { capture: true });
      });
      this.eventHandlers.clear();
    }

    this.stopFrameTracking();

    console.log('🎮 Interaction profiling stopped');
  }

  /**
   * Create event handler with timing
   */
  createEventHandler(eventType) {
    return (event) => {
      const startTime = performance.now();
      const eventId = `${eventType}-${Date.now()}-${Math.random()}`;

      // Track event start
      this.pendingEvents.set(eventId, {
        type: eventType,
        startTime,
        event: {
          type: event.type,
          target: event.target.tagName || 'unknown',
          timestamp: event.timeStamp
        }
      });

      // Measure after current call stack
      requestAnimationFrame(() => {
        this.measureEventCompletion(eventId, startTime, eventType);
      });
    };
  }

  /**
   * Measure event completion and impact
   */
  measureEventCompletion(eventId, startTime, eventType) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const pendingEvent = this.pendingEvents.get(eventId);
    if (!pendingEvent) return;

    this.pendingEvents.delete(eventId);

    // Update metrics
    const metrics = this.eventMetrics.get(eventType);
    if (!metrics) return;

    metrics.count++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.count;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);

    // Keep recent durations for trending
    metrics.recentDurations.push(duration);
    if (metrics.recentDurations.length > this.options.historyLength) {
      metrics.recentDurations.shift();
    }

    // Track slow events
    if (duration > this.options.warningThreshold) {
      metrics.slowEvents.push({
        duration,
        timestamp: endTime,
        details: pendingEvent.event
      });

      // Keep only recent slow events
      if (metrics.slowEvents.length > 20) {
        metrics.slowEvents.shift();
      }
    }

    // Calculate frame impact
    metrics.frameImpact = duration > 16.67 ? Math.ceil(duration / 16.67) : 0;

    // Track input latency for input events
    if (['mousedown', 'keydown', 'click'].includes(eventType)) {
      this.trackInputLatency(duration, eventType);
    }
  }

  /**
   * Track input latency specifically
   */
  trackInputLatency(handlerDuration, eventType) {
    const latencyData = {
      eventType,
      handlerDuration,
      timestamp: performance.now(),
      rating: this.getLatencyRating(handlerDuration)
    };

    this.inputLatencyHistory.push(latencyData);

    // Keep history manageable
    if (this.inputLatencyHistory.length > this.options.historyLength) {
      this.inputLatencyHistory.shift();
    }
  }

  /**
   * Get latency rating
   */
  getLatencyRating(duration) {
    if (duration < 8) return 'excellent';   // < 8ms
    if (duration < 16) return 'good';       // < 16ms (1 frame)
    if (duration < 32) return 'fair';       // < 32ms (2 frames)
    if (duration < 100) return 'poor';      // < 100ms
    return 'terrible';                      // > 100ms
  }

  /**
   * Start frame tracking for correlation
   */
  startFrameTracking() {
    let lastFrameTime = performance.now();

    const trackFrame = () => {
      if (!this.isTracking) return;

      const currentTime = performance.now();
      const frameDuration = currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      // Store frame timing for correlation
      this.lastFrameDuration = frameDuration;

      requestAnimationFrame(trackFrame);
    };

    requestAnimationFrame(trackFrame);
  }

  /**
   * Stop frame tracking
   */
  stopFrameTracking() {
    // Frame tracking stops automatically when isTracking = false
  }

  /**
   * Get comprehensive analysis
   */
  getAnalysis() {
    const analysis = {
      summary: this.generateSummary(),
      eventMetrics: this.getEventMetricsAnalysis(),
      inputLatency: this.getInputLatencyAnalysis(),
      recommendations: this.generateRecommendations(),
      responsiveness: this.calculateResponsivenessScore()
    };

    return analysis;
  }

  /**
   * Generate summary
   */
  generateSummary() {
    let totalEvents = 0;
    let totalDuration = 0;
    let slowEventCount = 0;

    this.eventMetrics.forEach(metrics => {
      totalEvents += metrics.count;
      totalDuration += metrics.totalDuration;
      slowEventCount += metrics.slowEvents.length;
    });

    const averageDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;

    return {
      totalEvents,
      averageHandlerDuration: Math.round(averageDuration * 100) / 100,
      slowEventCount,
      slowEventPercentage: totalEvents > 0 ? Math.round((slowEventCount / totalEvents) * 100) : 0,
      isResponsive: averageDuration < this.options.warningThreshold
    };
  }

  /**
   * Get detailed event metrics analysis
   */
  getEventMetricsAnalysis() {
    const analysis = {};

    this.eventMetrics.forEach((metrics, eventType) => {
      if (metrics.count === 0) return;

      analysis[eventType] = {
        count: metrics.count,
        averageDuration: Math.round(metrics.averageDuration * 100) / 100,
        maxDuration: Math.round(metrics.maxDuration * 100) / 100,
        minDuration: Math.round(metrics.minDuration * 100) / 100,
        slowEventCount: metrics.slowEvents.length,
        frameImpact: metrics.frameImpact,
        trend: this.calculateTrend(metrics.recentDurations),
        performance: this.getEventPerformanceRating(metrics.averageDuration)
      };
    });

    return analysis;
  }

  /**
   * Get input latency analysis
   */
  getInputLatencyAnalysis() {
    if (this.inputLatencyHistory.length === 0) {
      return { message: 'No input events tracked yet' };
    }

    const recentLatency = this.inputLatencyHistory.slice(-20); // Last 20 inputs
    const averageLatency = recentLatency.reduce((sum, item) => sum + item.handlerDuration, 0) / recentLatency.length;

    const ratingCounts = recentLatency.reduce((counts, item) => {
      counts[item.rating] = (counts[item.rating] || 0) + 1;
      return counts;
    }, {});

    return {
      averageLatency: Math.round(averageLatency * 100) / 100,
      recentEvents: recentLatency.length,
      ratingDistribution: ratingCounts,
      overallRating: this.getLatencyRating(averageLatency),
      worstLatency: Math.max(...recentLatency.map(item => item.handlerDuration))
    };
  }

  /**
   * Calculate trend from recent durations
   */
  calculateTrend(durations) {
    if (durations.length < 5) return 'insufficient-data';

    const recentAvg = durations.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const olderAvg = durations.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;

    if (recentAvg > olderAvg * 1.2) return 'degrading';
    if (recentAvg < olderAvg * 0.8) return 'improving';
    return 'stable';
  }

  /**
   * Get event performance rating
   */
  getEventPerformanceRating(averageDuration) {
    if (averageDuration < 4) return 'excellent';
    if (averageDuration < 8) return 'good';
    if (averageDuration < 16) return 'fair';
    if (averageDuration < 32) return 'poor';
    return 'terrible';
  }

  /**
   * Calculate overall responsiveness score
   */
  calculateResponsivenessScore() {
    const summary = this.generateSummary();
    const inputAnalysis = this.getInputLatencyAnalysis();

    let score = 100;

    // Deduct for slow events
    score -= summary.slowEventPercentage * 2;

    // Deduct for high average duration
    if (summary.averageHandlerDuration > 16) score -= 30;
    else if (summary.averageHandlerDuration > 8) score -= 15;

    // Deduct for poor input latency
    if (inputAnalysis.overallRating === 'terrible') score -= 40;
    else if (inputAnalysis.overallRating === 'poor') score -= 25;
    else if (inputAnalysis.overallRating === 'fair') score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummary();
    const eventAnalysis = this.getEventMetricsAnalysis();

    // High-level recommendations
    if (summary.slowEventPercentage > 10) {
      recommendations.push({
        type: 'slow-events',
        severity: 'high',
        message: `${summary.slowEventPercentage}% of events are slow (>${this.options.warningThreshold}ms)`,
        suggestion: 'Consider debouncing frequent events or optimizing handler logic'
      });
    }

    // Specific event type recommendations
    Object.entries(eventAnalysis).forEach(([eventType, metrics]) => {
      if (metrics.averageDuration > 32) {
        recommendations.push({
          type: 'slow-event-type',
          severity: 'high',
          message: `${eventType} handlers average ${metrics.averageDuration}ms`,
          suggestion: `Optimize ${eventType} event handlers or use requestIdleCallback for heavy work`
        });
      }

      if (metrics.trend === 'degrading') {
        recommendations.push({
          type: 'performance-degradation',
          severity: 'medium',
          message: `${eventType} performance is degrading over time`,
          suggestion: 'Check for memory leaks or accumulating DOM listeners'
        });
      }
    });

    // Input latency recommendations
    const inputAnalysis = this.getInputLatencyAnalysis();
    if (inputAnalysis.overallRating === 'poor' || inputAnalysis.overallRating === 'terrible') {
      recommendations.push({
        type: 'input-latency',
        severity: 'high',
        message: `Input latency is ${inputAnalysis.overallRating} (${inputAnalysis.averageLatency}ms average)`,
        suggestion: 'Reduce work in input event handlers and consider passive event listeners'
      });
    }

    return recommendations;
  }

  /**
   * Get real-time metrics for dashboard
   */
  getRealTimeMetrics() {
    const summary = this.generateSummary();
    const inputAnalysis = this.getInputLatencyAnalysis();

    return {
      responsiveness: this.calculateResponsivenessScore(),
      averageLatency: inputAnalysis.averageLatency || 0,
      slowEventPercentage: summary.slowEventPercentage,
      totalEvents: summary.totalEvents,
      isResponsive: summary.isResponsive,
      currentRating: inputAnalysis.overallRating || 'unknown'
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.eventMetrics.clear();
    this.inputLatencyHistory = [];
    this.pendingEvents.clear();
    this.initializeTracking();
  }
} 