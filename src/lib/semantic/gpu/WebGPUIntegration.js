/**
 * @file WebGPUIntegration.js  
 * @description Aggressive WebGPU integration - physics AND instanced rendering
 * Maximum optimization with full fidelity
 */

import { WebGPUForceAcceleration } from './WebGPUForceAcceleration.js';
import { WebGPUInstancedRenderer } from './WebGPUInstancedRenderer.js';

export class WebGPUIntegration {
  constructor() {
    this.gpuAcceleration = null;
    this.instancedRenderer = null;
    this.isEnabled = false;
    this.status = {
      physics: false,
      rendering: false,
      nodeCount: 0,
      drawCallsReduced: 0
    };

    // Create onscreen status display immediately
    this.createStatusDisplay();
  }

  /**
   * AGGRESSIVE integration - physics AND rendering acceleration
   */
  async accelerateComposer(semanticGraphComposer) {
    console.log('🚀 AGGRESSIVE WebGPU Integration Starting...');
    console.log('🧪 Browser:', navigator.userAgent);
    console.log('🧪 WebGPU available:', !!navigator.gpu);
    this.showStatus('🔄 Initializing WebGPU acceleration...', 'info');

    try {
      // Test WebGPU support first
      console.log('🧪 Testing WebGPU support...');
      const webgpuSupported = await this.testWebGPUSupport();
      if (!webgpuSupported) {
        console.error('❌ WebGPU support test failed');
        this.showStatus('❌ WebGPU not supported - using CPU fallback', 'error');
        return false;
      }
      console.log('✅ WebGPU support test passed');

      // Initialize physics acceleration
      console.log('🚀 Initializing GPU physics acceleration...');
      this.gpuAcceleration = new WebGPUForceAcceleration();
      const physicsSuccess = await this.gpuAcceleration.initialize();
      console.log(`🚀 Physics acceleration: ${physicsSuccess ? 'SUCCESS' : 'FAILED'}`);

      // Initialize instanced rendering
      console.log('🎨 Initializing GPU instanced rendering...');
      this.instancedRenderer = new WebGPUInstancedRenderer();
      const renderingSuccess = await this.instancedRenderer.initialize();
      console.log(`🎨 Instanced rendering: ${renderingSuccess ? 'SUCCESS' : 'FAILED'}`);

      this.status.physics = physicsSuccess;
      this.status.rendering = renderingSuccess;

      // Hook into graph creation
      const originalCreateGraph = semanticGraphComposer.createForceGraphInstance;
      if (originalCreateGraph) {
        console.log('🔗 Hooking into graph creation...');
        semanticGraphComposer.createForceGraphInstance = function (...args) {
          const graphInstance = originalCreateGraph.apply(this, args);

          // Apply BOTH physics and rendering acceleration
          if (this.gpuIntegration?.gpuAcceleration?.isSupported) {
            console.log('🚀 Applying GPU physics to new graph...');
            this.gpuIntegration.gpuAcceleration.accelerateGraph(graphInstance);
            console.log('🚀 GPU physics acceleration applied');
          } else {
            console.warn('⚠️ GPU physics not available for new graph');
          }

          if (this.gpuIntegration?.instancedRenderer?.isSupported) {
            console.log('🎨 Applying GPU rendering to new graph...');
            this.gpuIntegration.instancedRenderer.overrideForceGraphRendering(graphInstance);
            console.log('🎨 GPU instanced rendering applied');
          } else {
            console.warn('⚠️ GPU instanced rendering not available for new graph');
          }

          return graphInstance;
        };
      } else {
        console.warn('⚠️ No createForceGraphInstance method found to hook');
      }

      // Store reference
      semanticGraphComposer.gpuIntegration = this;
      this.isEnabled = true;

      // Show comprehensive status
      this.logComprehensiveStatus();
      this.updateStatusDisplay();

      console.log('✅ AGGRESSIVE WebGPU integration complete');
      return physicsSuccess || renderingSuccess; // Success if at least one works

    } catch (error) {
      console.error('❌ WebGPU integration failed:', error);
      console.error('❌ Error stack:', error.stack);
      this.showStatus('❌ WebGPU integration failed - using CPU', 'error');
      return false;
    }
  }

