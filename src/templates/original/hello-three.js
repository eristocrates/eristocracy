import * as THREE from "three";

// Basic Three.js setup
const scene = new THREE.Scene();

// Create a container that fills the sandboxed document
const container = document.createElement('div');
Object.assign(container.style, {
  position: 'absolute',
  inset: '0',
  overflow: 'hidden'
});
document.body.appendChild(container);

function getSize() {
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  return { w, h };
}

const { w, h } = getSize();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x1a1a1a); // Dark background
container.appendChild(renderer.domElement);

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
  const { w, h } = getSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

console.log("Three.js fiddle ready!");
