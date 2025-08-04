import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import * as THREE from "three";

// Default starter code
const defaultCode = `// Three.js Fiddle - Try this example!
// Clear the surface first
surface.innerHTML = '';

// Create scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, surface.clientWidth / surface.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(surface.clientWidth, surface.clientHeight);
renderer.setClearColor(0x1a1a1a);
surface.appendChild(renderer.domElement);

// Create a spinning cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ 
  color: 0xff6b6b,
  wireframe: true 
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = surface.clientWidth / surface.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(surface.clientWidth, surface.clientHeight);
});

console.log("Three.js scene created! 🎉");`;

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

  // Custom keymap for Ctrl+Enter
  const runKeymap = keymap.of([
    {
      key: "Ctrl-Enter",
      run: () => {
        runCode();
        return true;
      }
    }
  ]);

  const view = new EditorView({
    parent: editorContainer,
    doc: defaultCode,
    extensions: [
      basicSetup,
      javascript(),
      oneDark,
      runKeymap
    ]
  });

  // Run code function
  function runCode() {
    const code = view.state.doc.toString();

    try {
      console.clear();
      console.log("🚀 Running code...");

      // Create a sandboxed function with THREE and surface available
      const scopedFn = new Function("THREE", "surface", "console", code);
      scopedFn(THREE, surface, console);

      console.log("✅ Code executed successfully");
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
  }

  // Event listeners
  runBtn.onclick = runCode;
  clearBtn.onclick = clearOutput;

  // Focus editor on load
  view.focus();

  console.log("🎨 Three.js Fiddle ready!");
  console.log("💡 Tips:");
  console.log("- Press Ctrl+Enter to run code");
  console.log("- THREE is available globally");
  console.log("- Use 'surface' to add DOM elements");
  console.log("- Check console for errors");
} 