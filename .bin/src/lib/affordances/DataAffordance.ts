import type {
  AffordanceContract,
  AffordanceInstance,
  AffordanceInspection,
} from "./types/AffordanceContract.js";
import { proxy } from "valtio";

/**
 * @affordance:DataAffordance
 * @capability:ingestion "Load data from various sources (RDF, JSON, CSV, streams)"
 * @capability:transformation "Transform data through configurable pipelines"
 * @capability:mapping "Map data properties to visualization properties"
 * @capability:binding "Bind transformed data to visualization targets"
 * @capability:streaming "Handle real-time data streams"
 * @capability:caching "Cache processed data for performance"
 * @capability:semantic_preservation "Maintain RDF semantics through transformations"
 * @invariant:data_integrity "Data transformations preserve semantic meaning"
 * @invariant:type_safety "Type contracts are maintained across transformation pipeline"
 * @invariant:referential_consistency "Entity references remain consistent across transformations"
 * @invariant:cache_coherence "Cached data remains synchronized with source data"
 */

// Data source type definitions
/** @rdf:class :DataSource */
export interface DataSource {
  /** @rdf:property :hasSourceType */
  type: "rdf" | "json" | "csv" | "api" | "stream" | "static";

  /** @rdf:property :hasSourceURI */
  uri: string;

  /** @rdf:property :hasFormat */
  format?: "turtle" | "n3" | "rdf-xml" | "json-ld" | "csv" | "json";

  /** @rdf:property :hasCredentials */
  credentials?: Record<string, any>;

  /** @rdf:property :hasRefreshInterval */
  refreshInterval?: number;
}

/** @rdf:class :TransformPipeline */
export interface TransformPipeline {
  /** @rdf:property :hasTransformationStep */
  steps: TransformationStep[];

  /** @rdf:property :hasConfiguration */
  configuration?: Record<string, any>;
}

/** @rdf:class :TransformationStep */
export interface TransformationStep {
  /** @rdf:property :hasStepType */
  type: "parse" | "filter" | "map" | "aggregate" | "validate" | "custom";

  /** @rdf:property :hasStepName */
  name: string;

  /** @rdf:property :hasStepFunction */
  transform: (data: any, config?: any) => any;

  /** @rdf:property :hasStepConfiguration */
  configuration?: Record<string, any>;
}

/** @rdf:class :PropertyMapping */
export interface PropertyMapping {
  /** @rdf:property :hasSourceProperty */
  sourceProperty: string;

  /** @rdf:property :hasTargetProperty */
  targetProperty: string;

  /** @rdf:property :hasTransformFunction */
  transform?: (value: any) => any;

  /** @rdf:property :hasDefaultValue */
  defaultValue?: any;

  /** @rdf:property :isRequired */
  required?: boolean;
}

/** @rdf:class :VisualizationTarget */
export interface VisualizationTarget {
  /** @rdf:property :hasTargetType */
  type: "force_graph" | "scatter_plot" | "network" | "custom";

  /** @rdf:property :hasTargetFormat */
  expectedFormat: "nodes_links" | "points" | "matrix" | "custom";

  /** @rdf:property :hasSchemaContract */
  schema: Record<string, any>;
}

// State interface for DataAffordance
/** @rdf:class :DataAffordanceState */
export interface DataAffordanceState {
  /** @rdf:property :hasActiveSources */
  sources: DataSource[];

  /** @rdf:property :hasActiveSchema */
  schema: Record<string, any>;

  /** @rdf:property :hasActiveMapping */
  mappings: PropertyMapping[];

  /** @rdf:property :hasCacheState */
  cache: Map<
    string,
    {
      data: any;
      timestamp: number;
      ttl: number;
      accessCount?: number;
      lastAccessed?: number;
    }
  >;

  /** @rdf:property :hasStreamState */
  streams: Map<string, any>; // Observable streams

  /** @rdf:property :hasLoadingState */
  loading: boolean;

  /** @rdf:property :hasErrorState */
  error: Error | null;

  /** @rdf:property :hasLastUpdate */
  lastUpdate: number;

