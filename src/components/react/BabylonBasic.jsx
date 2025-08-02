import React, { useRef, useEffect, useState } from 'react';
// Remove all Babylon.js imports - they'll be dynamically imported in useEffect

const BabylonBasic = () => {
  const canvasRef = useRef();
  const engineRef = useRef();
  const sceneRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canvasElement, setCanvasElement] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    refStatus: false,
    elementStatus: false,
    dimensions: { width: 0, height: 0 }
  });

  // Step 1: Watch for canvas ref availability and setup ResizeObserver
  useEffect(() => {
    console.log("🔍 Setting up canvas ref watcher...");
    
    if (!canvasRef.current) {
      console.log("❌ Canvas ref not available yet");
      setDebugInfo(prev => ({ ...prev, refStatus: false }));
      return;
    }

    console.log("✅ Canvas ref available:", canvasRef.current);
    setDebugInfo(prev => ({ ...prev, refStatus: true }));

    // Use ResizeObserver to wait for valid dimensions
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      console.log(`📐 Canvas dimensions changed: ${width}x${height}`);
      
      setDebugInfo(prev => ({ 
        ...prev, 
        dimensions: { width, height },
        elementStatus: width > 0 && height > 0
      }));

      // Only trigger Babylon initialization when canvas has valid dimensions
      if (width > 0 && height > 0) {
        console.log("🎯 Canvas has valid dimensions, triggering Babylon init");
        setCanvasElement(canvasRef.current);
      } else {
        console.log("⚠️ Canvas dimensions still invalid, waiting...");
        setCanvasElement(null);
      }
    });

    observer.observe(canvasRef.current);

    return () => {
      console.log("🧹 Cleaning up ResizeObserver");
      observer.disconnect();
    };
  }, []); // Only run once on mount

  // Step 2: Initialize Babylon.js only when canvas element is valid
  useEffect(() => {
    if (!canvasElement) {
      console.log("⏳ Canvas element not ready yet, waiting...");
      return;
    }

    const initEngine = async () => {
      try {
        console.log("🚀 Canvas ready, dynamically importing Babylon.js...");
        
        // Defensive check: Ensure canvas still has valid dimensions
        const rect = canvasElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          console.error("❌ Canvas has invalid dimensions at init time:", rect);
          setError("Canvas has zero dimensions during initialization");
          return;
        }
        
        // Dynamically import Babylon.js modules - avoids SSR execution
        const {
          Engine,
          Scene,
          FreeCamera,
          HemisphericLight,
          MeshBuilder,
          Vector3,
          Color3,
          WebGPUEngine
        } = await import('@babylonjs/core');
        
        console.log("📦 Babylon.js modules loaded, initializing with canvas:", canvasElement);
        console.log("📐 Final canvas dimensions:", rect.width, "x", rect.height);
        
        let engine;
        
        // Try WebGPU first (Firefox should support this)
        if (navigator.gpu) {
          try {
            console.log("🔮 WebGPU available, creating WebGPU engine...");
            engine = new WebGPUEngine(canvasElement);
            await engine.initAsync();
            console.log("✅ WebGPU engine created successfully!");
          } catch (webgpuError) {
            console.warn("⚠️ WebGPU initialization failed, falling back to WebGL:", webgpuError);
            engine = null;
          }
        }
        
        // Fallback to WebGL if WebGPU failed or not available
        if (!engine) {
          console.log("🎮 Using WebGL engine...");
          engine = new Engine(canvasElement, true, {
            preserveDrawingBuffer: true,
            stencil: true,
          });
        }
        
        engineRef.current = engine;
        
        console.log("⚙️ Engine created, creating scene...");

        // Create a basic scene
        const scene = new Scene(engine);
        sceneRef.current = scene;
        
        console.log("🎬 Scene created, setting up objects...");
        
        // Set background color - more visible for testing
        scene.clearColor = new Color3(0.2, 0.4, 0.6);

        // This creates and positions a free camera - pulled back more and better FOV
        const camera = new FreeCamera("camera1", new Vector3(0, 5, -20), scene);
        camera.minZ = 0.1;
        camera.maxZ = 1000;
        camera.fov = 0.9;
        
        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());
        
        // This attaches the camera to the canvas
        camera.attachControl(canvasElement, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        
        // Brighter light for better visibility
        light.intensity = 1.0;

        // Our built-in 'sphere' shape - larger and more visible
        const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 4, segments: 32}, scene);
        
        // Move the sphere upward 1/2 its height
        sphere.position.y = 2;

        // Our built-in 'ground' shape - larger
        const ground = MeshBuilder.CreateGround("ground", {width: 12, height: 12}, scene);
        
        // Debug: Log all meshes in scene
        console.log("🎭 Meshes in scene:", scene.meshes.map(m => m.name));
        console.log("📹 Camera position:", camera.position);
        console.log("🎯 Camera target:", camera.getTarget());
        
        console.log("🔄 Objects created, starting render loop...");

        // Start the render loop
        const renderLoop = () => {
          scene.render();
        };

        engine.runRenderLoop(renderLoop);
        
        console.log("🎊 Render loop started! Engine type:", engine.constructor.name);
        setIsLoading(false);

        // Handle window resize
        const handleResize = () => {
          engine.resize();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          console.log("🧹 Cleaning up Babylon.js...");
          window.removeEventListener('resize', handleResize);
          if (engine) {
            engine.stopRenderLoop();
            engine.dispose();
          }
        };
        
      } catch (err) {
        console.error("💥 Engine initialization failed:", err);
        setError(`Engine failed: ${err.message}`);
        setIsLoading(false);
      }
    };

    initEngine();
  }, [canvasElement]); // Only run when canvas element is available

  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        Initializing Babylon.js (trying WebGPU first, WebGL fallback)...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'red',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h3>WebGPU Error:</h3>
          <p>{error}</p>
          <p>Try using Chrome Canary with --enable-unsafe-webgpu flag</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Live diagnostic instrumentation */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        pointerEvents: 'none',
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        <div>Canvas ref: {debugInfo.refStatus ? '✅' : '❌'}</div>
        <div>Canvas element: {debugInfo.elementStatus ? '✅' : '❌'}</div>
        <div>Dimensions: {debugInfo.dimensions.width}×{debugInfo.dimensions.height}</div>
        <div>Babylon state: {isLoading ? '⏳ Loading' : error ? '❌ Error' : '✅ Ready'}</div>
      </div>

      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          outline: 'none',
          border: '2px solid red', // Temporary - to see if canvas is rendering
          backgroundColor: 'blue'  // Temporary - to see canvas boundaries
        }} 
      />
      
      {!isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: '10px', 
          right: '10px',
          color: 'lime',
          padding: '10px',
          fontSize: '14px',
          pointerEvents: 'none',
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: '4px'
        }}>
          ✅ Babylon.js scene loaded!
        </div>
      )}
    </div>
  );
};

export default BabylonBasic;
