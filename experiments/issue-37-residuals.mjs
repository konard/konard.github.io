// Independent witnesses for residual clearance between immutable closed markers.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { randomNetworks } from './issue-37-networks.mjs';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions, turningCost, visiblePolyline, pairCost } =
    await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { glyphCurves, paintedCurve, curveMarkers, layoutCurves, curveTransform } =
    await server.ssrLoadModule('/src/links/glyph.js');
  const { paintedPairCost } = await server.ssrLoadModule('/src/links/painted-collisions.js');
  const records = [];
  for (const code of ['34442132', '2222', ...randomNetworks()]) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), links.length);
    const result = solveCollisions(links, shape, { adjustGaps: true });
    const fitted = { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame };
    const curves = layoutCurves(links, fitted);
    const { scale } = curveTransform(curves, fitted);
    const lines = curves.map((curve, i) => visiblePolyline(curve, fitted, i, scale));
    const pairs = lines
      .flatMap((line, i) =>
        lines.slice(i + 1).map((other, k) => ({ links: [i + 1, i + k + 2], cost: pairCost(line, other, []) })),
      )
      .filter(({ cost }) => cost > 1e-9);
    const witnesses = [];
    glyphCurves(links, fitted).forEach((raw, i) => {
      const markers = curveMarkers(paintedCurve(raw, fitted), fitted);
      const decorate = (marker) =>
        Object.assign(marker.outline, {
          width: fitted.strokeWidth,
          clearance: fitted.clearance,
          fills: marker.fill ? [marker.outline] : [],
        });
      for (const [end, key] of ['start', 'end'].entries()) {
        if (links[i][end] !== i + 1) continue;
        const cost = paintedPairCost(decorate(markers[key]), decorate(markers.middle));
        if (cost > 1e-9) witnesses.push({ link: i + 1, closedEnd: key, cost });
      }
    });
    records.push({
      code,
      residual: result.after - turningCost(result.turns),
      self: lines.map((line) => line.self),
      pairs,
      immutableMarkerWitnesses: witnesses,
    });
  }
  await writeFile('docs/case-studies/issue-37/data/residual-witnesses.json', JSON.stringify(records, null, 2) + '\n');
  console.log(
    JSON.stringify(
      records.filter(({ residual }) => residual > 1e-9),
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
