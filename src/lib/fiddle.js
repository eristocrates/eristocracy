import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import * as THREE from "three";
// import { FiddlePerformanceProfiler } from "../performance/FiddlePerformanceProfiler.js";
// import {
//   AdvancedMetricsCollector,
//   ThreeJSProfiler,
//   SystemPerformanceMonitor,
//   PerformanceComparator
// } from "../performance/AdvancedMetrics.js";

// Global performance system
// let performanceProfiler = null;
// let advancedMetrics = null;
// let threeJSProfiler = null;
// let systemMonitor = null;
// let comparator = null;

// Performance setup code (stays consistent)
const performanceSetupCode = `// === PERFORMANCE SETUP (Auto-generated) ===
// This section handles performance monitoring and optimization

// Initialize performance hooks
if (window.fiddleProfiler) {
  window.fiddleProfiler.attachToRenderer(renderer);
  console.log('🔬 Performance profiler attached!');
}

// Performance monitoring wrapper
function withPerformanceTracking(name, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  if (duration > 1) console.log(\`⚡ \${name}: \${duration.toFixed(2)}ms\`);
  return result;
}

// Frame performance tracking
let frameCount = 0;
function trackFramePerformance() {
  performance.mark('frame-start');
  
  return function endFrameTracking() {
    performance.mark('frame-end');
    performance.measure('frame-duration', 'frame-start', 'frame-end');
    frameCount++;
    
    // Advanced analysis every 2 seconds
    if (frameCount % 120 === 0) {
      if (window.fiddleProfiler && window.fiddleProfiler.collectThreeJSMetrics) {
        window.fiddleProfiler.collectThreeJSMetrics(renderer, scene);
      }
      
      if (window.fiddleThreeJSProfiler && scene) {
        const sceneAnalysis = window.fiddleThreeJSProfiler.analyzeScene(scene);
        console.log('📊 Scene analysis:', sceneAnalysis);
      }
    }
  };
}`;

// Default scene code (user editable)
const defaultSceneCode = `// Clear the surface first
surface.innerHTML = '';

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, surface.clientWidth / surface.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(surface.clientWidth, surface.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x1a1a1a); // Dark background
surface.appendChild(renderer.domElement);

// Attach performance profiler to renderer and scene
if (window.fiddleProfiler) {
  window.fiddleProfiler.attachToRenderer(renderer);
  console.log('🔬 Performance profiler attached with advanced analysis!');
}

// Create multiple objects to demonstrate analysis
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const materials = [
  new THREE.MeshPhongMaterial({ color: 0xff6b6b }), // Red
  new THREE.MeshPhongMaterial({ color: 0x4ecdc4 }), // Teal
  new THREE.MeshPhongMaterial({ color: 0x45b7d1 }), // Blue
  new THREE.MeshPhongMaterial({ color: 0xffa500 }), // Orange
];

const cubes = [];
for (let i = 0; i < 100; i++) {
  const material = materials[i % materials.length];
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = (Math.random() - 0.5) * 20;
  cube.position.y = (Math.random() - 0.5) * 20;
  cube.position.z = (Math.random() - 0.5) * 20;
  cube.name = \`Cube_\${i}\`; // Name for entity analysis
  scene.add(cube);
  cubes.push(cube);
}

// Add a light source
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

camera.position.z = 15;
camera.lookAt(0, 0, 0);

// Frame counter for advanced metrics
let frameCount = 0;

// Animation loop with comprehensive performance tracking
function animate() {
  requestAnimationFrame(animate);
  
  const startFrame = performance.now();
  
  // Rotate cubes
  cubes.forEach((cube, index) => {
    cube.rotation.x += 0.01 + (index * 0.0005);
    cube.rotation.y += 0.01 + (index * 0.001);
  });

  renderer.render(scene, camera);
  
  const frameTime = performance.now() - startFrame;
  frameCount++;

  // Pass scene to profiler for advanced analysis every 60 frames
  if (frameCount % 60 === 0 && window.fiddleProfiler) {
    window.fiddleProfiler.collectThreeJSMetrics(renderer, scene);
  }
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = surface.clientWidth / surface.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(surface.clientWidth, surface.clientHeight);
});

console.log("Three.js Performance Laboratory ready!");
console.log("Advanced analysis: GPU/CPU timing, spatial density, entity contribution, GPU memory estimation");`;

// Default starter code combining both sections
const defaultCode = defaultSceneCode;

/**
 * Initialize the comprehensive performance monitoring system
 */
