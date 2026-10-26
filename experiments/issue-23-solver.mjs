// Small deterministic fixtures: verify gaps can help even with turn search off.
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { STYLE_DEFAULTS, normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  for (const code of ['22 13 31', '23 31 12', '12 21', '11 22 12', '22 33 11']) {
    const links = decode(code);
    const result = solveCollisions(links, shapeOfStyle(STYLE_DEFAULTS, links.length), {
      range: 0,
      adjustGaps: true,
    });
    console.log(JSON.stringify({ code, ...result }));
  }
  for (const code of ['22 13 31', '23 31 12', '12 21', '00 00 00 00']) {
    const links = decode(code);
    const style = normalizeStyle({ free: 3 });
    const result = solveCollisions(links, shapeOfStyle(style, links.length), {
      range: 0,
      adjustGaps: true,
      gapRange: 0,
      middleRange: 15,
    });
    console.log(JSON.stringify({ kind: 'middle-only', code, ...result }));
  }
} finally {
  await server.close();
}
