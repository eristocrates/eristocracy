const worker = new Worker('/sandbox-worker-bundle.js');

// Forward messages from the main window to the worker
window.onmessage = (event) => {
  worker.postMessage(event.data);
};

// Forward messages from the worker to the main window
worker.onmessage = (event) => {
  window.parent.postMessage(event.data, '*');
};

// Handle graphical output
const appElement = document.getElementById('app');
if (appElement) {
  const canvas = document.createElement('canvas');
  appElement.appendChild(canvas);

  // Transfer control of the canvas to the worker.
  // This is a zero-copy operation, making it highly performant.
  const offscreen = canvas.transferControlToOffscreen();
  worker.postMessage({ canvas: offscreen }, [offscreen]);
} 