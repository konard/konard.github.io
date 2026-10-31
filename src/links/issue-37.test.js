import { expect, it } from 'vitest';
import { overlapCost, solveCollisions, turningCost } from './collisions';
import { decode } from './configurations';
import { bezier, glyphCurves, paintedCurve, layoutCurves, layout } from './glyph';
import { randomNetworks } from '../../experiments/issue-37-networks.mjs';
import { networkSvg } from './render';
import { normalizeStyle, shapeOfStyle, withSpacing, styleFromParams, styleToParams } from './style';

// Independent dense centerline check: the two halves may join at their own
// middle, but must not intersect elsewhere. Exclude the adjacent join segments.
export function shaftCrossings(curve) {
  const points = curve.segments.map((segment) => Array.from({ length: 129 }, (_, k) => bezier(segment, k / 128)));
  const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  let count = 0;
  for (let i = 1; i < points[0].length; i++)
    for (let j = 1; j < points[1].length; j++) {
      const [a, b, c, d] = [points[0][i - 1], points[0][i], points[1][j - 1], points[1][j]];
      if (side(a, b, c) * side(a, b, d) < -1e-20 && side(c, d, a) * side(c, d, b) < -1e-20) count++;
    }
  return count;
}

it('scores the self crossing that the old 2222 solution incorrectly reported as collision-free', () => {
  const links = decode('22 22');
  const shape = shapeOfStyle(normalizeStyle({ turns: '47 -47', gaps: '0.16 0.16' }), 2);
  expect(shaftCrossings(layoutCurves(links, shape)[0])).toBe(1);
  expect(overlapCost(links, shape) - turningCost(shape.turns)).toBeGreaterThan(1);
});

it('solves the reported 2222 network without introducing a crossing between its own references', () => {
  const links = decode('22 22');
  const shape = shapeOfStyle(normalizeStyle(), 2);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  const curves = layoutCurves(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame });
  expect(curves.map(shaftCrossings)).toEqual([0, 0]);
  expect(result.after - turningCost(result.turns)).toBeCloseTo(0, 8);
});

it('improves the four-link drawing at its original positions, widening turns only beyond small ones', () => {
  const links = decode('34 44 21 32');
  const style = normalizeStyle();
  const shape = shapeOfStyle(style, 4);
  const solve = (range) =>
    solveCollisions(links, shape, { adjustGaps: true, range, step: style.solveStep, gapRange: style.solveGapRange });
  // Issue 43: the default largest turn is the full ±180° table range. Small
  // corrections remain available with an explicit 30° limit, and widening
  // must never be worse than them.
  const small = solve(30);
  small.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(30));
  expect(small.after - turningCost(small.turns)).toBeLessThan(14);
  const result = solve(style.solveRange);
  expect(style.solveRange).toBe(180);
  expect(result.after).toBeLessThan(result.before);
  expect(result.after - turningCost(result.turns)).toBeLessThanOrEqual(small.after - turningCost(small.turns));
  expect(result.after - turningCost(result.turns)).toBeLessThan(10);
  expect(result.layout).toBeUndefined();
  result.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(180));
  expect(
    overlapCost(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame }),
  ).toBeCloseTo(result.after, 8);
});

// Existing crossings and frozen closed-half marker clearances cannot always
// vanish under the owner's stronger requirement to preserve the drawing.
// Keep explicit regression ceilings; never turn those residuals into zero.
const FIXED_RESIDUAL = {
  2012: 0.102,
  '032113': 0.178,
  43434143: 7,
  33044224: 8,
  31324042: 3,
};
it.each(randomNetworks())('locally spaces discovered random network %s without changing its arrangement', (code) => {
  const links = decode(code.match(/../g).join(' '));
  const shape = shapeOfStyle(normalizeStyle(), links);
  const snapshot = JSON.stringify(shape);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  expect(result.after - turningCost(result.turns)).toBeLessThanOrEqual(FIXED_RESIDUAL[code] ?? 1e-8);
  expect(result.after).toBeLessThanOrEqual(result.before);
  expect(JSON.stringify(shape)).toBe(snapshot);
  const applied = normalizeStyle({
    ...withSpacing(normalizeStyle(), result),
  });
  const fitted = shapeOfStyle(applied, links);
  expect(overlapCost(links, fitted)).toBeCloseTo(result.after, 8);
  expect(glyphCurves(links, fitted).map((curve) => shaftCrossings(paintedCurve(curve, fitted)))).toEqual(
    links.map(() => 0),
  );
  expect(networkSvg(links, applied)).toBe(
    networkSvg(links, normalizeStyle(), {
      extraTurns: result.delta,
      extraGaps: result.linkGaps,
      extraFrame: result.frame,
    }),
  );
  expect(styleFromParams(styleToParams(applied))).toEqual(applied);
  result.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(30));
  result.linkGaps.forEach((row, i) =>
    row.forEach((value, k) => {
      if (k >= 2 || links[i][k] === i + 1 || links[i][k] === 0) expect(value).toBe(shape.linkGaps[i]?.[k] ?? null);
    }),
  );
});

it('reduces overlaps in the suggested URL within its step/gap bounds and original placement', () => {
  const links = decode('34 44 21 32');
  const shape = shapeOfStyle(normalizeStyle(), 4);
  const result = solveCollisions(links, shape, { adjustGaps: true, range: 180, step: 13, gapRange: 0.05 });
  expect(result.after).toBeLessThan(result.before);
  expect(result.layout).toBeUndefined();
  result.delta.flat().forEach((angle) => expect(angle % 13).toBeCloseTo(0, 8));
  result.linkGaps.forEach((row) =>
    row.slice(0, 2).forEach((gap) => {
      if (gap !== null) expect(Math.abs(gap - shape.startGap)).toBeLessThanOrEqual(0.05 + 1e-9);
    }),
  );
});

it('maps circular positions to stable link IDs and ignores invalid orders', () => {
  const natural = layout(4, { placement: 'circle' });
  const reordered = layout(4, { placement: 'circle', order: '1 3 2 4' });
  expect(reordered).toEqual([natural[0], natural[2], natural[1], natural[3]]);
  for (const order of ['1 2', '1 1 3 4', '1 2 3 5', 'x'])
    expect(layout(4, { placement: 'circle', order })).toEqual(natural);
});

it('preserves explicit layouts and disabled search bounds', () => {
  const links = decode('34 44 21 32');
  for (const patch of [{ placement: 'circle' }, { order: '1 2 3 4' }]) {
    const shape = shapeOfStyle(normalizeStyle(patch), 4);
    expect(solveCollisions(links, shape, { adjustGaps: true, passes: 1 }).layout).toBeUndefined();
  }
  const shape = shapeOfStyle(normalizeStyle(), 4);
  for (const options of [{ passes: 0 }, { range: 0, gapRange: 0 }]) {
    const result = solveCollisions(links, shape, { adjustGaps: true, ...options });
    expect(result.layout).toBeUndefined();
    expect(result.turns).toEqual(shape.turns);
    expect(result.linkGaps).toEqual(shape.linkGaps);
  }
});

it('preserves even the smallest configured spread', () => {
  const links = decode('34 44 21 32');
  const style = normalizeStyle({ spread: 0.1 });
  const shape = shapeOfStyle(style, 4);
  const result = solveCollisions(links, shape, { adjustGaps: true, passes: 1 });
  expect(result.layout).toBeUndefined();
  const applied = withSpacing(style, result);
  expect(applied.spread).toBe(0.1);
  expect(applied.order).toBe(style.order);
});
