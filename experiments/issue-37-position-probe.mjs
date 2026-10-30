// Quantify image fitting movement separately from actual layout preservation.
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { randomNetworks } from './issue-37-networks.mjs';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { glyphCurves } = await server.ssrLoadModule('/src/links/glyph.js');
  for (const code of ['34442132', '2222', ...randomNetworks()]) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), links.length);
    const result = solveCollisions(links, shape, { adjustGaps: true });
    const before = glyphCurves(links, shape);
    const after = glyphCurves(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame });
    assert.deepEqual(
      after.map((c) => c.middle.at),
      before.map((c) => c.middle.at),
      `${code}: changed image coordinates`,
    );
    console.log(
      JSON.stringify({
        code,
        before: before.map((c) => c.middle.at),
        after: after.map((c) => c.middle.at),
        maxMovement: Math.max(
          ...before.map((c, i) => Math.hypot(...c.middle.at.map((v, k) => v - after[i].middle.at[k]))),
        ),
      }),
    );
  }
} finally {
  await server.close();
}
