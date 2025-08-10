// src/lib/sandbox-loader.js
var worker = new Worker("/sandbox-worker-bundle.js", { type: "module" });
window.addEventListener("message", (event) => {
  if (event.data && event.data.code) {
    const { code, form } = event.data;
    if (form === "graphical") {
      document.body.innerHTML = "";
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      const offscreen = canvas.transferControlToOffscreen();
      worker.postMessage({ code, canvas: offscreen }, [offscreen]);
    } else {
      worker.postMessage({ code });
    }
  }
});
worker.addEventListener("message", (event) => {
  window.parent.postMessage(event.data, "*");
});
