import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { reported, randomNetworks } from './issue-41-cases.mjs';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { layoutCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  const { overlapCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const results = [];
  for (const { code } of [...reported, ...randomNetworks().map((code) => ({ code }))]) {
    const links = decode(code.match(/../g).join(' '));
    const base = shapeOfStyle(normalizeStyle(), links);
    // Reconstruct the rejected candidate independently of the production guard.
    const curves = layoutCurves(links, { ...base, turns: links.map(() => [0, 0]) });
    base.turns = curves.map((curve, i) =>
      links[i].map((ref, end) => {
        if (!ref || ref === i + 1) return 0;
        const at = curve.middle.at;
        const to = curves[ref - 1].middle.at;
        const delta = end ? [to[0] - at[0], to[1] - at[1]] : [at[0] - to[0], at[1] - to[1]];
        const length = Math.hypot(...delta);
        const chord = delta.map((value) => value / length);
        if (chord[0] * curve.middle.dir[0] + chord[1] * curve.middle.dir[1] < 1 - 1e-10) return 0;
        const dir = (end ? curve.end : curve.start).dir;
        return (
          Math.round(
            (Math.atan2(dir[0] * chord[1] - dir[1] * chord[0], dir[0] * chord[0] + dir[1] * chord[1]) * 180) / Math.PI,
          ) || 0
        );
      }),
    );
    const variants = {};
    for (const kind of ['all', 'first', 'none']) {
      const turns = base.turns.map((pair, i) =>
        pair.map((angle, end) => {
          const ref = links[i][end];
          if (ref && links[ref - 1].includes(i + 1) && (kind === 'none' || (kind === 'first' && i > ref - 1))) return 0;
          return angle;
        }),
      );
      variants[kind] = { turns, cost: overlapCost(links, { ...base, turns }) };
    }
    results.push({ code, variants });
  }
  await writeFile(
    'docs/case-studies/issue-41/data/reciprocal-experiment.json',
    JSON.stringify(results, null, 2) + '\n',
  );
  results.forEach(({ code, variants }) =>
    console.log(code, Object.fromEntries(Object.entries(variants).map(([key, value]) => [key, value.cost]))),
  );
} finally {
  await server.close();
}
