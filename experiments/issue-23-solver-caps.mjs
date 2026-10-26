// Independently measure the visible, fitted halves after all gap/angle changes.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const { bezier, glyphCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  const { STYLE_DEFAULTS, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  for (const n of [3, 6, 12, 24]) {
    const links = Array.from({ length: n }, (_, i) => [((i + 1) % n) + 1, ((i + Math.floor(n / 2)) % n) + 1]);
    const shape = shapeOfStyle(STYLE_DEFAULTS, n);
    const result = solveCollisions(links, shape, { range: 0, adjustGaps: true, gapRange: 1, middleRange: 15 });
    const violations = [];
    glyphCurves(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps }).forEach((curve, i) => {
      curve.segments.forEach((segment, k) => {
        let length = 0;
        let previous = segment[0];
        for (let j = 1; j <= 1024; j++) {
          const p = bezier(segment, j / 1024);
          length += Math.hypot(p[0] - previous[0], p[1] - previous[1]);
          previous = p;
        }
        const cut = result.linkGaps[i]?.[k + 2] ?? 0;
        if (cut > length * 0.3 + 0.001) violations.push({ i, k, cut, length });
      });
    });
    console.log(JSON.stringify({ n, violations }));
    assert.deepEqual(violations, []);
  }
} finally {
  await server.close();
}