function initializePerformanceSystem() {
  try {
    // Create the performance observatory container
    const observatoryContainer = document.createElement('div');
    observatoryContainer.id = 'performance-observatory';
    document.body.appendChild(observatoryContainer);

    // Initialize the main profiler with collapsed start
    // performanceProfiler = new FiddlePerformanceProfiler({
    //   container: '#performance-observatory',
    //   updateInterval: 100,
    //   historyLength: 60,
    //   startCollapsed: true, // Start in quick stats mode
    //   enableAdvancedMetrics: true,
    //   enableInteractionProfiling: true,
    //   enableNetworkProfiling: true
    // });

    // Initialize advanced metrics collectors
    // advancedMetrics = new AdvancedMetricsCollector({
    //   longTaskThreshold: 50,
    //   eventLoopLagThreshold: 16,
    //   memoryGrowthThreshold: 10
    // });

    // threeJSProfiler = new ThreeJSProfiler();
    // systemMonitor = new SystemPerformanceMonitor();
    // comparator = new PerformanceComparator();

    // Connect advanced metrics callbacks
    // advancedMetrics.onLongTask = (task) => {
    //   performanceProfiler.addMetric('advanced.longTasks', {
    //     duration: task.duration,
    //     startTime: task.startTime
    //   });
    // };

    // advancedMetrics.onEventLoopLag = (lag) => {
    //   performanceProfiler.addMetric('javascript.eventLoopLag', lag);
    // };

    // advancedMetrics.onMemoryGrowth = (growth) => {
    //   performanceProfiler.addMetric('advanced.memoryGrowth', growth);
    // };

    // advancedMetrics.onGarbageCollection = (gcInfo) => {
    //   performanceProfiler.addMetric('javascript.gcEvents', gcInfo);
    // };

    // Make everything globally available
    // window.fiddleProfiler = performanceProfiler;
    // window.fiddleAdvancedMetrics = advancedMetrics;
    // window.fiddleThreeJSProfiler = threeJSProfiler;
    // window.fiddleSystemMonitor = systemMonitor;
    // window.fiddleComparator = comparator;

    console.log("🔬 Performance Observatory initialized in collapsed mode");
    console.log("📊 Quick stats will show: FPS, Memory, Draw Calls, GPU");
    console.log("🎮 Commands available:");
    console.log("  - window.fiddleProfiler.show() // Show observatory");
    console.log("  - window.fiddleProfiler.toggleCollapse() // Toggle collapse");
    console.log("  - window.fiddleComparator.takeSnapshot('name') // Take snapshot");

  } catch (error) {
    console.error("❌ Failed to initialize performance system:", error);
  }
}

/**
 * Setup resize handle for editor/canvas split
 */
