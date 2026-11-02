// Issue #49: writes the editor geometry of the two-link networks whose
// references lay on top of each other, at zero turns and with every end turned by
// 0° or 45°, so a test can compare the new zero with the old turned pictures.
//   OUT=docs/case-studies/issue-49/data/geometry-before.json node experiments/issue-49-geometry.mjs
import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const CODES = [
  '0201',
  '0210',
  '0212',
  '0221',
  '1201',
  '1210',
  '1212',
  '1221',
  '2001',
  '2010',
  '2012',
  '2021',
  '2101',
  '2110',
  '2112',
  '2121',
];
// Zero, and every combination of 0° and 45° at the four ends.
const TURNS = [''].concat(
  Array.from({ length: 16 }, (_, k) => [0, 1, 2, 3].map((b) => ((k >> b) & 1) * 45)).map(
    ([a, b, c, d]) => `${a} ${b}, ${c} ${d}`,
  ),
);
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { layoutCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  const round = (v) => (Array.isArray(v) ? v.map(round) : Math.round(v * 1e9) / 1e9);
  const out = {};
  for (const code of CODES) {
    const links = decode(code.match(/../g).join(' '));
    out[code] = {};
    for (const turns of TURNS) {
      const curves = layoutCurves(links, shapeOfStyle(normalizeStyle(turns ? { turns } : {}), links));
      out[code][turns || '0'] = curves.map((c) => round(c.segments));
    }
  }
  const file = process.env.OUT || 'docs/case-studies/issue-49/data/geometry-after.json';
  await writeFile(file, `${JSON.stringify(out)}\n`);
  console.log('wrote', file);
} finally {
  await server.close();
}
