import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { overlapCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { shapeOfStyle, normalizeStyle } = await server.ssrLoadModule('/src/links/style.js');
  const links = decode('20 12');
  const base = shapeOfStyle(normalizeStyle(), 2);
  let best = { cost: Infinity };
  for (let a = 0; a <= 28; a++)
    for (let b = 0; b <= 28; b++) {
      const shape = {
        ...base,
        linkGaps: [
          [a / 100, null, null, null],
          [b / 100, null, null, null],
        ],
      };
      const cost = overlapCost(links, shape);
      if (cost < best.cost) best = { cost, a: a / 100, b: b / 100 };
    }
  console.log(best);
} finally {
  await server.close();
}