function setupResizeHandle() {
  const resizeHandle = document.getElementById('resize-handle');
  const editorSection = document.querySelector('.editor-section');
  const canvasSection = document.querySelector('.canvas-section');
  const mainContent = document.querySelector('.main-content');

  if (!resizeHandle || !editorSection || !canvasSection || !mainContent) return;

  let isResizing = false;
  let startX = 0;
  let startEditorWidth = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startEditorWidth = editorSection.offsetWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newEditorWidth = startEditorWidth + deltaX;
    const totalWidth = mainContent.offsetWidth - 8; // Account for resize handle
    const minWidth = 300;
    const maxWidth = totalWidth - minWidth;

    if (newEditorWidth >= minWidth && newEditorWidth <= maxWidth) {
      const editorPercent = (newEditorWidth / totalWidth) * 100;
      const canvasPercent = ((totalWidth - newEditorWidth) / totalWidth) * 100;

      mainContent.style.gridTemplateColumns = `${editorPercent}% auto ${canvasPercent}%`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

/**
 * Setup recommendations display system
 */
function setupRecommendationsDisplay() {
  // Update recommendations every 5 seconds
  setInterval(() => {
    // if (performanceProfiler) {
    updateRecommendations();
    // }
  }, 5000);

  // Also update quick stats
  setInterval(() => {
    updateQuickStats();
  }, 1000);
}

/**
 * Update recommendations bar with current analysis
 */
function updateRecommendations() {
  const recommendationsBar = document.getElementById('recommendations-bar');
  if (!recommendationsBar || !performanceProfiler) return;

  const recommendations = [];

  // Collect recommendations from all analyzers
  // if (performanceProfiler.lastMaterialAnalysis?.optimizations?.length > 0) {
  //   recommendations.push({
  //     type: 'material',
  //     severity: 'medium',
  //     message: `${performanceProfiler.lastMaterialAnalysis.optimizations.length} material optimizations available`,
  //     detail: performanceProfiler.lastMaterialAnalysis.optimizations[0]
  //   });
  // }

  // if (performanceProfiler.lastInstancingAnalysis?.opportunities?.length > 0) {
  //   const drawCallReduction = performanceProfiler.lastInstancingAnalysis.potentialDrawCallReduction;
  //   recommendations.push({
  //     type: 'instancing',
  //     severity: drawCallReduction > 10 ? 'high' : 'medium',
  //     message: `${drawCallReduction} draw calls could be saved with instancing`,
  //     detail: `${performanceProfiler.lastInstancingAnalysis.opportunities.length} instancing opportunities`
  //   });
  // }

  // if (performanceProfiler.interactionProfiler) {
  //   const interactionMetrics = performanceProfiler.interactionProfiler.getRealTimeMetrics();
  //   if (interactionMetrics.responsiveness < 70) {
  //     recommendations.push({
  //       type: 'interaction',
  //       severity: 'high',
  //       message: `Input responsiveness: ${interactionMetrics.responsiveness}/100`,
  //       detail: `Average latency: ${interactionMetrics.averageLatency.toFixed(1)}ms`
  //     });
  //   }
  // }

  // if (performanceProfiler.networkProfiler) {
  //   const networkAnalysis = performanceProfiler.networkProfiler.getAnalysis();
  //   if (networkAnalysis.summary && networkAnalysis.summary.cacheHitRate < 50) {
  //     recommendations.push({
  //       type: 'network',
  //       severity: 'medium',
  //       message: `Cache hit rate: ${networkAnalysis.summary.cacheHitRate}%`,
  //       detail: 'Consider implementing better caching'
  //     });
  //   }
  // }

  // Update the recommendations bar
  recommendationsBar.innerHTML = `
    <span style="color: #888;">💡 Recommendations:</span>
    ${recommendations.length === 0 ?
      '<span style="color: #4ecdc4; font-size: 10px;">✅ Performance looks good!</span>' :
      recommendations.map(rec => `
        <div class="recommendation-item ${rec.severity}" 
             title="${rec.detail || rec.message}"
             onclick="console.log('${rec.type} recommendation:', '${rec.message}', '${rec.detail || ''}')">
          ${rec.message}
        </div>
      `).join('')}
  `;
}

/**
 * Update quick stats display
 */
function updateQuickStats() {
  const fpsDisplay = document.getElementById('fps-display');
  const drawsDisplay = document.getElementById('draws-display');

  if (performanceProfiler && fpsDisplay && drawsDisplay) {
    const latestFPS = performanceProfiler.getLatestMetric('frame.fps');
    const latestDraws = performanceProfiler.getLatestMetric('threejs.drawCalls');

    if (latestFPS !== undefined) {
      fpsDisplay.textContent = Math.round(latestFPS);
      fpsDisplay.style.color = latestFPS > 45 ? '#00ff00' : latestFPS > 25 ? '#ffff00' : '#ff6b6b';
    }

    if (latestDraws !== undefined) {
      drawsDisplay.textContent = latestDraws;
      drawsDisplay.style.color = latestDraws < 50 ? '#00ff00' : latestDraws < 100 ? '#ffff00' : '#ff6b6b';
    }
  }
}

export function initializeFiddle() {
  // Get DOM elements
  const editorContainer = document.getElementById("code-editor");
  const runBtn = document.getElementById("run-btn");
  const clearBtn = document.getElementById("clear-btn");
  const surface = document.getElementById("render-surface");

  if (!editorContainer || !runBtn || !clearBtn || !surface) {
    console.error("Required DOM elements not found");
    return;
  }

  // Initialize Performance Observatory
  initializePerformanceSystem();

  // Setup resize functionality
  setupResizeHandle();

  // Setup recommendations display
  setupRecommendationsDisplay();

  // Single CodeMirror editor (no tabbing)
  const view = new EditorView({
    parent: editorContainer,
    doc: defaultSceneCode,
    extensions: [
      basicSetup,
      javascript(),
      oneDark,
      EditorView.lineWrapping,
      EditorView.theme({
        ".cm-scroller": {
          "overflow": "auto",
          "max-height": "100%"
        },
        ".cm-editor": {
          "height": "100%"
        },
        ".cm-focused": {
          "outline": "none"
        }
      })
    ]
  });

  // Run code function with performance tracking
  function runCode() {
    const code = view.state.doc.toString();

    try {
      console.clear();
      console.log("🚀 Running code with comprehensive performance monitoring...");

      // Clear previous render surface and reset profiler
      surface.innerHTML = '';
      // if (performanceProfiler) {
      //   console.log("🔄 Resetting performance metrics...");
      // }

      // Create a sandboxed function with THREE and surface available
      const scopedFn = new Function("THREE", "surface", "console", code);
      scopedFn(THREE, surface, console);

      console.log("✅ Code executed successfully");
      console.log("🔬 Full Performance Observatory active");

      // Auto-take snapshot after 3 seconds
      setTimeout(() => {
        // if (comparator) {
        //   const snapshot = comparator.takeSnapshot('auto-' + Date.now(), performanceProfiler?.exportData()?.metrics || {});
        //   console.log("📸 Auto-snapshot taken:", snapshot.label);
        // }
      }, 3000);

    } catch (error) {
      console.error("❌ Execution error:", error);

      // Also show error in the render surface
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        color: #ff6b6b;
        font-family: monospace;
        padding: 20px;
        background: rgba(255, 107, 107, 0.1);
        border-left: 3px solid #ff6b6b;
        margin: 10px;
        border-radius: 4px;
      `;
      errorDiv.textContent = `Error: ${error.message}`;
      surface.appendChild(errorDiv);
    }
  }

  // Clear output function
  function clearOutput() {
    surface.innerHTML = '';
    console.clear();
    console.log("🧹 Output cleared");

    // Reset performance metrics
    // if (performanceProfiler) {
    //   performanceProfiler.metrics = {
    //     frame: { fps: [], frameTime: [], deltaTime: [], drops: [], jank: [] },
    //     threejs: { drawCalls: [], triangles: [], geometries: [], textures: [], materials: [], shaderSwitches: [] },
    //     javascript: { executionTime: [], gcEvents: [], heapSize: [], eventLoopLag: [] },
    //     system: { cpuUsage: [], memoryUsage: [], thermalState: [], batteryLevel: [] },
    //     custom: {}
    //   };
    //   console.log("🔄 Performance metrics reset");
    // }
  }

  // Performance snapshot function
  function takePerformanceSnapshot() {
    // if (!comparator || !performanceProfiler) {
    //   console.warn("Performance system not initialized");
    //   return;
    // }

    const label = prompt("Enter snapshot label:", "snapshot-" + Date.now());
    if (label) {
      // const snapshot = comparator.takeSnapshot(label, performanceProfiler.exportData().metrics);
      // console.log("📸 Performance snapshot saved:", snapshot);

      // Show comparison if we have multiple snapshots
      // if (comparator.snapshots.length >= 2) {
      //   const latest = comparator.snapshots[comparator.snapshots.length - 1];
      //   const previous = comparator.snapshots[comparator.snapshots.length - 2];
      //   const comparison = comparator.compare(previous.label, latest.label);
      //   console.log("📊 Performance comparison:", comparison);
      // }
    }
  }

  // Event listeners
  runBtn.onclick = runCode;
  clearBtn.onclick = clearOutput;

  // Connect performance toggle to observatory
  const performanceToggleBtn = document.getElementById('performance-toggle');
  if (performanceToggleBtn) {
    performanceToggleBtn.onclick = () => {
      // if (performanceProfiler) {
      //   if (performanceProfiler.svg && performanceProfiler.svg.style('display') === 'none') {
      //     performanceProfiler.show();
      //     performanceToggleBtn.textContent = '📊 Hide Observatory';
      //   } else {
      //     performanceProfiler.toggleCollapse();
      //     // Update button text based on state
      //     const isCollapsed = performanceProfiler.isCollapsed;
      //     performanceToggleBtn.textContent = isCollapsed ? '📊 Expand Observatory' : '📊 Collapse Observatory';
      //   }
      // }
    };
  }

  // Focus editor on load
  view.focus();

  console.log("🎨 Three.js Performance Fiddle ready!");
  console.log("💡 Features:");
  console.log("- Comprehensive performance monitoring with rich D3 visualizations");
  console.log("- Advanced material complexity analysis");
  console.log("- Instancing opportunity detection");
  console.log("- Real-time interaction profiling");
  console.log("- Network asset performance tracking");
  console.log("- Drag the center handle to resize editor/canvas");
} 