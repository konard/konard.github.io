// Bounded, deterministic issue fixtures; keep raw solutions and timings.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true } });
const phase = process.env.PHASE || 'after';
try {
  const { solveCollisions, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const records = [];
  for (const [code, patch] of [
    ['2222', {}],
    ['1111', {}],
    ['2222', { solveGapRange: 0.05 }],
    ['1111', { solveGapRange: 0.05 }],
    ['34442132', {}],
    ['34442132', { solveGapRange: 0.05, solveRange: 180, solveStep: 13 }],
  ]) {
    const links = decode(code.match(/../g).join(' '));
    const style = normalizeStyle(patch);
    const shape = shapeOfStyle(style, links.length);
    const options = { adjustGaps: true, range: style.solveRange, step: style.solveStep, gapRange: style.solveGapRange };
    const start = performance.now();
    const result = solveCollisions(links, shape, options);
    records.push({
      code,
      patch,
      shape,
      options,
      result,
      collisions: result.after - turningCost(result.turns),
      ms: performance.now() - start,
    });
  }
  await writeFile(`docs/case-studies/issue-37/data/measure-${phase}.json`, JSON.stringify(records, null, 2) + '\n');
  console.log(records.map(({ code, patch, result, collisions, ms }) => ({ code, patch, result, collisions, ms })));
} finally {
  await server.close();
}
