// Finite numerical fixtures: archive solver choices, exact scores and timings.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions, overlapCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const links = [
    [2, 2],
    [2, 2],
  ];
  const results = [];
  for (const patch of [
    {},
    { gaps: '0.18 0.18 ~ ~' },
    { turns: '15 -15', gaps: '0.18 0.18 ~ ~' },
    { clearance: 0 },
    { clearance: 4 },
    { clearance: 6 },
  ]) {
    const style = normalizeStyle({ rotation: 90, ...patch });
    const shape = shapeOfStyle(style, 2);
    const start = performance.now();
    const solved = solveCollisions(links, shape, { adjustGaps: true });
    const result = { patch, ms: performance.now() - start, original: overlapCost(links, shape), ...solved };
    console.log(JSON.stringify(result));
    results.push(result);
  }
  await writeFile('docs/case-studies/issue-25/data/solver.json', JSON.stringify(results, null, 2));
} finally {
  await server.close();
}
