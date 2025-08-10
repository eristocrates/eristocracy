// Import required classes from PixiJS and Three.js
import { Container, Graphics, Text, WebGLRenderer } from 'pixi.js';
import * as THREE from 'three';

// Self-executing async function to set up the demo
(async () => {
  // Initialize window dimensions
  let WIDTH = window.innerWidth;
  let HEIGHT = window.innerHeight;

  // === THREE.JS SETUP ===
  // Create Three.js WebGL renderer with antialiasing and stencil buffer
  const threeRenderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });

  // Configure Three.js renderer size and background color
  threeRenderer.setSize(WIDTH, HEIGHT);
  threeRenderer.setClearColor(0xdddddd, 1); // Light gray background
  document.body.appendChild(threeRenderer.domElement);

  const scene = new THREE.Scene();
  const threeCamera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 0.1, 1000);
  threeCamera.position.z = 50;
  scene.add(threeCamera);

  const boxGeometry = new THREE.BoxGeometry(30, 30, 30);
  const basicMaterial = new THREE.MeshBasicMaterial({ color: 0x0095dd });
  const cube = new THREE.Mesh(boxGeometry, basicMaterial);
  scene.add(cube);

  // === PIXI.JS SETUP ===
  const pixiRenderer = new WebGLRenderer();
  await pixiRenderer.init({
    context: threeRenderer.getContext(),
    width: WIDTH,
    height: HEIGHT,
    clearBeforeRender: false,
  });

  const stage = new Container();
  const uiLayer = new Graphics().roundRect(20, 80, 300, 300, 20).fill(0xffff00);
  const text = new Text({ text: 'Pixi and Three.js', style: { fontFamily: 'Arial', fontSize: 24, fill: 'black' } });
  uiLayer.addChild(text);
  stage.addChild(uiLayer);

  function loop() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    uiLayer.y = ((Math.sin(Date.now() * 0.001) + 1) * 0.5 * HEIGHT) / 2; // Adjusted for height

    threeRenderer.resetState();
    threeRenderer.render(scene, threeCamera);
    pixiRenderer.resetState();
    pixiRenderer.render({ container: stage });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Handle resizing from the host
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      WIDTH = entry.contentRect.width;
      HEIGHT = entry.contentRect.height;

      threeRenderer.setSize(WIDTH, HEIGHT);
      threeCamera.aspect = WIDTH / HEIGHT;
      threeCamera.updateProjectionMatrix();
      pixiRenderer.resize(WIDTH, HEIGHT);
    }
  });
  resizeObserver.observe(targetElement);

})();

