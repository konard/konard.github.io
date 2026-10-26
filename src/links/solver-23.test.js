import { expect, it } from 'vitest';
import { decode } from './configurations';
import { overlapCost, pairCost, solveCollisions } from './collisions';
import { withGaps } from './gaps';
import { bezier, glyphCurves } from './glyph';
import { networkSvg } from './render';
import { STYLE_DEFAULTS, normalizeStyle, shapeOfStyle, styleFromParams, styleToParams, withTurns } from './style';

it('reduces overlaps by adjusting individual gaps with angle search disabled', () => {
  const links = decode('22 13 31');
  const shape = shapeOfStyle(STYLE_DEFAULTS, 3);
  const result = solveCollisions(links, shape, { range: 0, adjustGaps: true });
  expect(result.delta.flat().every((angle) => angle === 0)).toBe(true);
  expect(result.after).toBeLessThan(result.before);
  expect(result.linkGaps.some((row) => row.some((value) => value !== null))).toBe(true);
  const applied = withGaps(withTurns(STYLE_DEFAULTS, result.turns), result.linkGaps);
  expect(overlapCost(links, shapeOfStyle(applied, 3))).toBeCloseTo(result.after, 6);
  expect(networkSvg(links, applied)).toBe(
    networkSvg(links, STYLE_DEFAULTS, {
      extraTurns: result.delta,
      extraGaps: result.linkGaps,
    }),
  );
  expect(styleFromParams(styleToParams(applied))).toEqual(normalizeStyle(applied));
});
it('bounds manual gap adjustments, preserves the input and never increases the exact score', () => {
  const links = decode('23 31 12');
  const style = normalizeStyle({ gaps: '0.5 0.7 20 25,0.4 0.3 2 3' });
  const shape = shapeOfStyle(style, 3);
  const original = structuredClone(shape);
  const result = solveCollisions(links, shape, { adjustGaps: true, gapRange: 0.1, middleRange: 2 });
  expect(shape).toEqual(original);
  expect(result.after).toBeLessThanOrEqual(result.before);
  result.linkGaps.forEach((row, i) =>
    row.forEach((value, k) => {
      const initial =
        original.linkGaps[i]?.[k] ?? original[['startGap', 'endGap', 'middleGapStart', 'middleGapEnd'][k]];
      expect(Math.abs((value ?? initial) - initial)).toBeLessThanOrEqual((k < 2 ? 0.1 : 2) + 1e-9);
    }),
  );
  const applied = withGaps(withTurns(style, result.turns), result.linkGaps);
  expect(overlapCost(links, shapeOfStyle(applied, 3))).toBeCloseTo(result.after, 6);
});
it('does not count an artificial crossing through a cut in the middle', () => {
  const line = [[-1, 0], [-0.4, 0], null, [0.4, 0], [1, 0]];
  const cross = [
    [0, -1],
    [0, 1],
  ];
  expect(pairCost(line, cross, [])).toBe(0);
  expect(pairCost(line.filter(Boolean), cross, [])).toBeGreaterThan(0);
});

it('also reduces overlaps by center cuts alone, without reference gap or angle changes', () => {
  const links = decode('22 13 31');
  const result = solveCollisions(links, shapeOfStyle(STYLE_DEFAULTS, 3), {
    range: 0,
    adjustGaps: true,
    gapRange: 0,
    middleRange: 15,
  });
  expect(result.after).toBeLessThan(result.before);
  expect(result.linkGaps.some((row) => row[2] > 0 || row[3] > 0)).toBe(true);
  expect(result.linkGaps.every((row) => row[0] === null && row[1] === null)).toBe(true);
  expect(result.turns.flat().every((value) => value === 0)).toBe(true);
});

it('bounds gap search cost for a dense 24-link drawing and returns its exact score', () => {
  const links = Array.from({ length: 24 }, (_, i) => [((i + 1) % 24) + 1, ((i + 12) % 24) + 1]);
  const shape = shapeOfStyle(STYLE_DEFAULTS, links.length);
  const started = performance.now();
  const result = solveCollisions(links, shape, { range: 0, adjustGaps: true });
  expect(performance.now() - started).toBeLessThan(10000);
  expect(result.after).toBeLessThan(result.before);
  expect(overlapCost(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps })).toBeCloseTo(result.after, 8);
}, 15000);

it('keeps automatic cuts within the final fitted half-length after reference gaps change', () => {
  const links = Array.from({ length: 24 }, (_, i) => [((i + 1) % 24) + 1, ((i + 12) % 24) + 1]);
  const shape = shapeOfStyle(STYLE_DEFAULTS, links.length);
  const result = solveCollisions(links, shape, { range: 0, adjustGaps: true, gapRange: 1, middleRange: 15 });
  expect(result.after).toBeLessThan(result.before);
  const fitted = { ...shape, turns: result.turns, linkGaps: result.linkGaps };
  glyphCurves(links, fitted).forEach((curve, i) => {
    curve.segments.forEach((segment, k) => {
      let length = 0;
      let previous = segment[0];
      for (let j = 1; j <= 1024; j++) {
        const point = bezier(segment, j / 1024);
        length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
        previous = point;
      }
      expect(result.linkGaps[i]?.[k + 2] ?? 0).toBeLessThanOrEqual(length * 0.3 + 0.001);
    });
  });
  expect(overlapCost(links, fitted)).toBeCloseTo(result.after, 8);
}, 15000);