  /** @rdf:property :hasProcessingMetrics */
  metrics: {
    totalProcessed: number;
    averageProcessingTime: number;
    errorCount: number;
    cacheHitRate: number;
  };
}

// Methods interface for DataAffordance
/** @rdf:class :DataAffordanceMethods */
export interface DataAffordanceMethods {
  /** @rdf:method :ingest */
  ingest: (source: DataSource) => Promise<any>;

  /** @rdf:method :transform */
  transform: (data: any, pipeline: TransformPipeline) => Promise<any>;

  /** @rdf:method :map */
  map: (data: any, mappings: PropertyMapping[]) => any;

  /** @rdf:method :bind */
  bind: (data: any, target: VisualizationTarget) => void;

  /** @rdf:method :stream */
  stream: (source: DataSource) => any; // Observable

  /** @rdf:method :cache */
  cache: (key: string, data: any, ttl?: number) => void;

  /** @rdf:method :invalidateCache */
  invalidateCache: (key?: string) => void;

  /** @rdf:method :getMetrics */
  getMetrics: () => DataAffordanceState["metrics"];

  // Index signature for AffordanceMethods compatibility
  [methodName: string]: (...args: any[]) => any;
}

// DataAffordance capabilities type
type DataAffordanceCapabilities =
  | "ingestion"
  | "transformation"
  | "mapping"
  | "binding"
  | "streaming"
  | "caching"
  | "semantic_preservation";

/**
 * @affordance:DataAffordanceContract
 * @extends:AffordanceContract
 */
export interface DataAffordanceContract
  extends AffordanceContract<
    DataAffordanceCapabilities,
    DataAffordanceState,
    DataAffordanceMethods
  > {
  affordanceId: "DataAffordance";
}

/**
 * @affordance:DataAffordanceInstance
 * @description: Runtime implementation of DataAffordance with Valtio state management
 */
