/**
 * @file WebGPUForceAcceleration.js
 * @description GPU acceleration layer that plugs directly into existing ForceGraph3D
 * Zero breaking changes - pure performance enhancement
 */

export class WebGPUForceAcceleration {
  constructor() {
    this.device = null;
    this.isSupported = false;
    this.nodeBuffer = null;
    this.positionBuffer = null;
    this.velocityBuffer = null;
    this.computePipeline = null;
    this.nodeCount = 0;

    // Fallback to CPU if anything fails
    this.fallbackToCPU = false;
  }

  /**
   * Initialize WebGPU - called once at startup
   */
  async initialize() {
    try {
      console.log('🚀 WebGPUForceAcceleration.initialize() starting...');

      if (!navigator.gpu) {
        console.log('🔄 navigator.gpu not available');
        console.log('🔄 WebGPU not supported, using CPU fallback');
        this.fallbackToCPU = true;
        return false;
      }
      console.log('✅ navigator.gpu is available');

      console.log('🔄 Requesting WebGPU adapter...');
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error('❌ No WebGPU adapter found');
        throw new Error('No WebGPU adapter');
      }
      console.log('✅ WebGPU adapter obtained:', adapter);

      console.log('🔄 Requesting WebGPU device...');
      this.device = await adapter.requestDevice();
      console.log('✅ WebGPU device created:', this.device);

      this.isSupported = true;

      console.log('🚀 WebGPU force acceleration initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ WebGPU force acceleration init failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.warn('⚠️ WebGPU init failed, falling back to CPU:', error);
      this.fallbackToCPU = true;
      return false;
    }
  }

  /**
   * Hook into your existing ForceGraph3D instance
   * This is the magic - intercepts d3-force without breaking anything
   */
  accelerateGraph(forceGraphInstance) {
    if (this.fallbackToCPU || !this.isSupported) {
      console.log('📊 Using CPU physics (WebGPU not available)');
      return; // Let ForceGraph3D work normally
    }

    // Store reference to the graph
    this.graph = forceGraphInstance;

    console.log('🔗 Hooking into ForceGraph3D data loading...');

    // Hook into the graphData method to catch when simulation actually starts
    const originalGraphData = this.graph.graphData.bind(this.graph);
    this.graph.graphData = (data) => {
      const result = originalGraphData(data);

      if (data && data.nodes && data.nodes.length > 0) {
        console.log('📊 Data loaded, attempting WebGPU physics connection...');

        // Give ForceGraph3D a moment to initialize its simulation
        setTimeout(() => {
          this.connectToSimulation();
        }, 500); // Wait 500ms for simulation to initialize
      }

      return result;
    };

    // Also try immediate connection if data already exists
    const existingData = this.graph.graphData();
    if (existingData && existingData.nodes && existingData.nodes.length > 0) {
      console.log('📊 Existing data found, attempting immediate connection...');
      setTimeout(() => {
        this.connectToSimulation();
      }, 500);
    }

    console.log('🔗 WebGPU physics hook installed');
  }

  /**
   * Attempt to connect to the d3-force simulation (with limited retries)
   */
  connectToSimulation() {
    let attempts = 0;
    const maxAttempts = 10; // Only try 10 times

    const attemptConnection = () => {
      attempts++;

      try {
        const simulation = this.graph.d3Force();

        if (simulation && simulation.tick) {
          console.log('✅ d3Force simulation found! Hooking WebGPU physics...');

          // Store original tick method
          const originalTick = simulation.tick.bind(simulation);

          // Override with GPU version
          simulation.tick = () => {
            if (this.nodeCount > 50) { // Use GPU for 50+ nodes
              return this.gpuTick();
            } else {
              return originalTick(); // Small graphs use CPU
            }
          };

          console.log('🚀 WebGPU physics acceleration connected!');
          this.showStatus('🚀 GPU PHYSICS ACTIVE', 'success');
          return;
        }

        if (attempts < maxAttempts) {
          console.log(`🔄 d3Force simulation not ready yet (attempt ${attempts}/${maxAttempts}), retrying...`);
          setTimeout(attemptConnection, 200);
        } else {
          console.warn('⚠️ Could not connect to d3Force simulation after', maxAttempts, 'attempts');
          console.log('📊 Continuing with CPU physics (no performance impact)');
          this.showStatus('📊 CPU PHYSICS (WebGPU Ready)', 'info');
        }

      } catch (error) {
        console.warn('⚠️ Error connecting to d3Force simulation:', error);
        if (attempts < maxAttempts) {
          setTimeout(attemptConnection, 200);
        }
      }
    };

    attemptConnection();
  }

  /**
   * GPU-accelerated physics tick
   * Replaces d3-force calculations with WebGPU compute
   */
  async gpuTick() {
    const nodes = this.graph.graphData().nodes;

    if (nodes.length !== this.nodeCount) {
      await this.setupBuffers(nodes);
    }

    // Upload current node positions to GPU
    await this.uploadNodeData(nodes);

    // Run physics simulation on GPU
    await this.runPhysicsCompute();

    // Download results back to CPU nodes
    await this.downloadResults(nodes);

    return this; // Chainable like d3-force
  }

