import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';

export default function ForceGraphClient() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const N = 100;
    const data = {
      nodes: [...Array(N).keys()].map((i) => ({ id: i })),
      links: [...Array(N).keys()]
        .filter((i) => i)
        .map((i) => ({ source: i, target: Math.round(Math.random() * (i - 1)) })),
    };

    ForceGraph3D()(ref.current)
      .graphData(data)
      .nodeAutoColorBy('id')
      .linkDirectionalParticles(2);
  }, []);

  return <div ref={ref} style={{ width: '100vw', height: '100vh' }} />;
}
