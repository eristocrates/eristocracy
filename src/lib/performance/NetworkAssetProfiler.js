/**
 * Network Asset Performance Profiler
 * Monitors loading times and performance impact of external resources
 */
export class NetworkAssetProfiler {
  constructor() {
    this.assetMetrics = new Map();
    this.loadingTimeline = [];
    this.isMonitoring = false;
    this.performanceObserver = null;
    this.assetTypes = {
      image: /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i,
      texture: /\.(jpg|jpeg|png|gif|webp|bmp|hdr|exr)$/i,
      model: /\.(gltf|glb|obj|fbx|dae|ply|stl)$/i,
      audio: /\.(mp3|wav|ogg|m4a|aac)$/i,
      video: /\.(mp4|webm|mov|avi)$/i,
      font: /\.(woff|woff2|ttf|otf|eot)$/i,
      script: /\.js$/i,
      style: /\.css$/i,
      data: /\.(json|xml|csv|txt)$/i
    };

    this.initialize();
  }

  /**
   * Initialize asset monitoring
   */
  initialize() {
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Monitor existing navigation entries
    this.processExistingEntries();
  }

  /**
   * Setup PerformanceObserver for resource timing
   */
  setupPerformanceObserver() {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry);
          }
        }
      });

      this.performanceObserver.observe({
        entryTypes: ['resource', 'navigation']
      });

      this.isMonitoring = true;
      console.log('🌐 Network asset profiling started');
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }

  /**
   * Process existing performance entries
   */
  processExistingEntries() {
    const entries = performance.getEntriesByType('resource');
    entries.forEach(entry => this.processResourceEntry(entry));
  }

  /**
   * Process a resource timing entry
   */
  processResourceEntry(entry) {
    const url = entry.name;
    const assetType = this.detectAssetType(url);
    const size = entry.transferSize || entry.encodedBodySize || 0;

    const metrics = {
      url,
      type: assetType,
      size,
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        connection: entry.connectEnd - entry.connectStart,
        request: entry.responseStart - entry.requestStart,
        response: entry.responseEnd - entry.responseStart,
        total: entry.responseEnd - entry.startTime
      },
      caching: {
        fromCache: entry.transferSize === 0 && entry.encodedBodySize > 0,
        cacheStatus: this.determineCacheStatus(entry)
      },
      performance: {
        speed: size > 0 ? (size / entry.duration) * 1000 : 0, // bytes per second
        efficiency: this.calculateEfficiency(entry, size),
        rating: this.getRatingForAsset(entry.duration, size, assetType)
      },
      timestamp: entry.startTime,
      impact: this.calculatePerformanceImpact(entry, assetType, size)
    };

    this.assetMetrics.set(url, metrics);
    this.updateLoadingTimeline(metrics);
  }

  /**
   * Detect asset type from URL
   */
  detectAssetType(url) {
    for (const [type, regex] of Object.entries(this.assetTypes)) {
      if (regex.test(url)) {
        return type;
      }
    }

    // Check content type if available
    if (url.includes('data:image/')) return 'image';
    if (url.includes('blob:')) return 'blob';

    return 'other';
  }

  /**
   * Determine cache status
   */
  determineCacheStatus(entry) {
    if (entry.transferSize === 0 && entry.encodedBodySize > 0) {
      return 'hit';
    } else if (entry.transferSize > 0 && entry.transferSize < entry.encodedBodySize) {
      return 'partial';
    } else {
      return 'miss';
    }
  }

  /**
   * Calculate loading efficiency
   */
  calculateEfficiency(entry, size) {
    const totalTime = entry.responseEnd - entry.startTime;
    const networkTime = entry.responseEnd - entry.requestStart;

    // Efficiency based on actual transfer time vs total time
    const efficiency = networkTime > 0 ? (networkTime / totalTime) : 1;

    return Math.min(1, efficiency);
  }

  /**
   * Get performance rating for asset
   */
  getRatingForAsset(duration, size, assetType) {
    const sizeCategory = this.getSizeCategory(size);
    const typeExpectation = this.getTypeExpectation(assetType);

    // Adjust thresholds based on asset type and size
    const thresholds = {
      excellent: typeExpectation.excellent * sizeCategory.multiplier,
      good: typeExpectation.good * sizeCategory.multiplier,
      fair: typeExpectation.fair * sizeCategory.multiplier,
      poor: typeExpectation.poor * sizeCategory.multiplier
    };

    if (duration < thresholds.excellent) return 'excellent';
    if (duration < thresholds.good) return 'good';
    if (duration < thresholds.fair) return 'fair';
    if (duration < thresholds.poor) return 'poor';
    return 'terrible';
  }

  /**
   * Get size category multiplier
   */
  getSizeCategory(size) {
    if (size < 10 * 1024) return { category: 'tiny', multiplier: 0.5 };      // < 10KB
    if (size < 100 * 1024) return { category: 'small', multiplier: 1 };      // < 100KB
    if (size < 1024 * 1024) return { category: 'medium', multiplier: 2 };    // < 1MB
    if (size < 10 * 1024 * 1024) return { category: 'large', multiplier: 5 }; // < 10MB
    return { category: 'huge', multiplier: 10 };                             // > 10MB
  }

  /**
   * Get performance expectations by asset type
   */
  getTypeExpectation(assetType) {
    const expectations = {
      image: { excellent: 200, good: 500, fair: 1000, poor: 2000 },
      texture: { excellent: 300, good: 800, fair: 1500, poor: 3000 },
      model: { excellent: 500, good: 1500, fair: 3000, poor: 6000 },
      audio: { excellent: 300, good: 800, fair: 2000, poor: 5000 },
      video: { excellent: 1000, good: 3000, fair: 8000, poor: 15000 },
      font: { excellent: 100, good: 300, fair: 800, poor: 1500 },
      script: { excellent: 200, good: 500, fair: 1200, poor: 2500 },
      style: { excellent: 100, good: 300, fair: 800, poor: 1500 },
      data: { excellent: 100, good: 300, fair: 800, poor: 1500 },
      other: { excellent: 300, good: 800, fair: 1500, poor: 3000 }
    };

    return expectations[assetType] || expectations.other;
  }

  /**
   * Calculate performance impact
   */
  calculatePerformanceImpact(entry, assetType, size) {
    const loadTime = entry.responseEnd - entry.startTime;

    // Different asset types have different impact weights
    const impactWeights = {
      script: 3,    // Blocking
      style: 2.5,   // Render blocking
      font: 2,      // Layout affecting
      image: 1.5,   // Visual
      texture: 1.5, // Visual (3D)
      model: 2,     // Both loading and processing
      audio: 1,     // Background
      video: 1.5,   // Media
      data: 1.2,    // Processing
      other: 1
    };

    const weight = impactWeights[assetType] || 1;
    const sizeImpact = Math.log10(Math.max(size, 1)) / 6; // Normalize to 0-1
    const timeImpact = Math.min(loadTime / 5000, 1); // 5s = max impact

    return Math.round((weight * (sizeImpact + timeImpact)) * 100) / 100;
  }

  /**
   * Update loading timeline
   */
  updateLoadingTimeline(metrics) {
    this.loadingTimeline.push({
      timestamp: metrics.timestamp,
      url: metrics.url,
      type: metrics.type,
      duration: metrics.timing.total,
      size: metrics.size,
      rating: metrics.performance.rating
    });

    // Keep timeline manageable
    if (this.loadingTimeline.length > 200) {
      this.loadingTimeline.shift();
    }
  }

  /**
   * Get comprehensive analysis
   */
  getAnalysis() {
    return {
      summary: this.generateSummary(),
      byType: this.getAnalysisByType(),
      slowAssets: this.getSlowAssets(),
      cacheAnalysis: this.getCacheAnalysis(),
      recommendations: this.generateRecommendations(),
      timeline: this.getRecentTimeline(),
      networkScore: this.calculateNetworkScore()
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    const assets = Array.from(this.assetMetrics.values());

    if (assets.length === 0) {
      return { message: 'No network assets tracked yet' };
    }

    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const totalTime = assets.reduce((sum, asset) => sum + asset.timing.total, 0);
    const averageTime = totalTime / assets.length;

    const ratingCounts = assets.reduce((counts, asset) => {
      counts[asset.performance.rating] = (counts[asset.performance.rating] || 0) + 1;
      return counts;
    }, {});

    return {
      totalAssets: assets.length,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      averageLoadTime: Math.round(averageTime),
      ratingDistribution: ratingCounts,
      cacheHitRate: this.calculateCacheHitRate(assets),
      networkEfficiency: this.calculateNetworkEfficiency(assets)
    };
  }

  /**
   * Get analysis by asset type
   */
  getAnalysisByType() {
    const analysis = {};
    const assetsByType = new Map();

    // Group assets by type
    this.assetMetrics.forEach(asset => {
      if (!assetsByType.has(asset.type)) {
        assetsByType.set(asset.type, []);
      }
      assetsByType.get(asset.type).push(asset);
    });

    assetsByType.forEach((assets, type) => {
      const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
      const averageTime = assets.reduce((sum, asset) => sum + asset.timing.total, 0) / assets.length;
      const slowAssets = assets.filter(asset =>
        ['poor', 'terrible'].includes(asset.performance.rating)
      ).length;

      analysis[type] = {
        count: assets.length,
        totalSize,
        averageLoadTime: Math.round(averageTime),
        slowAssetCount: slowAssets,
        slowAssetPercentage: Math.round((slowAssets / assets.length) * 100),
        cacheHitRate: this.calculateCacheHitRate(assets),
        averageImpact: Math.round(
          assets.reduce((sum, asset) => sum + asset.impact, 0) / assets.length * 100
        ) / 100
      };
    });

    return analysis;
  }

  /**
   * Get slow loading assets
   */
  getSlowAssets(limit = 10) {
    const slowAssets = Array.from(this.assetMetrics.values())
      .filter(asset => ['poor', 'terrible'].includes(asset.performance.rating))
      .sort((a, b) => b.timing.total - a.timing.total)
      .slice(0, limit);

    return slowAssets.map(asset => ({
      url: asset.url,
      type: asset.type,
      size: asset.size,
      loadTime: asset.timing.total,
      rating: asset.performance.rating,
      impact: asset.impact,
      suggestions: this.getAssetOptimizationSuggestions(asset)
    }));
  }

  /**
   * Get cache analysis
   */
  getCacheAnalysis() {
    const assets = Array.from(this.assetMetrics.values());
    const cacheStats = {
      hits: 0,
      misses: 0,
      partial: 0
    };

    assets.forEach(asset => {
      cacheStats[asset.caching.cacheStatus]++;
    });

    const totalRequests = assets.length;

    return {
      hitRate: totalRequests > 0 ? Math.round((cacheStats.hits / totalRequests) * 100) : 0,
      missRate: totalRequests > 0 ? Math.round((cacheStats.misses / totalRequests) * 100) : 0,
      partialRate: totalRequests > 0 ? Math.round((cacheStats.partial / totalRequests) * 100) : 0,
      stats: cacheStats,
      recommendations: this.getCacheRecommendations(cacheStats, totalRequests)
    };
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate(assets) {
    if (assets.length === 0) return 0;

    const hits = assets.filter(asset => asset.caching.cacheStatus === 'hit').length;
    return Math.round((hits / assets.length) * 100);
  }

  /**
   * Calculate network efficiency
   */
  calculateNetworkEfficiency(assets) {
    if (assets.length === 0) return 0;

    const averageEfficiency = assets.reduce((sum, asset) =>
      sum + asset.performance.efficiency, 0) / assets.length;

    return Math.round(averageEfficiency * 100);
  }

  /**
   * Calculate overall network score
   */
  calculateNetworkScore() {
    const summary = this.generateSummary();
    if (summary.message) return 0;

    let score = 100;

    // Deduct for slow assets
    const slowPercentage = (summary.ratingDistribution.poor || 0) +
      (summary.ratingDistribution.terrible || 0);
    score -= (slowPercentage / summary.totalAssets) * 40;

    // Deduct for poor cache performance
    if (summary.cacheHitRate < 30) score -= 20;
    else if (summary.cacheHitRate < 60) score -= 10;

    // Deduct for large total size
    if (summary.totalSizeMB > 50) score -= 20;
    else if (summary.totalSizeMB > 20) score -= 10;

    // Deduct for slow average load time
    if (summary.averageLoadTime > 2000) score -= 15;
    else if (summary.averageLoadTime > 1000) score -= 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummary();
    const byType = this.getAnalysisByType();
    const slowAssets = this.getSlowAssets(5);

    // Overall recommendations
    if (summary.totalSizeMB > 20) {
      recommendations.push({
        type: 'size-optimization',
        severity: 'high',
        message: `Total asset size is ${summary.totalSizeMB}MB`,
        suggestion: 'Consider asset optimization, compression, or lazy loading'
      });
    }

    if (summary.cacheHitRate < 50) {
      recommendations.push({
        type: 'caching',
        severity: 'medium',
        message: `Cache hit rate is only ${summary.cacheHitRate}%`,
        suggestion: 'Implement better caching strategies or CDN'
      });
    }

    // Type-specific recommendations
    Object.entries(byType).forEach(([type, analysis]) => {
      if (analysis.slowAssetPercentage > 30) {
        recommendations.push({
          type: 'slow-asset-type',
          severity: 'medium',
          message: `${analysis.slowAssetPercentage}% of ${type} assets load slowly`,
          suggestion: this.getTypeSpecificSuggestion(type)
        });
      }
    });

    // Specific slow asset recommendations
    if (slowAssets.length > 0) {
      recommendations.push({
        type: 'slow-assets',
        severity: 'high',
        message: `${slowAssets.length} assets are loading very slowly`,
        suggestion: 'Optimize or replace slowest loading assets',
        assets: slowAssets.map(asset => asset.url)
      });
    }

    return recommendations;
  }

  /**
   * Get type-specific optimization suggestions
   */
  getTypeSpecificSuggestion(type) {
    const suggestions = {
      image: 'Optimize images with compression, WebP format, or responsive images',
      texture: 'Use compressed texture formats (DXT, ASTC) or reduce resolution',
      model: 'Optimize geometry, use GLTF with Draco compression',
      audio: 'Use compressed formats (MP3, OGG) and consider streaming',
      video: 'Use appropriate codecs, multiple formats, and adaptive streaming',
      font: 'Use font subsetting and WOFF2 format',
      script: 'Minify, compress, and consider code splitting',
      style: 'Minify CSS and remove unused styles',
      data: 'Compress JSON/XML data and consider pagination'
    };

    return suggestions[type] || 'Optimize asset size and loading strategy';
  }

  /**
   * Get asset-specific optimization suggestions
   */
  getAssetOptimizationSuggestions(asset) {
    const suggestions = [];

    if (asset.size > 1024 * 1024) { // > 1MB
      suggestions.push('Consider reducing file size or using compression');
    }

    if (asset.caching.cacheStatus === 'miss') {
      suggestions.push('Implement caching headers for better cache performance');
    }

    if (asset.timing.dns > 100) {
      suggestions.push('DNS lookup is slow - consider DNS prefetching');
    }

    if (asset.timing.connection > 200) {
      suggestions.push('Connection time is high - consider connection preloading');
    }

    return suggestions;
  }

  /**
   * Get cache recommendations
   */
  getCacheRecommendations(stats, total) {
    const recommendations = [];

    const hitRate = Math.round((stats.hits / total) * 100);

    if (hitRate < 30) {
      recommendations.push('Implement aggressive caching strategies');
      recommendations.push('Consider using a CDN for static assets');
    } else if (hitRate < 60) {
      recommendations.push('Improve cache headers and TTL settings');
    }

    if (stats.misses > stats.hits) {
      recommendations.push('Too many cache misses - review caching policy');
    }

    return recommendations;
  }

  /**
   * Get recent timeline data
   */
  getRecentTimeline(limit = 20) {
    return this.loadingTimeline.slice(-limit);
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.assetMetrics.clear();
    this.loadingTimeline = [];
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.isMonitoring = false;
      console.log('🌐 Network asset profiling stopped');
    }
  }
} 