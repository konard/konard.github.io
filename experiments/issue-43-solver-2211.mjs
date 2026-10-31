// Score 2211 drawings: default, current solver, and the manual -90/90 suggestion.
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const { solveCollisions, overlapCost, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { readNetwork } = await server.ssrLoadModule('/src/pages/NetworkPage.jsx');
  for (const q of (
    process.argv[2] || 'code=2211,code=2211&turns=-90+90,code=2211&turns=90+-90,code=2211&turns=-90+90,90+-90'
  ).split(',')) {
    const { links, style } = readNetwork('?' + q.replaceAll(';', ','));
    const shape = shapeOfStyle(style, links);
    const t0 = performance.now();
    const s = solveCollisions(links, shape, {
      adjustGaps: true,
      range: style.solveRange,
      step: style.solveStep,
      gapRange: style.solveGapRange,
      middleRange: style.solveMiddleRange,
    });
    console.log(
      q,
      JSON.stringify(links),
      'cost',
      overlapCost(links, shape).toFixed(3),
      '→ solved',
      (s.after - turningCost(s.turns)).toFixed(3),
      JSON.stringify(s.turns),
      JSON.stringify(s.linkGaps),
      Math.round(performance.now() - t0) + 'ms',
    );
  }
} finally {
  await server.close();
}
