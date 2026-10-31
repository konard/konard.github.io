// Collision landscape of one link's two end turns (others fixed) for a network.
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { overlapCost, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { readNetwork } = await server.ssrLoadModule('/src/pages/NetworkPage.jsx');
  const { links, style } = readNetwork('?' + (process.argv[2] || 'code=2211'));
  const shape = shapeOfStyle(style, links);
  const i = Number(process.argv[3] || 0);
  const step = Number(process.argv[4] || 30);
  const zeros = [];
  for (let a = -180; a <= 180; a += step) {
    const row = [];
    for (let b = -180; b <= 180; b += step) {
      const turns = links.map((_, k) => (k === i ? [a, b] : shape.turns[k] || [0, 0]));
      const c = overlapCost(links, { ...shape, turns }) - turningCost(turns);
      row.push(c.toFixed(1).padStart(5));
      if (c < 1e-9) zeros.push([a, b]);
    }
    console.log(String(a).padStart(4), row.join(' '));
  }
  console.log('zero-cost', JSON.stringify(zeros));
} finally {
  await server.close();
}
