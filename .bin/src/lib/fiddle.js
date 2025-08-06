import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import * as THREE from "three";

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

// Create multiple objects to demonstrate
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const materials = [
  new THREE.MeshPhongMaterial({ color: 0xff6b6b }), // Red
  new THREE.MeshPhongMaterial({ color: 0x4ecdc4 }), // Teal
  new THREE.MeshPhongMaterial({ color: 0x45b7d1 }), // Blue
  new THREE.MeshPhongMaterial({ color: 0xffa500 }), // Orange
];

const cubes = [];
for (let i = 0; i < 20; i++) {
  const material = materials[i % materials.length];
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = (Math.random() - 0.5) * 10;
  cube.position.y = (Math.random() - 0.5) * 10;
  cube.position.z = (Math.random() - 0.5) * 10;
  scene.add(cube);
  cubes.push(cube);
}

// Add a light source
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

camera.position.z = 15;
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate cubes
  cubes.forEach((cube, index) => {
    cube.rotation.x += 0.01 + (index * 0.0005);
    cube.rotation.y += 0.01 + (index * 0.001);
  });

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = surface.clientWidth / surface.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(surface.clientWidth, surface.clientHeight);
});

console.log("Three.js fiddle ready!");`;

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

  // Setup resize functionality
  setupResizeHandle();

  // CodeMirror editor
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
          "height": "100%"
        },
        ".cm-editor": {
          "height": "100%"
        },
        ".cm-focused": {
          "outline": "none"
        },
        ".cm-content": {
          "padding": "12px",
          "min-height": "100%"
        }
      })
    ],
    scrollbarStyle: "native"  // Explicitly enable native scrollbars
  });

  // Run code function
  function runCode() {
    const code = view.state.doc.toString();

    try {
      console.clear();
      console.log("🚀 Running code...");

      // Clear previous render surface
      surface.innerHTML = '';

      // Create a sandboxed function with THREE and surface available
      const scopedFn = new Function("THREE", "surface", "console", code);
      scopedFn(THREE, surface, console);

      console.log("✅ Code executed successfully");

    } catch (error) {
      console.error("❌ Execution error:", error);

      // Show error in the render surface
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
  }

  // Event listeners
  runBtn.onclick = runCode;
  clearBtn.onclick = clearOutput;

  // Focus editor on load
  view.focus();

  console.log("🎨 Three.js Fiddle ready!");
  console.log("💡 Edit code on the left, run it to see results on the right");
} 