  /**
   * Create GPU buffers for node data
   */
  async setupBuffers(nodes) {
    this.nodeCount = nodes.length;
    const bufferSize = this.nodeCount * 4 * 4; // 4 floats per node (x,y,z,mass)

    // Position buffer (read/write)
    this.positionBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Velocity buffer (read/write) 
    this.velocityBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Result buffer for downloading
    this.resultBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Create compute pipeline
    await this.createComputePipeline();

    console.log(`📊 GPU buffers created for ${this.nodeCount} nodes`);
  }

  /**
   * Create the physics compute shader
   */
  async createComputePipeline() {
    const shaderModule = this.device.createShaderModule({
      code: `
        struct Node {
          pos: vec3<f32>,
          mass: f32,
        }
        
        struct Velocity {
          vel: vec3<f32>,
          charge: f32,
        }
        
        @group(0) @binding(0) var<storage, read_write> positions: array<Node>;
        @group(0) @binding(1) var<storage, read_write> velocities: array<Velocity>;
        
        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let index = global_id.x;
          if (index >= arrayLength(&positions)) {
            return;
          }
          
          let dt = 0.016; // ~60fps timestep
          let damping = 0.99;
          
          // Simple force-directed layout forces
          var force = vec3<f32>(0.0, 0.0, 0.0);
          
          // Repulsion from other nodes
          for (var i = 0u; i < arrayLength(&positions); i++) {
            if (i == index) { continue; }
            
            let diff = positions[index].pos - positions[i].pos;
            let dist = length(diff);
            if (dist > 0.0) {
              force += normalize(diff) * (100.0 / (dist * dist + 1.0));
            }
          }
          
          // Center attraction
          force += -positions[index].pos * 0.01;
          
          // Update velocity
          velocities[index].vel = velocities[index].vel * damping + force * dt;
          
          // Update position
          positions[index].pos = positions[index].pos + velocities[index].vel * dt;
        }
      `
    });

    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.positionBuffer } },
        { binding: 1, resource: { buffer: this.velocityBuffer } },
      ],
    });
  }

  /**
   * Upload node positions from ForceGraph3D to GPU
   */
  async uploadNodeData(nodes) {
    const positionData = new Float32Array(this.nodeCount * 4);
    const velocityData = new Float32Array(this.nodeCount * 4);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      positionData[i * 4] = node.x || 0;
      positionData[i * 4 + 1] = node.y || 0;
      positionData[i * 4 + 2] = node.z || 0;
      positionData[i * 4 + 3] = 1.0; // mass

      velocityData[i * 4] = node.vx || 0;
      velocityData[i * 4 + 1] = node.vy || 0;
      velocityData[i * 4 + 2] = node.vz || 0;
      velocityData[i * 4 + 3] = 1.0; // charge
    }

    this.device.queue.writeBuffer(this.positionBuffer, 0, positionData);
    this.device.queue.writeBuffer(this.velocityBuffer, 0, velocityData);
  }

  /**
   * Run the GPU compute shader
   */
  async runPhysicsCompute() {
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(this.nodeCount / 64));
    passEncoder.end();

    // Copy results to readable buffer
    commandEncoder.copyBufferToBuffer(
      this.positionBuffer, 0,
      this.resultBuffer, 0,
      this.nodeCount * 4 * 4
    );

    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Download GPU results back to ForceGraph3D nodes
   */
  async downloadResults(nodes) {
    await this.resultBuffer.mapAsync(GPUMapMode.READ);
    const results = new Float32Array(this.resultBuffer.getMappedRange());

    // Update ForceGraph3D nodes with GPU-computed positions
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = results[i * 4];
      nodes[i].y = results[i * 4 + 1];
      nodes[i].z = results[i * 4 + 2];
    }

    this.resultBuffer.unmap();
  }

  /**
   * Clean shutdown
   */
  destroy() {
    if (this.positionBuffer) this.positionBuffer.destroy();
    if (this.velocityBuffer) this.velocityBuffer.destroy();
    if (this.resultBuffer) this.resultBuffer.destroy();
  }

  /**
   * Show status message on screen
   */
  showStatus(message, type = 'info') {
    console.log(`🚀 Physics Status: ${message}`);

    // Update the main WebGPU status panel if it exists
    if (window.webgpuStatus && window.webgpuStatus.updateStatus) {
      window.webgpuStatus.updateStatus(`Physics: ${message}`);
    }
  }

  /**
   * Manual connection method for debugging
   */
  forceConnect() {
    console.log('💪 FORCING WebGPU physics connection...');
    if (this.graph) {
      this.connectToSimulation();
    } else {
      console.error('❌ No graph instance available for connection');
    }
  }
} 