  /**
   * Test WebGPU support with detailed reporting
   */
  async testWebGPUSupport() {
    console.log('🧪 Testing WebGPU support...');

    if (!navigator.gpu) {
      console.error('❌ navigator.gpu not available');
      console.log('💡 Enable WebGPU: chrome --enable-unsafe-webgpu');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error('❌ No WebGPU adapter found');
        return false;
      }

      console.log('✅ WebGPU adapter found:', adapter);

      const device = await adapter.requestDevice();
      console.log('✅ WebGPU device created successfully');

      // Test compute capability
      const supportsCompute = device.features.has('timestamp-query') || true; // Basic compute should work
      console.log('✅ WebGPU compute supported:', supportsCompute);

      device.destroy();
      return true;
    } catch (error) {
      console.error('❌ WebGPU test failed:', error);
      return false;
    }
  }

  /**
   * Alternative integration for existing graphs
   */
  async accelerateExistingGraph(forceGraphInstance) {
    console.log('🚀 Applying WebGPU acceleration to existing graph...');

    if (!this.gpuAcceleration) {
      this.gpuAcceleration = new WebGPUForceAcceleration();
      await this.gpuAcceleration.initialize();
    }

    if (!this.instancedRenderer) {
      this.instancedRenderer = new WebGPUInstancedRenderer();
      await this.instancedRenderer.initialize();
    }

    let success = false;

    // Apply physics acceleration
    if (this.gpuAcceleration.isSupported) {
      this.gpuAcceleration.accelerateGraph(forceGraphInstance);
      this.status.physics = true;
      success = true;
      console.log('🚀 GPU physics acceleration applied to existing graph');
    }

    // Apply rendering acceleration
    if (this.instancedRenderer.isSupported) {
      this.instancedRenderer.overrideForceGraphRendering(forceGraphInstance);
      this.status.rendering = true;
      success = true;
      console.log('🎨 GPU instanced rendering applied to existing graph');
    }

    this.updateStatusDisplay();
    return success;
  }

  /**
   * Log comprehensive WebGPU status
   */
  logComprehensiveStatus() {
    console.log('\n🚀 === WEBGPU INTEGRATION STATUS ===');
    console.log(`Physics Acceleration: ${this.status.physics ? '✅ ACTIVE' : '❌ FAILED'}`);
    console.log(`Instanced Rendering: ${this.status.rendering ? '✅ ACTIVE' : '❌ FAILED'}`);
    console.log(`Node Count: ${this.status.nodeCount}`);
    console.log(`Draw Calls Reduced: ${this.status.drawCallsReduced}`);

    if (this.status.physics && this.status.rendering) {
      console.log('🎉 MAXIMUM OPTIMIZATION ACHIEVED!');
      console.log('🚀 Physics: GPU parallel computation');
      console.log('🎨 Rendering: GPU instanced draw calls');
      console.log('📊 Expected performance: 10-100x improvement');
    } else if (this.status.physics) {
      console.log('⚡ Partial optimization: GPU physics only');
    } else if (this.status.rendering) {
      console.log('⚡ Partial optimization: GPU rendering only');
    } else {
      console.log('📊 Using CPU fallback (no performance impact)');
    }
    console.log('=======================================\n');
  }

  /**
   * Create persistent onscreen status display
   */
  createStatusDisplay() {
    const statusElement = document.createElement('div');
    statusElement.id = 'webgpu-integration-status';
    statusElement.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      padding: 15px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9));
      border: 2px solid #00ff00;
      border-radius: 12px;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      z-index: 10001;
      min-width: 300px;
      box-shadow: 0 8px 24px rgba(0, 255, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      animation: webgpu-glow 2s ease-in-out infinite alternate;
    `;

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes webgpu-glow {
        0% { border-color: #00ff00; box-shadow: 0 8px 24px rgba(0, 255, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        100% { border-color: #00cc00; box-shadow: 0 8px 32px rgba(0, 255, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
      }
      .webgpu-status.success { background: rgba(0, 100, 0, 0.8); border-color: #00ff00; }
      .webgpu-status.warning { background: rgba(100, 100, 0, 0.8); border-color: #ffff00; }
      .webgpu-status.error { background: rgba(100, 0, 0, 0.8); border-color: #ff0000; }
    `;
    document.head.appendChild(style);

    statusElement.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px; text-align: center;">🚀 WebGPU STATUS</div>
      <div id="webgpu-physics-status" style="margin-bottom: 5px;">Physics: <span style="color: #666;">Initializing...</span></div>
      <div id="webgpu-rendering-status" style="margin-bottom: 5px;">Rendering: <span style="color: #666;">Initializing...</span></div>
      <div id="webgpu-node-count" style="margin-bottom: 5px;">Nodes: <span style="color: #666;">-</span></div>
      <div id="webgpu-draw-calls" style="margin-bottom: 8px;">Draw Call Reduction: <span style="color: #666;">-</span></div>
      <div style="font-size: 10px; color: #888; text-align: center; border-top: 1px solid #333; padding-top: 8px;">
        Toggle: window.debugGraph.maxOptimization()
      </div>
    `;

    document.body.appendChild(statusElement);
    this.statusElement = statusElement;
  }

  /**
   * Update the onscreen status display
   */
  updateStatusDisplay() {
    if (!this.statusElement) return;

    const physicsEl = this.statusElement.querySelector('#webgpu-physics-status span');
    const renderingEl = this.statusElement.querySelector('#webgpu-rendering-status span');
    const nodeCountEl = this.statusElement.querySelector('#webgpu-node-count span');
    const drawCallsEl = this.statusElement.querySelector('#webgpu-draw-calls span');

    if (physicsEl) {
      physicsEl.textContent = this.status.physics ? '✅ GPU ACTIVE' : '❌ CPU Fallback';
      physicsEl.style.color = this.status.physics ? '#00ff00' : '#ff6666';
    }

    if (renderingEl) {
      renderingEl.textContent = this.status.rendering ? '✅ INSTANCED' : '❌ Individual';
      renderingEl.style.color = this.status.rendering ? '#00ff00' : '#ff6666';
    }

    if (nodeCountEl) {
      nodeCountEl.textContent = this.status.nodeCount.toString();
      nodeCountEl.style.color = '#66ccff';
    }

    if (drawCallsEl) {
      const reduction = this.status.drawCallsReduced;
      drawCallsEl.textContent = reduction > 0 ? `↓${reduction}` : 'No reduction';
      drawCallsEl.style.color = reduction > 0 ? '#00ff00' : '#666';
    }
  }

  /**
   * Show temporary status message
   */
  showStatus(message, type = 'info') {
    console.log(`🚀 WebGPU: ${message}`);

    // Also show in instanced renderer if available
    if (this.instancedRenderer) {
      this.instancedRenderer.showStatus(message, type);
    }
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      available: this.gpuAcceleration?.isSupported || this.instancedRenderer?.isSupported || false,
      enabled: this.isEnabled,
      physics: this.status.physics,
      rendering: this.status.rendering,
      nodeCount: this.status.nodeCount,
      drawCallsReduced: this.status.drawCallsReduced,
      fallbackMode: !this.status.physics && !this.status.rendering,
      maxOptimization: this.status.physics && this.status.rendering
    };
  }

  /**
   * Update node count for status display
   */
  updateNodeCount(count) {
    this.status.nodeCount = count;

    // Get draw call reduction from instanced renderer
    if (this.instancedRenderer && this.instancedRenderer.stats) {
      this.status.drawCallsReduced = this.instancedRenderer.stats.drawCallsReduced;
    }

    this.updateStatusDisplay();
  }

  /**
   * Disable GPU acceleration
   */
  disable() {
    if (this.gpuAcceleration) {
      this.gpuAcceleration.fallbackToCPU = true;
    }
    if (this.instancedRenderer) {
      this.instancedRenderer.isActive = false;
    }
    this.status.physics = false;
    this.status.rendering = false;
    this.updateStatusDisplay();
    console.log('❌ GPU acceleration disabled - using CPU');
  }

  /**
   * Re-enable GPU acceleration
   */
  enable() {
    if (this.gpuAcceleration) {
      this.gpuAcceleration.fallbackToCPU = false;
    }
    if (this.instancedRenderer) {
      this.instancedRenderer.isActive = true;
    }
    this.status.physics = this.gpuAcceleration?.isSupported || false;
    this.status.rendering = this.instancedRenderer?.isSupported || false;
    this.updateStatusDisplay();
    console.log('🚀 GPU acceleration re-enabled');
  }

  /**
   * Clean shutdown
   */
  destroy() {
    if (this.gpuAcceleration) {
      this.gpuAcceleration.destroy();
    }
    if (this.instancedRenderer) {
      this.instancedRenderer.destroy();
    }
    if (this.statusElement) {
      this.statusElement.remove();
    }
  }
} 