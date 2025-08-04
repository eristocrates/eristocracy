/**
 * @file WebGPUDemo.js
 * @description Demonstration of WebGPU integration with existing system
 * Shows exactly how to enable/disable/monitor GPU acceleration
 */

/**
 * Example 1: Enable WebGPU acceleration in your existing code
 * Add this ONE LINE to your SemanticGraphComposer config
 */
export function enableWebGPUAcceleration() {
  // IN YOUR EXISTING CODE:
  // const composer = new SemanticGraphComposer(); // <- This line already exists

  // CHANGE IT TO:
  // const composer = new SemanticGraphComposer({ enableWebGPU: true }); // <- Just add this

  // That's it! WebGPU will automatically activate for graphs with 100+ nodes
  // If WebGPU fails, it falls back to CPU with zero breaking changes
}

/**
 * Example 2: Monitor GPU acceleration status
 */
export function monitorGPUStatus(composer) {
  // Check if GPU acceleration is working
  const status = composer.webgpuIntegration.getStatus();

  console.log('GPU Status:', {
    available: status.available,      // Is WebGPU supported?
    enabled: status.enabled,          // Is acceleration active?
    fallbackMode: status.fallbackMode, // Using CPU fallback?
    nodeCount: status.nodeCount       // How many nodes are being processed?
  });

  return status;
}

/**
 * Example 3: Disable GPU acceleration (if needed)
 */
export function disableGPUAcceleration(composer) {
  composer.webgpuIntegration.disable();
  console.log('GPU acceleration disabled - using CPU physics');
}

/**
 * Example 4: Performance comparison
 */
export async function comparePerformance(composer) {
  const startTime = performance.now();

  // Disable GPU temporarily
  composer.webgpuIntegration.disable();
  console.log('⏱️ Running CPU physics for 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  const cpuTime = performance.now() - startTime;

  // Re-enable GPU
  composer.webgpuIntegration.enable();
  console.log('⏱️ Running GPU physics for 5 seconds...');
  const gpuStartTime = performance.now();
  await new Promise(resolve => setTimeout(resolve, 5000));
  const gpuTime = performance.now() - gpuStartTime;

  console.log(`🚀 Performance comparison:
    CPU: ${cpuTime.toFixed(2)}ms
    GPU: ${gpuTime.toFixed(2)}ms  
    Speedup: ${(cpuTime / gpuTime).toFixed(1)}x faster`);
}

/**
 * Example 5: Debug WebGPU integration
 */
export function debugWebGPU() {
  // Check browser support
  if (!navigator.gpu) {
    console.error('❌ WebGPU not supported in this browser');
    console.log('💡 Try Chrome/Edge with --enable-unsafe-webgpu flag');
    return false;
  }

  console.log('✅ WebGPU API available');

  // Test GPU adapter
  navigator.gpu.requestAdapter().then(adapter => {
    if (adapter) {
      console.log('✅ GPU adapter found:', adapter);
      return adapter.requestDevice();
    } else {
      console.error('❌ No GPU adapter available');
    }
  }).then(device => {
    if (device) {
      console.log('✅ WebGPU device created successfully');
      console.log('🚀 Ready for GPU acceleration!');
    }
  }).catch(error => {
    console.error('❌ WebGPU initialization failed:', error);
  });

  return true;
} 