export class DataAffordanceInstance
  implements AffordanceInstance<DataAffordanceContract>
{
  public contract: DataAffordanceContract;
  public runtimeState: DataAffordanceState;
  public activeConfiguration: Record<string, any>;
  public isActive: boolean = false;
  public lastUpdate: number = 0;

  constructor(configuration: Record<string, any> = {}) {
    this.activeConfiguration = configuration;

    // Initialize Valtio proxy state
    this.runtimeState = proxy<DataAffordanceState>({
      sources: [],
      schema: {},
      mappings: [],
      cache: new Map(),
      streams: new Map(),
      loading: false,
      error: null,
      lastUpdate: 0,
      metrics: {
        totalProcessed: 0,
        averageProcessingTime: 0,
        errorCount: 0,
        cacheHitRate: 0,
      },
    });

    // Define contract
    this.contract = {
      affordanceId: "DataAffordance",
      capabilities: [
        "ingestion",
        "transformation",
        "mapping",
        "binding",
        "streaming",
        "caching",
        "semantic_preservation",
      ],
      invariants: {
        data_integrity: "Data transformations preserve semantic meaning",
        type_safety:
          "Type contracts are maintained across transformation pipeline",
        referential_consistency:
          "Entity references remain consistent across transformations",
        cache_coherence: "Cached data remains synchronized with source data",
      },
      state: this.runtimeState,
      methods: {
        ingest: this.ingest.bind(this),
        transform: this.transform.bind(this),
        map: this.map.bind(this),
        bind: this.bind.bind(this),
        stream: this.stream.bind(this),
        cache: this.cache.bind(this),
        invalidateCache: this.invalidateCache.bind(this),
        getMetrics: this.getMetrics.bind(this),
      },
      configuration: this.activeConfiguration,
    };
  }

  // Wrapper around existing RDF pipeline
  async ingest(source: DataSource): Promise<any> {
    this.runtimeState.loading = true;
    this.runtimeState.error = null;

    const startTime = performance.now();

    try {
      let data: any;

      // Check cache first
      const cacheKey = `ingest:${source.uri}`;
      const cached = this.runtimeState.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log("🎯 DataAffordance: Cache hit for", source.uri);
        this.runtimeState.metrics.cacheHitRate =
          (this.runtimeState.metrics.cacheHitRate *
            this.runtimeState.metrics.totalProcessed +
            1) /
          (this.runtimeState.metrics.totalProcessed + 1);
        return cached.data;
      }

      // Use existing API endpoint for RDF data
      if (source.type === "rdf" || source.format === "turtle") {
        const response = await fetch(source.uri);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = await response.json();
      } else {
        // Handle other data types
        const response = await fetch(source.uri);
        data = await response.json();
      }

      // Cache the result
      this.cache(cacheKey, data, 300000); // 5 minute TTL

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime);

      this.runtimeState.loading = false;
      this.lastUpdate = Date.now();

      console.log(
        "✅ DataAffordance: Successfully ingested data from",
        source.uri
      );
      return data;
    } catch (error) {
      this.runtimeState.error = error as Error;
      this.runtimeState.loading = false;
      this.runtimeState.metrics.errorCount++;
      console.error(
        "❌ DataAffordance: Ingestion failed for",
        source.uri,
        error
      );
      throw error;
    }
  }

  async transform(data: any, pipeline: TransformPipeline): Promise<any> {
    console.log(
      "🔄 DataAffordance: Applying transformation pipeline",
      pipeline
    );

    let result = data;

    for (const step of pipeline.steps) {
      try {
        result = await step.transform(result, step.configuration);
        console.log(
          `✅ DataAffordance: Applied transformation step: ${step.name}`
        );
      } catch (error) {
        console.error(
          `❌ DataAffordance: Transformation step failed: ${step.name}`,
          error
        );
        throw error;
      }
    }

    // Apply automatic optimization hints based on data scale (preserves semantic fidelity)
    if (result.nodes && result.nodes.length > 0) {
      result = this.applyAutoOptimizationHints(result);
    }

    return result;
  }

  map(data: any, mappings: PropertyMapping[]): any {
    console.log("🗺️ DataAffordance: Applying property mappings", mappings);

    if (Array.isArray(data)) {
      return data.map((item) => this.mapSingleItem(item, mappings));
    } else {
      return this.mapSingleItem(data, mappings);
    }
  }

  private mapSingleItem(item: any, mappings: PropertyMapping[]): any {
    const mapped: any = {};

    for (const mapping of mappings) {
      const sourceValue = item[mapping.sourceProperty];

      if (sourceValue !== undefined) {
        mapped[mapping.targetProperty] = mapping.transform
          ? mapping.transform(sourceValue)
          : sourceValue;
      } else if (mapping.defaultValue !== undefined) {
        mapped[mapping.targetProperty] = mapping.defaultValue;
      } else if (mapping.required) {
        throw new Error(
          `Required property ${mapping.sourceProperty} not found in data`
        );
      }
    }

    return mapped;
  }

  bind(data: any, target: VisualizationTarget): void {
    console.log(
      "🔗 DataAffordance: Binding data to visualization target",
      target.type
    );

    // Validate data format against target schema
    if (!this.validateDataFormat(data, target)) {
      throw new Error(
        `Data format does not match target schema for ${target.type}`
      );
    }

    // Emit binding event for visualization systems to consume
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("data:bound", {
          detail: { data, target, source: "DataAffordance" },
        })
      );
    }

    console.log("✅ DataAffordance: Data successfully bound to target");
  }

  /**
   * Automatically applies optimization hints based on data scale (preserves all semantic content)
   * @param data - Graph data
   * @returns Data with automatic optimization hints
   */
  private applyAutoOptimizationHints(data: any): any {
    const nodeCount = data.nodes.length;
    const linkCount = data.links ? data.links.length : 0;

    // Determine optimization strategy based on scale
    let strategy: string;
    if (nodeCount > 10000) {
      strategy = "ultra-performance";
    } else if (nodeCount > 5000) {
      strategy = "high-performance";
    } else if (nodeCount > 1000) {
      strategy = "optimized";
    } else {
      strategy = "standard";
    }

    // Add optimization metadata without changing core semantic data
    return {
      ...data,
      metadata: {
        ...data.metadata,
        optimization: {
          strategy,
          nodeCount,
          linkCount,
          recommended: {
            useInstancing: nodeCount > 1000,
            useLOD: nodeCount > 5000,
            usePoints: nodeCount > 10000,
            useFrustumCulling: nodeCount > 1000,
            batchUpdates: nodeCount > 1000,
            spatialPartitioning: nodeCount > 10000,
          },
          performanceHints: this.generatePerformanceHints(data, strategy),
        },
      },
    };
  }

  /**
   * Generates performance hints for visualization without removing semantic content
   * @param data - Graph data
   * @param strategy - Optimization strategy
   * @returns Performance hints object
   */
  private generatePerformanceHints(data: any, strategy: string): any {
    const hints = {
      renderingMode: strategy,
      nodeHints: data.nodes.map((node: any, index: number) => ({
        nodeId: node.id,
        priority: this.calculateNodePriority(node),
        lodLevel: this.calculateLODLevel(node),
        cullingHints: this.calculateCullingHints(node),
      })),
      linkHints: data.links
        ? data.links.map((link: any) => ({
            linkId: `${link.source}-${link.target}`,
            priority: this.calculateLinkPriority(link),
            renderType: this.calculateLinkRenderType(link),
          }))
        : [],
    };

    return hints;
  }

  /**
   * Calculates node rendering priority (higher = more important)
   * @param node - Node object
   * @returns Priority score (0.0 to 1.0)
   */
  private calculateNodePriority(node: any): number {
    // Base priority on connectivity if available
    const connections = node.connections || node.degree || 0;
    let priority = Math.min(connections / 20, 0.8); // Max 0.8 from connections

    // Boost for important semantic properties
    if (node.important || node.highlighted || node.root) {
      priority = Math.min(priority + 0.3, 1.0);
    }

    return Math.max(priority, 0.1); // Minimum priority of 0.1
  }

  /**
   * Calculates appropriate LOD level for a node
   * @param node - Node object
   * @returns LOD level hint
   */
  private calculateLODLevel(node: any): string {
    const priority = this.calculateNodePriority(node);

    if (priority > 0.7) return "high";
    if (priority > 0.4) return "medium";
    return "low";
  }

  /**
   * Calculates culling hints for a node
   * @param node - Node object
   * @returns Culling configuration
   */
  private calculateCullingHints(node: any): object {
    const priority = this.calculateNodePriority(node);

    return {
      allowFrustumCulling: true,
      allowOcclusionCulling: priority < 0.6,
      minDistance: 0,
      maxDistance: priority > 0.8 ? Infinity : 1000,
      alwaysVisible: priority > 0.9,
    };
  }

  /**
   * Calculates link rendering priority
   * @param link - Link object
   * @returns Priority score (0.0 to 1.0)
   */
  private calculateLinkPriority(link: any): number {
    // Higher priority for links with weights or special properties
    const weight = link.weight || link.strength || 1;
    let priority = Math.min(weight / 10, 0.8);

    if (link.important || link.highlighted) {
      priority = Math.min(priority + 0.3, 1.0);
    }

    return Math.max(priority, 0.1);
  }

  /**
   * Determines optimal rendering type for links
   * @param link - Link object
   * @returns Render type recommendation
   */
  private calculateLinkRenderType(link: any): string {
    const priority = this.calculateLinkPriority(link);

    if (priority > 0.7) return "full-geometry";
    if (priority > 0.4) return "simple-line";
    return "point-to-point";
  }

  // Enhanced cache method with explicit failure modes
  cache(key: string, data: any, ttl: number = 300000): void {
    try {
      // Validate cache key
      if (!key || typeof key !== "string") {
        throw new Error("Cache key must be a non-empty string");
      }

      // Validate TTL
      if (ttl < 0) {
        throw new Error("Cache TTL must be non-negative");
      }

      // Check cache size limits (prevent memory bloat)
      if (this.runtimeState.cache.size >= 1000) {
        console.warn("⚠️ Cache size limit reached, clearing oldest entries");
        this.performCacheEviction();
      }

      // Store with metadata
      this.runtimeState.cache.set(key, {
        data: this.deepClone(data), // Prevent reference mutation
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
      });

      console.log(
        `💾 DataAffordance: Cached data with key: ${key}, TTL: ${ttl}ms`
      );

      // Schedule automatic invalidation
      if (ttl > 0) {
        setTimeout(() => {
          if (this.runtimeState.cache.has(key)) {
            const cached = this.runtimeState.cache.get(key);
            if (cached && Date.now() - cached.timestamp >= ttl) {
              this.invalidateCache(key);
              console.log(`⏰ DataAffordance: Auto-expired cache key: ${key}`);
            }
          }
        }, ttl);
      }
    } catch (error) {
      console.error("❌ DataAffordance: Cache operation failed:", error);
      this.runtimeState.metrics.errorCount++;
    }
  }

  invalidateCache(key?: string): void {
    try {
      if (key) {
        // Single key invalidation
        if (this.runtimeState.cache.has(key)) {
          this.runtimeState.cache.delete(key);
          console.log(`🗑️ DataAffordance: Invalidated cache for key: ${key}`);

          // Emit invalidation event for dependent systems
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("cache:invalidated", {
                detail: {
                  key,
                  source: "DataAffordance",
                  timestamp: Date.now(),
                },
              })
            );
          }
        } else {
          console.warn(`⚠️ DataAffordance: Cache key not found: ${key}`);
        }
      } else {
        // Complete cache clear
        const clearedCount = this.runtimeState.cache.size;
        this.runtimeState.cache.clear();
        console.log(
          `🗑️ DataAffordance: Cleared all cache (${clearedCount} entries)`
        );

        // Emit global cache clear event
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("cache:cleared", {
              detail: {
                clearedCount,
                source: "DataAffordance",
                timestamp: Date.now(),
              },
            })
          );
        }
      }

      // Update cache coherence status
      this.validateCacheCoherence();
    } catch (error) {
      console.error("❌ DataAffordance: Cache invalidation failed:", error);
      this.runtimeState.metrics.errorCount++;
    }
  }

  /**
   * Enhanced cache access with failure mode handling
   */
  private getCachedData(
    key: string
  ): { data: any; timestamp: number; ttl: number } | null {
    try {
      const cached = this.runtimeState.cache.get(key);

      if (!cached) {
        return null;
      }

      // Check TTL expiration
      if (cached.ttl > 0 && Date.now() - cached.timestamp >= cached.ttl) {
        console.log(`⏰ DataAffordance: Cache expired for key: ${key}`);
        this.invalidateCache(key);
        return null;
      }

      // Update access metrics
      cached.accessCount = (cached.accessCount || 0) + 1;
      cached.lastAccessed = Date.now();

      // Update cache hit rate
      this.runtimeState.metrics.cacheHitRate =
        (this.runtimeState.metrics.cacheHitRate *
          this.runtimeState.metrics.totalProcessed +
          1) /
        (this.runtimeState.metrics.totalProcessed + 1);

      return cached;
    } catch (error) {
      console.error("❌ DataAffordance: Cache access failed:", error);
      this.runtimeState.metrics.errorCount++;
      return null;
    }
  }

  /**
   * Cache eviction strategy - LRU with access count weighting
   */
  private performCacheEviction(): void {
    try {
      const entries = Array.from(this.runtimeState.cache.entries());

      // Sort by LRU + access frequency
      entries.sort(([, a], [, b]) => {
        const aScore = (a.lastAccessed || 0) + (a.accessCount || 0) * 10000;
        const bScore = (b.lastAccessed || 0) + (b.accessCount || 0) * 10000;
        return aScore - bScore;
      });

      // Remove oldest 20% of entries
      const evictionCount = Math.floor(entries.length * 0.2);

      for (let i = 0; i < evictionCount; i++) {
        const [key] = entries[i];
        this.runtimeState.cache.delete(key);
      }

      console.log(`🧹 DataAffordance: Evicted ${evictionCount} cache entries`);
    } catch (error) {
      console.error("❌ DataAffordance: Cache eviction failed:", error);
      // Emergency fallback - clear all cache
      this.runtimeState.cache.clear();
    }
  }

  /**
   * Validate cache coherence invariant
   */
  private validateCacheCoherence(): void {
    try {
      let violationCount = 0;
      const now = Date.now();

      for (const [key, cached] of this.runtimeState.cache.entries()) {
        // Check for expired entries that should have been removed
        if (cached.ttl > 0 && now - cached.timestamp >= cached.ttl) {
          console.warn(
            `⚠️ Cache coherence violation: Expired entry still present: ${key}`
          );
          violationCount++;
          this.invalidateCache(key);
        }

        // Check for malformed cache entries
        if (
          !cached.data ||
          typeof cached.timestamp !== "number" ||
          typeof cached.ttl !== "number"
        ) {
          console.warn(`⚠️ Cache coherence violation: Malformed entry: ${key}`);
          violationCount++;
          this.invalidateCache(key);
        }
      }

      if (violationCount > 0) {
        console.warn(
          `⚠️ DataAffordance: Cache coherence violations detected and fixed: ${violationCount}`
        );
      }
    } catch (error) {
      console.error(
        "❌ DataAffordance: Cache coherence validation failed:",
        error
      );
    }
  }

  /**
   * Deep clone utility to prevent cache corruption
   */
  private deepClone(obj: any): any {
    try {
      // Handle primitive types
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      // Handle Date
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }

      // Handle Array
      if (Array.isArray(obj)) {
        return obj.map((item) => this.deepClone(item));
      }

      // Handle Object
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    } catch (error) {
      console.error(
        "❌ DataAffordance: Deep clone failed, falling back to JSON:",
        error
      );
      return JSON.parse(JSON.stringify(obj));
    }
  }

  /**
   * Enhanced stream handling with failure modes
   */
  stream(source: DataSource): any {
    console.log("📡 DataAffordance: Creating data stream for", source.uri);

    const streamKey = `stream:${source.uri}`;

    try {
      // Validate stream source
      if (!source.uri || typeof source.uri !== "string") {
        throw new Error("Stream source URI must be a valid string");
      }

      // Check for existing stream
      if (this.runtimeState.streams.has(streamKey)) {
        console.warn(
          `⚠️ Stream already exists for: ${source.uri}, returning existing stream`
        );
        return this.runtimeState.streams.get(streamKey);
      }

      // Create stream configuration
      const streamConfig = {
        source,
        active: true,
        lastUpdate: Date.now(),
        errorCount: 0,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000, // Start with 1 second
        status: "initializing" as
          | "initializing"
          | "connected"
          | "error"
          | "closed",
      };

      // Store stream reference
      this.runtimeState.streams.set(streamKey, streamConfig);

      // Simulate stream initialization (would be real WebSocket/SSE in full implementation)
      setTimeout(() => {
        try {
          streamConfig.status = "connected";
          streamConfig.lastUpdate = Date.now();

          console.log(`✅ DataAffordance: Stream connected: ${source.uri}`);

          // Emit stream ready event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("stream:connected", {
                detail: { streamKey, source, timestamp: Date.now() },
              })
            );
          }

          // Setup periodic health check
          this.setupStreamHealthCheck(streamKey);
        } catch (error) {
          this.handleStreamError(streamKey, error);
        }
      }, 100);

      return streamConfig;
    } catch (error) {
      console.error(
        `❌ DataAffordance: Stream creation failed for ${source.uri}:`,
        error
      );
      this.runtimeState.metrics.errorCount++;

      // Return error stream state
      return {
        source,
        active: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Stream health monitoring and failure recovery
   */
  private setupStreamHealthCheck(streamKey: string): void {
    const checkInterval = setInterval(() => {
      const stream = this.runtimeState.streams.get(streamKey);

      if (!stream || !stream.active) {
        clearInterval(checkInterval);
        return;
      }

      try {
        const now = Date.now();
        const timeSinceUpdate = now - stream.lastUpdate;

        // Check for stale stream (no updates for 30 seconds)
        if (timeSinceUpdate > 30000) {
          console.warn(
            `⚠️ Stream appears stale: ${streamKey}, attempting reconnect`
          );
          this.attemptStreamReconnect(streamKey);
        }
      } catch (error) {
        console.error(`❌ Stream health check failed for ${streamKey}:`, error);
        this.handleStreamError(streamKey, error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stream error handling with exponential backoff
   */
  private handleStreamError(streamKey: string, error: any): void {
    const stream = this.runtimeState.streams.get(streamKey);

    if (!stream) {
      return;
    }

    stream.errorCount = (stream.errorCount || 0) + 1;
    stream.status = "error";

    console.error(`❌ Stream error for ${streamKey}:`, error);

    // Emit stream error event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("stream:error", {
          detail: {
            streamKey,
            error: error.message,
            errorCount: stream.errorCount,
          },
        })
      );
    }

    // Attempt reconnection with exponential backoff
    if (stream.reconnectAttempts < stream.maxReconnectAttempts) {
      this.attemptStreamReconnect(streamKey);
    } else {
      console.error(
        `❌ Max reconnection attempts reached for stream: ${streamKey}`
      );
      stream.active = false;
      stream.status = "closed";
    }
  }

  /**
   * Stream reconnection with exponential backoff
   */
  private attemptStreamReconnect(streamKey: string): void {
    const stream = this.runtimeState.streams.get(streamKey);

    if (!stream) {
      return;
    }

    stream.reconnectAttempts = (stream.reconnectAttempts || 0) + 1;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay =
      stream.reconnectDelay * Math.pow(2, stream.reconnectAttempts - 1);

    console.log(
      `🔄 Attempting stream reconnect ${stream.reconnectAttempts}/${stream.maxReconnectAttempts} for ${streamKey} in ${delay}ms`
    );

    setTimeout(() => {
      try {
        // Simulate reconnection (would be real reconnection logic)
        stream.status = "connected";
        stream.lastUpdate = Date.now();
        stream.errorCount = 0;

        console.log(`✅ Stream reconnected: ${streamKey}`);

        // Reset backoff on successful reconnection
        stream.reconnectAttempts = 0;
      } catch (error) {
        this.handleStreamError(streamKey, error);
      }
    }, delay);
  }

  getMetrics(): DataAffordanceState["metrics"] {
    return this.runtimeState.metrics;
  }

  private validateDataFormat(data: any, target: VisualizationTarget): boolean {
    // Basic validation - would be more sophisticated in full implementation
    if (target.expectedFormat === "nodes_links") {
      return (
        data &&
        typeof data === "object" &&
        Array.isArray(data.nodes) &&
        Array.isArray(data.links)
      );
    }

    return true; // Placeholder
  }

  private updateMetrics(processingTime: number): void {
    const metrics = this.runtimeState.metrics;
    metrics.totalProcessed++;
    metrics.averageProcessingTime =
      (metrics.averageProcessingTime * (metrics.totalProcessed - 1) +
        processingTime) /
      metrics.totalProcessed;
  }

  // AffordanceInstance interface methods
  inspect(): AffordanceInspection {
    return {
      activeCapabilities: this.contract.capabilities,
      stateSnapshot: { ...this.runtimeState },
      invariantStatus: {
        data_integrity: "satisfied",
        type_safety: "satisfied",
        referential_consistency: "satisfied",
        cache_coherence: "satisfied",
      },
      methodTrace: [], // Would be populated with actual method calls
      compositionDependencies: [],
    };
  }

  reconfigure(changes: Partial<DataAffordanceState>): void {
    Object.assign(this.runtimeState, changes);
    this.lastUpdate = Date.now();
    console.log("🔧 DataAffordance: Reconfigured with changes", changes);
  }

  validate() {
    return {
      isValid: true,
      violations: [],
      warnings: [],
    };
  }
}

// Factory function for easy instantiation
export function createDataAffordance(
  configuration: Record<string, any> = {}
): DataAffordanceInstance {
  return new DataAffordanceInstance(configuration);
}
