// Bounded geometric and solver probes; no stress inputs. Run before/after a fix.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { glyphCurves, paintedCurve } = await server.ssrLoadModule('/src/links/glyph.js');
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const links = [
    [1, 1],
    [1, 1],
  ];
  const results = [];
  for (const gap of [0, 0.01, 0.06, 0.07, 0.079999, 0.08, 0.080001, 0.09]) {
    const style = normalizeStyle({ rotation: -90, turns: '0 0,-15 15', gaps: `0.08 ${gap} ~ ~,0.18 0.18 ~ ~` });
    const shape = shapeOfStyle(style, 2);
    const raw = glyphCurves(links, shape)[0];
    const painted = paintedCurve(raw, shape);
    const cap = style.strokeWidth / 2;
    const extra = cap / Math.sin((style.endAngle * Math.PI) / 180);
    const apex = painted.end.at.map((v, i) => v + extra * painted.end.dir[i]);
    const source = Math.hypot(...raw.start.at.map((v, i) => v - raw.middle.at[i])) - cap;
    const target = Math.hypot(...apex.map((v, i) => v - raw.middle.at[i]));
    results.push({ gap, source, target, rawEnd: raw.end.at, paintedEnd: painted.end.at, apex });
  }
  const shape = shapeOfStyle(normalizeStyle({ rotation: -90 }), 2);
  results.push({ solver: solveCollisions(links, shape, { adjustGaps: true }) });
  console.log(JSON.stringify(results, null, 2));
  if (process.env.RESULT_FILE) await writeFile(process.env.RESULT_FILE, JSON.stringify(results, null, 2));
} finally {
  await server.close();
}
