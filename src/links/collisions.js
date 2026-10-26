// Experimental (issue #17): fewer overlaps of the lines of a network. Each end
// of a link may leave its source or enter its target at another angle (the
// per-link turns of glyph.js). This tries turns for one end at a time and
// keeps the one that makes the drawing cleaner, a few passes over every end
// (coordinate descent). Only the turned link changes, so only its pairs with
// the other links are measured again.
//
// The cost of a drawing, in layout units (neighbouring middles are 1 apart):
//   - every crossing of the lines of two links, away from the middles where
//     links touch on purpose;
//   - every sampled point of a line that comes closer than NEAR to a line of
//     another link (the lines run together and overlap);
//   - a little for every degree turned, so nothing turns without a reason.
import { bezier, curveTransform, layout, layoutCurves, linkCurve, shapeOf } from './glyph';
import { trimCurve } from './curve-tools';
import { adjustCollisionGaps } from './collision-gaps';

const SAMPLES = 16; // points per Bézier segment
const NEAR = 0.09; // lines closer than this overlap (a stroke is about 0.04)
const MIDDLE = 0.14; // touching around a middle is the drawing, not an overlap
const CROSSING = 1;
const CLOSE = 0.25;
const TURNING = 0.002; // per degree

export const polyline = (curve) =>
  curve.segments.flatMap((seg, k) =>
    Array.from({ length: SAMPLES + (k ? 0 : 1) }, (_, j) => bezier(seg, (j + (k ? 1 : 0)) / SAMPLES)),
  );

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function crossing(p1, p2, q1, q2) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const [d1, d2, d3, d4] = [d(q1, q2, p1), d(q1, q2, p2), d(p1, p2, q1), d(p1, p2, q2)];
  if (!(d1 * d2 < 0 && d3 * d4 < 0)) return null;
  const t = d1 / (d1 - d2);
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

/** How much the lines of two links (polylines) overlap and cross; `middles` are exempt. */
export function pairCost(a, b, middles) {
  const free = (p) => p && middles.every((m) => distance(p, m) > MIDDLE);
  let cost = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      if (!a[i] || !a[i + 1] || !b[j] || !b[j + 1]) continue;
      const point = crossing(a[i], a[i + 1], b[j], b[j + 1]);
      if (point && free(point)) cost += CROSSING;
    }
  }
  for (const p of a) {
    if (!free(p)) continue;
    if (b.some((q) => q && distance(p, q) < NEAR)) cost += CLOSE;
  }
  for (const q of b) {
    if (!free(q)) continue;
    if (a.some((p) => p && distance(p, q) < NEAR)) cost += CLOSE;
  }
  return cost;
}

const turning = (turns) => turns.flat().reduce((sum, a) => sum + Math.abs(a), 0) * TURNING;

/** The cost of a drawing of `links` with `shape` (lower is cleaner). */
export function overlapCost(links, shape = {}) {
  const curves = layoutCurves(links, shape);
  const o = shapeOf(shape);
  const scale = curveTransform(curves, o).scale;
  const lines = curves.map((curve, i) => visiblePolyline(curve, o, i, scale));
  const middles = curves.map((c) => c.middle.at);
  let cost = turning(shapeOf(shape).turns);
  for (let i = 0; i < lines.length; i++)
    for (let j = i + 1; j < lines.length; j++) cost += pairCost(lines[i], lines[j], middles);
  return cost;
}

/**
 * Turns of the ends of every link that make the drawing cleaner. `shape.turns`
 * are kept as the starting point; the result adds turns from −range to +range
 * degrees in steps of `step`. Returns the turns found (`delta`, to add to the
 * starting turns), the turns in total (`turns`) and the cost before and after.
 */
export function solveCollisions(
  links,
  shape = {},
  { range = 60, step = 15, passes = 3, adjustGaps = false, gapRange = 0.2, middleRange = 4 } = {},
) {
  range = Math.min(180, Math.max(0, Number(range) || 0));
  step = Math.max(1, Number(step) || 15);
  passes = Math.min(10, Math.max(0, Number(passes) || 0));
  const n = links.length;
  const base = shapeOf(shape);
  const start = Array.from({ length: n }, (_, i) => base.turns[i] || [0, 0]);
  const delta = start.map(() => [0, 0]);
  const total = () => start.map((pair, i) => [pair[0] + delta[i][0], pair[1] + delta[i][1]]);
  const places = layout(n, base, links);
  const curveOf = (i) => linkCurve(links, i, places, { ...base, turns: total() });
  const middles = layoutCurves(links, base).map((c) => c.middle.at);
  const scale = curveTransform(layoutCurves(links, base), base).scale;
  const lines = links.map((_, i) => visiblePolyline(curveOf(i), base, i, scale));
  const costOf = (i, line) => {
    let cost = 0;
    for (let j = 0; j < n; j++) if (j !== i) cost += pairCost(line, lines[j], middles);
    return cost + turning([total()[i]]);
  };
  const before = overlapCost(links, base);
  const candidates = [0];
  for (let a = step; a <= range; a += step) candidates.push(a, -a);

  for (let pass = 0; pass < passes; pass++) {
    let improved = false;
    for (let i = 0; i < n; i++) {
      for (let end = 0; end < 2; end++) {
        const kept = delta[i][end];
        let best = { angle: kept, cost: costOf(i, lines[i]), line: lines[i] };
        for (const angle of candidates) {
          if (angle === kept) continue;
          // Applied turns go back through the editable table's −180…180° range.
          if (Math.abs(start[i][end] + angle) > 180) continue;
          delta[i][end] = angle;
          const line = visiblePolyline(curveOf(i), base, i, scale);
          const cost = costOf(i, line);
          if (cost < best.cost - 1e-9) best = { angle, cost, line };
        }
        delta[i][end] = best.angle;
        lines[i] = best.line;
        if (best.angle !== kept) improved = true;
      }
    }
    if (!improved) break;
  }
  let result = {
    delta,
    turns: total(),
    linkGaps: base.linkGaps,
    before,
    after: overlapCost(links, { ...base, turns: total() }),
  };
  // Middle cuts use image units: a turn can change fitting scale. Reject a
  // cached candidate if the exact complete drawing would become worse.
  if (result.after > before)
    result = { delta: start.map(() => [0, 0]), turns: start, linkGaps: base.linkGaps, before, after: before };
  return adjustGaps ? adjustCollisionGaps(links, base, result, { gapRange, middleRange, passes }) : result;
}

/** Keep each cut as a real break: no artificial chord across the missing middle. */
export function visiblePolyline(curve, o, i, scale) {
  const before = o.linkGaps[i]?.[2] ?? o.middleGapStart;
  const after = o.linkGaps[i]?.[3] ?? o.middleGapEnd;
  if (!before && !after) return polyline(curve);
  return curve.segments.flatMap((segment, k) => {
    const kept = trimCurve(segment, (k ? after : before) / scale, Boolean(k));
    return kept
      ? [...(k ? [null] : []), ...Array.from({ length: SAMPLES + 1 }, (_, j) => bezier(kept, j / SAMPLES))]
      : [];
  });
}
