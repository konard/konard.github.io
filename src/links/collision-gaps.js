// A second coordinate-descent stage: try modest gaps after turning the ends.
// Score the exact visible curves and penalize extra cuts so the solver cannot
// "solve" a diagram by erasing it. Manual gaps remain the starting point.
import { overlapCost } from './collisions';
import { GapScoreCache } from './collision-gap-cache';
import { GAP_FIELDS } from './gaps';
import { bezier, layout, layoutCurves, linkCurve } from './glyph';

export function adjustCollisionGaps(links, base, result, { gapRange, middleRange, passes }) {
  gapRange = Math.min(1, Math.max(0, Number(gapRange) || 0));
  middleRange = Math.min(15, Math.max(0, Number(middleRange) || 0));
  const rows = links.map((_, i) => GAP_FIELDS.map((_, k) => base.linkGaps[i]?.[k] ?? null));
  const initial = rows.map((row) => row.map((v, k) => v ?? base[GAP_FIELDS[k].key] ?? base.gap));
  const currentShape = () => ({ ...base, turns: result.turns, linkGaps: rows });
  const places = layout(links.length, base, links);
  const cache = new GapScoreCache(layoutCurves(links, currentShape()), currentShape());
  const turningCost = result.after - cache.total;
  const halfLength = (i, k) => {
    const segment = cache.curves[i].segments[k];
    let length = 0;
    let previous = segment[0];
    for (let j = 1; j <= 64; j++) {
      const point = bezier(segment, j / 64);
      length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      previous = point;
    }
    return length * cache.scale;
  };
  const penalty = () =>
    rows.reduce(
      (sum, row, i) =>
        sum + row.reduce((s, v, k) => s + Math.abs((v ?? initial[i][k]) - initial[i][k]) * (k < 2 ? 0.1 : 0.025), 0),
      0,
    );
  let bestScore = result.after;
  for (let pass = 0; pass < Math.min(passes, 2); pass++) {
    let improved = false;
    for (let i = 0; i < links.length; i++)
      for (let k = 0; k < 4; k++) {
        if (k < 2 && links[i][k] === 0) continue;
        const kept = rows[i][k];
        const range = k < 2 ? gapRange : middleRange;
        if (!range) continue;
        // Never shorten an existing manual cut just to satisfy the automatic
        // cap. New cuts may consume at most 30% of either half of the line.
        const max = k < 2 ? 1 : Math.max(initial[i][k], Math.min(30, halfLength(i, k - 2) * 0.3));
        let best = kept;
        let bestState;
        for (const fraction of [-1, -0.5, 0.5, 1]) {
          const value = Math.round(Math.max(0, Math.min(max, initial[i][k] + range * fraction)) * 1000) / 1000;
          if (value === (kept ?? initial[i][k])) continue;
          rows[i][k] = value;
          const curve = k < 2 ? linkCurve(links, i, places, currentShape()) : cache.curves[i];
          const candidate = cache.measure(i, curve);
          const score = turningCost + candidate.total + penalty();
          if (score < bestScore - 1e-9) {
            bestScore = score;
            best = value;
            bestState = candidate;
          }
        }
        rows[i][k] = best;
        if (bestState) {
          cache.accept(bestState);
          improved = true;
        }
      }
    if (!improved) break;
  }
  // Later reference-gap changes can shorten earlier halves or their fitted
  // scale. Enforce the cut budget against the final geometry as well.
  rows.forEach((row, i) => {
    for (let k = 2; k < 4; k++) {
      const max = Math.max(initial[i][k], Math.min(30, halfLength(i, k - 2) * 0.3));
      if (row[k] > max) row[k] = Math.floor(max * 1000) / 1000;
    }
  });
  const after = overlapCost(links, currentShape());
  return after <= result.after ? { ...result, linkGaps: rows, after } : result;
}
