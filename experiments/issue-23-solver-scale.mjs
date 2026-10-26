// Finite dense layouts: record the cost of gap-only search as networks grow.
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const { STYLE_DEFAULTS, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  for (const n of [3, 6, 12, 24]) {
    const links = Array.from({ length: n }, (_, i) => [((i + 1) % n) + 1, ((i + Math.floor(n / 2)) % n) + 1]);
    const start = performance.now();
    const result = solveCollisions(links, shapeOfStyle(STYLE_DEFAULTS, n), { range: 0, adjustGaps: true });
    console.log(
      JSON.stringify({ n, milliseconds: performance.now() - start, before: result.before, after: result.after }),
    );
  }
} finally {
  await server.close();
}
