// Old vs staged solver on seeded real networks with 4–10 links: collisions and time.
// Usage: node experiments/issue-43-solver-sizes.mjs [sizes] [per size]
import { createServer } from 'vite';
const [sizes = '4,5,6,8,10', count = '3'] = process.argv.slice(2);
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const fresh = await server.ssrLoadModule('/src/links/collisions.js');
  const old = await server.ssrLoadModule('/experiments/issue-43-collisions-before.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  let seed = 4343;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const n of sizes.split(',').map(Number))
    for (let k = 0; k < Number(count); k++) {
      const pairs = Array.from({ length: n }, () => `${1 + Math.floor(random() * n)}${1 + Math.floor(random() * n)}`);
      const links = decode(pairs.join(' '));
      const row = { code: pairs.join('') };
      for (const [name, module, range] of [
        ['old', old, 30],
        ['new', fresh, 180],
      ]) {
        const shape = shapeOfStyle(normalizeStyle({}), links);
        const t = performance.now();
        const r = module.solveCollisions(links, shape, {
          adjustGaps: true,
          range,
          step: 1,
          gapRange: 0.2,
          middleRange: 0,
        });
        row[name] = {
          after: +(r.after - fresh.turningCost(r.turns)).toFixed(3),
          ms: Math.round(performance.now() - t),
        };
      }
      console.log(JSON.stringify(row));
    }
} finally {
  await server.close();
}
