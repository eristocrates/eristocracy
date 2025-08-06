import ForceGraph3D from 'https://cdn.skypack.dev/3d-force-graph';

const N = 100;
const gData = {
  nodes: [...Array(N).keys()].map((i) => ({ id: i })),
  links: [...Array(N).keys()]
    .filter((id) => id)
    .map((id) => ({
      source: id,
      target: Math.round(Math.random() * (id - 1)),
    })),
};

const Graph = ForceGraph3D()(document.getElementById('3d-graph'))
  .graphData(gData)
  .nodeAutoColorBy('id')
  .linkDirectionalParticles(2);
