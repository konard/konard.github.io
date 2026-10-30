// Search both reference ends together. Independent descent can obtain zero
// collisions by opening only one gap, then has no incentive to restore symmetry.
import { layout, layoutCurves, linkCurve } from './glyph';
import { GapScoreCache } from './collision-gap-cache';
import { overlapCost } from './collisions';
import { paintedDistance } from './painted-collisions';

/** Painted spaces at the two reference ends and between them, in SVG units. */
export function referenceSpaces(line, target, scale) {
  if (!line.ends) return [];
  return [
    ...line.ends.map((end) => paintedDistance(end, target) * scale),
    paintedDistance(line.ends[0], line.ends[1]) * scale,
  ];
}

export function symmetricReferences(links, base, result, { range = 30, step = 1, gapRange = 0.2 } = {}) {
  if (base.clearance == null) return result;
  range = Math.min(180, Math.max(0, Number(range) || 0));
  step = Math.max(1, Number(step) || 1);
  gapRange = Math.min(1, Math.max(0, Number(gapRange) || 0));
  const turns = result.turns.map((pair) => [...pair]);
  const rows = links.map((_, i) => [...(result.linkGaps[i] || [null, null, null, null])]);
  const shape = { ...base, turns, linkGaps: rows };
  const places = layout(links.length, base, links);
  const cache = new GapScoreCache(layoutCurves(links, shape), shape);
  for (let i = 0; i < links.length; i++) {
    const [source, target] = links[i];
    if (!source || source !== target || source === i + 1) continue;
    const closed = links[source - 1];
    if (closed[0] !== source || closed[1] !== source) continue;
    const originalTurns = [...turns[i]];
    const originalGaps = [...rows[i]];
    const initial = [rows[i][0] ?? base.startGap, rows[i][1] ?? base.endGap];
    const low = Math.max(0, ...initial.map((v) => v - gapRange));
    const high = Math.min(1, ...initial.map((v) => v + gapRange));
    if (low > high) continue;
    let best;
    const evaluate = (angle, gap) => {
      turns[i] = [angle, -angle];
      rows[i][0] = rows[i][1] = gap;
      const candidate = cache.measure(i, linkCurve(links, i, places, shape));
      const spaces = referenceSpaces(candidate.line || candidate.lines[i], cache.lines[source - 1], cache.scale);
      const mean = spaces.reduce((a, b) => a + b, 0) / spaces.length;
      const uniform = spaces.reduce((s, v) => s + (v - base.clearance) ** 2 + (v - mean) ** 2, 0);
      const movement = Math.abs(angle - originalTurns[0]) + Math.abs(-angle - originalTurns[1]);
      // Collision satisfaction takes precedence; among feasible candidates use
      // measured clearance and uniformity, then minimal angular movement.
      const cost = candidate.total;
      const preference = uniform + movement * 0.0001;
      if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && preference < best.preference))
        best = { angle, gap, cost, preference, candidate };
    };
    // Keep the same step grid as individual descent, relative to the user's
    // starting turns. Include unchanged paired turns even with zero ranges.
    const radius = Math.max(1, Math.ceil(10 / step));
    const limit = Math.floor(range / step);
    const evaluateTick = (tick) => {
      const angle = originalTurns[0] + tick * step;
      if (
        Math.abs(angle) > 180 ||
        Math.abs((-angle - originalTurns[1]) / step - Math.round((-angle - originalTurns[1]) / step)) > 1e-9
      )
        return;
      if (Math.abs(angle - originalTurns[0]) > range || Math.abs(-angle - originalTurns[1]) > range) return;
      evaluate(angle, Math.max(low, Math.min(high, initial[0])));
      for (let tick = Math.ceil(low * 100); tick <= Math.floor(high * 100); tick++) evaluate(angle, tick / 100);
    };
    evaluateTick(0);
    for (let tick = -limit; tick <= limit; tick += radius) evaluateTick(tick);
    if (best) {
      const center = Math.round((best.angle - originalTurns[0]) / step);
      for (let tick = Math.max(-limit, center - radius); tick <= Math.min(limit, center + radius); tick++)
        evaluateTick(tick);
    }
    if (best) {
      const coarse = best;
      for (
        let tick = Math.max(Math.ceil(low * 1000), Math.round(coarse.gap * 1000) - 9);
        tick <= Math.min(Math.floor(high * 1000), Math.round(coarse.gap * 1000) + 9);
        tick++
      )
        evaluate(coarse.angle, tick / 1000);
    }
    turns[i] = originalTurns;
    rows[i] = originalGaps;
    if (best && best.cost < cache.total - 1e-9) {
      turns[i] = [best.angle, -best.angle];
      rows[i][0] = rows[i][1] = best.gap;
      cache.accept(best.candidate);
    }
  }
  const after = overlapCost(links, shape);
  return after <= result.after ? { ...result, turns, linkGaps: rows, after } : result;
}
