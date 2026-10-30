import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { shapeOfStyle, normalizeStyle } = await server.ssrLoadModule('/src/links/style.js');
  for (const code of ['2012', '032113', '33044224', '31324042']) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), links.length);
    for (const placement of ['auto']) {
      for (const spread of [0.5, 0.7, 0.9, 1]) {
        const r = solveCollisions(
          links,
          { ...shape, placement, spread },
          { adjustGaps: true, range: 180, step: 13, passes: 3, restarts: 0 },
        );
        console.log(JSON.stringify({ code, placement, spread, collisions: r.after - turningCost(r.turns), result: r }));
        if (r.after - turningCost(r.turns) < 1e-9) break;
      }
    }
  }
} finally {
  await server.close();
}
