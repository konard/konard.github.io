// Independent dense intersection evidence for fixed-placement adjustments.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { randomNetworks } from './issue-37-networks.mjs';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { bezier, glyphCurves, paintedCurve } = await server.ssrLoadModule('/src/links/glyph.js');
  const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const crossings = (curve) => {
    const points = curve.segments.map((s) => Array.from({ length: 129 }, (_, k) => bezier(s, k / 128)));
    let count = 0;
    for (let i = 1; i < 129; i++)
      for (let j = 1; j < 129; j++) {
        const [a, b, c, d] = [points[0][i - 1], points[0][i], points[1][j - 1], points[1][j]];
        if (side(a, b, c) * side(a, b, d) < -1e-20 && side(c, d, a) * side(c, d, b) < -1e-20) count++;
      }
    return count;
  };
  const rows = [];
  for (const code of ['34442132', '2222', ...randomNetworks()]) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), links.length);
    for (const range of [15, 30, 180]) {
      const result = solveCollisions(links, shape, { adjustGaps: true, range });
      const solved = { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame };
      const row = {
        code,
        range,
        before: glyphCurves(links, shape).map((c) => crossings(paintedCurve(c, shape))),
        after: glyphCurves(links, solved).map((c) => crossings(paintedCurve(c, solved))),
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  await writeFile('docs/case-studies/issue-37/data/local-crossings.json', JSON.stringify(rows, null, 2) + '\n');
} finally {
  await server.close();
}
