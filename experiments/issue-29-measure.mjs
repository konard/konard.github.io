import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true } });
const phase = process.env.PHASE || 'after';
try {
  const { solveCollisions, overlapCost, visiblePolyline } = await server.ssrLoadModule('/src/links/collisions.js');
  const { layoutCurves, curveTransform } = await server.ssrLoadModule('/src/links/glyph.js');
  const referenceSpaces =
    phase === 'before' ? null : (await server.ssrLoadModule('/src/links/collision-symmetry.js')).referenceSpaces;
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const links = [
    [1, 1],
    [1, 1],
  ];
  const records = [];
  for (const [name, patch] of [
    ['default', {}],
    ['manual', { turns: ',-15 15', gaps: ',0.18 0.18' }],
    ...[5, 10, 15].map((a) => [`manual-${a}`, { turns: `0 5,-${a} ${a}`, gaps: '0.08 ~ 0,0.18 0.18 0' }]),
  ]) {
    const shape = shapeOfStyle(normalizeStyle({ rotation: -90, ...patch }), 2);
    const started = performance.now();
    const result = solveCollisions(links, shape, { adjustGaps: true });
    const solved = { ...shape, turns: result.turns, linkGaps: result.linkGaps };
    const curves = layoutCurves(links, solved);
    const { scale } = curveTransform(curves, solved);
    const lines = curves.map((c, i) => visiblePolyline(c, solved, i, scale));
    records.push({
      name,
      shape,
      score: overlapCost(links, shape),
      result,
      ...(referenceSpaces ? { spaces: referenceSpaces(lines[1], lines[0], scale) } : {}),
      milliseconds: performance.now() - started,
    });
  }
  await mkdir('docs/case-studies/issue-29/data', { recursive: true });
  await writeFile(`docs/case-studies/issue-29/data/measure-${phase}.json`, JSON.stringify(records, null, 2) + '\n');
  console.log(records.map(({ name, score, result, milliseconds }) => ({ name, score, result, milliseconds })));
} finally {
  await server.close();
}
