import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { reported } from './issue-41-cases.mjs';

// A finite census, never a random search: 4 + 81 + 4,096 topologies.
const phase = process.env.PHASE || 'after';
const path = 'docs/case-studies/issue-43/data';
const baselineRef = 'c0f088933bfa7cb152aa1d25df39965995a34945';
const baselineSource = execFileSync('git', ['show', `${baselineRef}:src/links/glyph.js`], {
  encoding: 'utf8',
}).replaceAll("from './", "from '/src/links/");
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  plugins: [
    {
      name: 'issue-43-parent-geometry',
      resolveId: (id) => (id === 'virtual:parent-geometry' ? '\0parent-geometry' : null),
      load: (id) => (id === '\0parent-geometry' ? baselineSource : null),
    },
  ],
});
try {
  const { codeAt, decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { overlapCost, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { layoutCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  const parent = await server.ssrLoadModule('virtual:parent-geometry');
  const before = phase === 'before' ? null : JSON.parse(await readFile(`${path}/audit-before.json`, 'utf8'));
  const result = {
    phase,
    date: new Date().toISOString(),
    baselineRef,
    networks: 0,
    clear: [],
    regressions: [],
    unchangedFreeOrSelfHalves: 0,
    unchangedMiddles: 0,
  };
  for (let n = 1; n <= 3; n++) {
    for (let index = 0; index < (n + 1) ** (2 * n); index++) {
      const code = codeAt(n, index);
      const links = decode(code);
      const shape = shapeOfStyle(normalizeStyle(), links);
      const cost = overlapCost(links, shape) - turningCost(shape.turns);
      result.networks++;
      if (cost < 1e-8) result.clear.push(code);
      if (before?.clear.includes(code) && cost > 1e-8) result.regressions.push({ code, cost });
      if (phase !== 'before') {
        assert(
          shape.turns.flat().every((turn) => turn === 0),
          code,
        );
        const original = parent.layoutCurves(links, { ...shape, turns: parent.defaultTurns(links, shape) });
        for (const [i, curve] of layoutCurves(links, shape).entries()) {
          assert(curve.segments.flat(2).every(Number.isFinite), code);
          assert.deepEqual(curve.segments[0][3], curve.segments[1][0], code);
          assert.deepEqual(curve.middle, original[i].middle, code);
          result.unchangedMiddles++;
          links[i].forEach((ref, end) => {
            if (ref === 0 || ref === i + 1) {
              assert.deepEqual(curve.segments[end], original[i].segments[end], code);
              result.unchangedFreeOrSelfHalves++;
            }
          });
        }
      }
    }
  }
  if (phase !== 'before') {
    result.previousExamples = [];
    for (const { code, turns } of reported) {
      const links = decode(code.match(/../g).join(' '));
      const shape = shapeOfStyle(normalizeStyle(), links);
      const expected = parent.layoutCurves(links, {
        ...shape,
        turns: turns.split(',').map((row) => row.split(' ').map(Number)),
      });
      for (const [i, curve] of layoutCurves(links, shape).entries()) {
        for (const [k, point] of curve.segments.flat().entries()) {
          const old = expected[i].segments.flat()[k];
          assert(Math.hypot(point[0] - old[0], point[1] - old[1]) < 1e-10, code);
        }
      }
      result.previousExamples.push(code);
    }
  }
  await writeFile(`${path}/audit-${phase}.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ ...result, clear: result.clear.length }));
  if (phase !== 'before') assert.deepEqual(result.regressions, []);
} finally {
  await server.close();
}
