// src/lib/sandbox.js
var worker = new Worker("/sandbox-worker-bundle.js");
window.onmessage = (event) => {
  worker.postMessage(event.data);
};
worker.onmessage = (event) => {
  window.parent.postMessage(event.data, "*");
};
var appElement = document.getElementById("app");
if (appElement) {
  const canvas = document.createElement("canvas");
  appElement.appendChild(canvas);
  const offscreen = canvas.transferControlToOffscreen();
  worker.postMessage({ canvas: offscreen }, [offscreen]);
}
