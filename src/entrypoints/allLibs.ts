// Entry point to ensure all internal modules are included in the build
// This guarantees Vite includes them in the final bundle

// Fiddle and performance modules
import "../lib/fiddle.js";
// import '../lib/performance/FiddlePerformanceProfiler.js';
// import '../lib/performance/AdvancedMetrics.js';
// import '../lib/performance/MaterialComplexityAnalyzer.js';
// import '../lib/performance/InstancingAnalyzer.js';
// import '../lib/performance/InteractionProfiler.js';
// import '../lib/performance/NetworkAssetProfiler.js';

// Semantic graph modules
import "../lib/semantic/SemanticGraphViewerInit.js";
import "../lib/semantic/composer/SemanticGraphComposer.js";
import "../lib/semantic/performance/D3PerformanceControls.js";
import "../lib/semantic/performance/PerformanceState.js";
import "../lib/semantic/performance/PerformanceParameterSchema.js";
// import '../lib/semantic/performance/RealTimePerformanceMonitor.js';
import "../lib/semantic/graph/function/createForceGraphInstance.js";

// Vasturiano modules
import "../lib/vasturiano/Basic.js";
import "../lib/vasturiano/ColoredText/function/initializeColoredTextFromAttributes.js";
import "../lib/vasturiano/ColoredText/function/updateColoredText.js";
import "../lib/vasturiano/Kapsule/const/KapsuleConfigs.js";
import "../lib/vasturiano/Kapsule/function/categorizeProps.js";
import "../lib/vasturiano/Kapsule/function/getKapsuleInstance.js";
import "../lib/vasturiano/Kapsule/function/initializeKapsule.js";
import "../lib/vasturiano/Kapsule/KapsuleConfigsClient.js";

// Hooks
import "../hooks/useStats.ts";

console.log("All internal modules imported for production build");
