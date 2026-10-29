// Experimental (issue #17): fewer overlaps of the lines of a network. Each end
// of a link may leave its source or enter its target at another angle (the
// per-link turns of glyph.js). This tries turns for one end at a time and
// keeps the one that makes the drawing cleaner, a few passes over every end
// (coordinate descent). Only the turned link changes, so only its pairs with
// the other links are measured again.
//
// Editor scoring includes painted shafts, markers, fills and requested space
// between them, including near referenced middles. The original centerline
// scoring remains available for legacy shapes whose clearance is null.
// A small turn penalty discourages changing angles without a reason.
import { bezier, curveTransform, layout, layoutCurves, linkCurve, shapeOf, paintedCurve, curveMarkers } from './glyph';
import { trimCurve } from './curve-tools';
import { paintedPairCost, selfCost } from './painted-collisions';
import { adjustCollisionGaps } from './collision-gaps';
import { symmetricReferences } from './collision-symmetry';

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
  if (a.width !== undefined || b.width !== undefined) return paintedPairCost(a, b);
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

export const turningCost = (turns) => turns.flat().reduce((sum, a) => sum + Math.abs(a), 0) * TURNING;

/** The cost of a drawing of `links` with `shape` (lower is cleaner). */
export function overlapCost(links, shape = {}) {
  const curves = layoutCurves(links, shape);
  const o = shapeOf(shape);
  const scale = curveTransform(curves, o).scale;
  const lines = curves.map((curve, i) => visiblePolyline(curve, o, i, scale));
  const middles = curves.map((c) => c.middle.at);
  let cost = turningCost(shapeOf(shape).turns) + lines.reduce((sum, line) => sum + selfCost(line), 0);
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
function solveTurns(links, shape = {}, { range = 60, step = 1, passes = 3 } = {}, origins) {
  range = Math.min(180, Math.max(0, Number(range) || 0));
  step = Math.max(1, Number(step) || 1);
  passes = Math.min(10, Math.max(0, Number(passes) || 0));
  const n = links.length;
  const base = shapeOf(shape);
  const initial = Array.from({ length: n }, (_, i) => base.turns[i] || [0, 0]);
  const start = initial.map((pair, i) => origins?.[i] || pair);
  const delta = initial.map((pair, i) => pair.map((angle, end) => angle - start[i][end]));
  const total = () => start.map((pair, i) => [pair[0] + delta[i][0], pair[1] + delta[i][1]]);
  const places = layout(n, base, links);
  const curveOf = (i) => linkCurve(links, i, places, { ...base, turns: total() });
  const middles = layoutCurves(links, base).map((c) => c.middle.at);
  const scale = curveTransform(layoutCurves(links, base), base).scale;
  const lines = links.map((_, i) => visiblePolyline(curveOf(i), base, i, scale));
  const costOf = (i, line) => {
    let cost = selfCost(line);
    for (let j = 0; j < n; j++) if (j !== i) cost += pairCost(line, lines[j], middles);
    return cost + turningCost([total()[i]]);
  };
  const before = overlapCost(links, base);
  const candidates = [0];
  for (let a = step; a <= range; a += step) candidates.push(a, -a);

  for (let pass = 0; pass < passes; pass++) {
    let improved = false;
    for (let i = 0; i < n; i++) {
      for (let end = 0; end < 2; end++) {
        // A self-closed half is already positioned; move the open references.
        if (links[i][end] === i + 1) continue;
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
    result = {
      delta: initial.map((pair, i) => pair.map((angle, end) => angle - start[i][end])),
      turns: initial,
      linkGaps: base.linkGaps,
      before,
      after: before,
    };

  return result;
}

/** Gap-first search avoids the angle-only local minimum at collapsed
 * reference ends. Turn the separated drawing, then refine the gaps again.
 * Every stage returns an exact refitted score and preserves the user's bounds.
 */
export function solveCollisions(links, shape = {}, options = {}) {
  // Reference spacing must not open a link's middle unless explicitly requested.
  const { adjustGaps = false, gapRange = 0.2, middleRange = 0, passes = 3, debug = false } = options;
  const base = shapeOf(shape);
  const turns = links.map((_, i) => [...(base.turns[i] || [0, 0])]);
  const before = overlapCost(links, base);
  let result = { turns, delta: turns.map(() => [0, 0]), linkGaps: base.linkGaps, before, after: before };
  // Existing angles are intentional. A turn penalty is only a search tie-break,
  // never a reason to move a drawing already satisfying painted clearance.
  const satisfied = (value) => value.after - turningCost(value.turns) <= 1e-9;
  if (!satisfied(result) && passes > 0) {
    if (adjustGaps) {
      result = symmetricReferences(links, base, result, options);
      if (!satisfied(result)) {
        result = adjustCollisionGaps(links, base, result, { gapRange, middleRange, passes });
        if (!satisfied(result)) {
          const found = solveTurns(links, { ...base, turns: result.turns, linkGaps: result.linkGaps }, options, turns);
          result = { ...found, before };
          if (!satisfied(result)) result = adjustCollisionGaps(links, base, result, { gapRange, middleRange, passes });
        }
      }
    } else result = solveTurns(links, base, options);
  }
  result.delta = result.turns.map((pair, i) => pair.map((a, e) => a - turns[i][e]));
  if (debug)
    console.debug('[network solver]', {
      links: links.length,
      options,
      clearance: base.clearance,
      ...result,
      collisionCost: result.after - turningCost(result.turns),
      preservedSatisfied: satisfied({ after: before, turns }),
    });
  return result;
}

/** Keep each cut as a real break: no artificial chord across the missing middle. */
export function visiblePolyline(curve, o, i, scale) {
  if (o.clearance !== null && o.clearance !== undefined) return paintedPolyline(curve, o, i, scale);
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

/** Same fitted geometry, cuts and markers as the SVG, converted back to layout units. */
function paintedPolyline(raw, o, i, scale) {
  const fit = (point) => point.map((v) => v * scale);
  const curve = paintedCurve(
    {
      ...raw,
      segments: raw.segments.map((segment) => segment.map(fit)),
      ...Object.fromEntries(['start', 'end', 'middle'].map((key) => [key, { ...raw[key], at: fit(raw[key].at) }])),
    },
    o,
  );
  const marks = curveMarkers(curve, o);
  const decorate = (points, fills = []) =>
    Object.assign(points, { width: (o.strokeWidth || 0) / scale, clearance: o.clearance / scale, fills });
  const markLine = (m) => {
    const points = m.outline.map((p) => p.map((v) => v / scale));
    // Include the actual sharp miter tip, which is outside the marker centerline.
    return decorate(points, m.fill ? [points] : []);
  };
  const markerLines = ['start', 'end', 'middle'].map((key) => {
    const line = markLine(marks[key]);
    if (o.arrowJoin === 'miter' && ['arrow', 'triangle', 'tail'].includes(o[key]) && line.length >= 3) {
      const index = o[key] === 'triangle' ? 0 : 1;
      const tip = line[index];
      const previous = line[o[key] === 'triangle' ? 1 : 0];
      const next = line[2];
      const mid = previous.map((v, j) => (v + next[j]) / 2);
      const dir = tip.map((v, j) => v - mid[j]);
      const length = Math.hypot(...dir) || 1;
      const extra = (o.strokeWidth || 0) / 2 / Math.sin((o[`${key}Angle`] * Math.PI) / 180) / scale;
      // Conservatively include the painted apex as well as stroked arms.
      line.push(
        null,
        tip.map((v, j) => v + (dir[j] / length) * extra),
        tip,
      );
    }
    return line;
  });
  const halves = curve.segments.map((segment, k) => {
    const amount = o.linkGaps[i]?.[k + 2] ?? o[k ? 'middleGapEnd' : 'middleGapStart'];
    const kept = trimCurve(segment, amount, Boolean(k));
    return decorate(
      kept ? Array.from({ length: SAMPLES + 1 }, (_, j) => bezier(kept, j / SAMPLES).map((v) => v / scale)) : [],
    );
  });
  const all = decorate(
    [...halves[0], null, ...halves[1], ...markerLines.flatMap((line) => [null, ...line])],
    markerLines.flatMap((line) => line.fills),
  );
  all.ends = markerLines.slice(0, 2).map((marker, k) => {
    const endpoint = (k ? curve.end.at : curve.start.at).map((v) => v / scale);
    return decorate([endpoint, endpoint, null, ...marker], marker.fills);
  });
  all.self =
    paintedPairCost(markerLines[0], markerLines[1]) +
    paintedPairCost(markerLines[0], halves[1]) +
    paintedPairCost(markerLines[1], halves[0]) +
    paintedPairCost(markerLines[2], markerLines[0]) +
    paintedPairCost(markerLines[2], markerLines[1]);
  return all;
}
