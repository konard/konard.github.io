import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { shapeOfStyle, normalizeStyle } = await server.ssrLoadModule('/src/links/style.js');
  for (const code of ['34442132', '43434143', '33044224', '31324042']) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), 4);
    for (const order of ['1 2 4 3', '1 3 2 4', '1 3 4 2', '1 4 2 3', '1 4 3 2']) {
      const r = solveCollisions(
        links,
        { ...shape, order },
        { adjustGaps: true, range: 180, step: 13, passes: 2, restarts: 0 },
      );
      console.log(JSON.stringify({ code, order, collisions: r.after - turningCost(r.turns), result: r }));
    }
  }
} finally {
  await server.close();
}
