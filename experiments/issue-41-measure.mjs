import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { reported, randomNetworks } from './issue-41-cases.mjs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { layoutCurves, glyphCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  const { normalizeStyle, shapeOfStyle, withSpacing } = await server.ssrLoadModule('/src/links/style.js');
  const { overlapCost, solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const results = [];
  for (const { code } of [...reported, ...randomNetworks().map((code) => ({ code }))]) {
    const links = decode(code.match(/../g).join(' '));
    const style = normalizeStyle();
    const before = shapeOfStyle(style, links.length);
    const after = shapeOfStyle(style, links);
    assert.deepEqual(after.linkGaps, before.linkGaps);
    const start = performance.now();
    const solved = solveCollisions(links, after, { adjustGaps: true });
    assert(solved.after <= solved.before + 1e-9);
    const original = glyphCurves(links, after);
    glyphCurves(links, shapeOfStyle(withSpacing(style, solved), links)).forEach((curve, i) =>
      assert.deepEqual(curve.middle.at, original[i].middle.at),
    );
    const result = {
      code,
      defaultTurns: after.turns,
      beforeCost: overlapCost(links, before),
      defaultCost: overlapCost(links, after),
      originalCurves: layoutCurves(links, before),
      defaultCurves: layoutCurves(links, after),
      configuredGaps: { start: style.startGap, end: style.endGap, perLink: style.gaps },
      solved: { turns: solved.turns, gaps: solved.linkGaps, before: solved.before, after: solved.after },
      milliseconds: performance.now() - start,
    };
    results.push(result);
    console.log(
      JSON.stringify({
        code,
        turns: after.turns,
        before: result.beforeCost,
        after: result.defaultCost,
        solved: solved.after,
      }),
    );
  }
  await writeFile('docs/case-studies/issue-41/data/measurements.json', JSON.stringify(results, null, 2) + '\n');
} finally {
  await server.close();
}
