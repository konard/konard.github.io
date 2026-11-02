// Issue #49: every network of 1–3 links (4 + 81 + 4,096) and 25 seeded larger
// ones, drawn with the editor defaults (zero turns). For each pair of links it
// measures how much of one curve runs on top of the other (closer than 0.004
// layout units, sampled every ~0.005), so fully overlapping straight
// references like /network/?code=0201 are found without trusting the code
// that is being changed. PHASE=before|after writes
// docs/case-studies/issue-49/data/overlaps-<phase>.json; `after` also compares
// with `before`: a network that had no overlap must keep exactly its geometry.
//   node experiments/issue-49-overlaps.mjs
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const phase = process.env.PHASE || 'after';
const path = 'docs/case-studies/issue-49/data';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { codeAt, decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { overlapCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { layoutCurves, bezier } = await server.ssrLoadModule('/src/links/glyph.js');
  const before = phase === 'before' ? null : JSON.parse(await readFile(`${path}/overlaps-before.json`, 'utf8'));
  const points = (curve) =>
    curve.segments.flatMap((seg, k) => Array.from({ length: 200 }, (_, j) => bezier(seg, (j + (k ? 1 : 0)) / 200)));
  const EPS = 0.004;
  // A grid of the points of a curve, so a point finds its neighbours without scanning the curve.
  const gridOf = (line) => {
    const grid = new Map();
    for (const q of line) {
      const key = `${Math.floor(q[0] / EPS)},${Math.floor(q[1] / EPS)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(q);
    }
    return grid;
  };
  const near = (p, grid) => {
    const [x, y] = [Math.floor(p[0] / EPS), Math.floor(p[1] / EPS)];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const q of grid.get(`${x + dx},${y + dy}`) || [])
          if (Math.hypot(p[0] - q[0], p[1] - q[1]) < EPS) return true;
    return false;
  };
  // Length of `a` that runs within `eps` of `b`, without the 0.1 around each middle where links meet anyway.
  const shared = (a, b, middles) => {
    let total = 0;
    for (let k = 1; k < a.length; k++) {
      const p = a[k];
      if (middles.some((m) => Math.hypot(p[0] - m[0], p[1] - m[1]) < 0.1)) continue;
      if (near(p, b)) total += Math.hypot(p[0] - a[k - 1][0], p[1] - a[k - 1][1]);
    }
    return total;
  };
  const result = { phase, date: new Date().toISOString(), networks: 0, overlapping: {}, changed: [], digests: {} };
  const codes = [];
  for (let n = 1; n <= 3; n++) for (let i = 0; i < (n + 1) ** (2 * n); i++) codes.push(codeAt(n, i));
  // Larger seeded networks (a fixed linear congruential sequence of indices).
  let seed = 49;
  for (const n of [4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6]) {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    codes.push(codeAt(n, seed % (n + 1) ** (2 * n)));
  }
  for (const code of codes) {
    const links = decode(code);
    const shape = shapeOfStyle(normalizeStyle(), links);
    const curves = layoutCurves(links, shape);
    const digest = createHash('sha1')
      .update(
        curves
          .map((c) =>
            c.segments
              .flat(2)
              .map((v) => v.toFixed(9))
              .join(','),
          )
          .join(';'),
      )
      .digest('hex')
      .slice(0, 16);
    result.networks++;
    result.digests[code] = digest;
    const lines = curves.map(points);
    const grids = lines.map(gridOf);
    const middles = curves.map((c) => c.middle.at);
    const pairs = [];
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++) {
        const length = shared(lines[i], grids[j], middles);
        if (length > 0.05) pairs.push([i + 1, j + 1, +length.toFixed(3)]);
      }
    if (pairs.length) result.overlapping[code] = { pairs, cost: +overlapCost(links, shape).toFixed(3) };
    if (before && before.digests[code] !== digest) result.changed.push(code);
  }
  result.overlappingCount = Object.keys(result.overlapping).length;
  if (before) {
    result.changedWithoutOverlapBefore = result.changed.filter((code) => !(code in before.overlapping));
    result.stillOverlapping = Object.keys(result.overlapping).filter((code) => code in before.overlapping);
    result.newOverlaps = Object.keys(result.overlapping).filter((code) => !(code in before.overlapping));
  }
  const { digests, ...summary } = result;
  await writeFile(`${path}/overlaps-${phase}.json`, JSON.stringify({ ...summary, digests }, null, 1) + '\n');
  console.log(
    JSON.stringify(
      { ...summary, overlapping: Object.keys(summary.overlapping).slice(0, 80), changed: summary.changed.length },
      null,
      1,
    ),
  );
} finally {
  await server.close();
}
