// Issue 43 (PR 44 review): automatic spacing of 2211 widened both reference
// gaps until the arrows stopped far from their targets, although turning one
// reference inward and one outward clears the drawing without any gap change.
import { expect, it } from 'vitest';
import { overlapCost, solveCollisions, turningCost } from './collisions';
import { decode } from './configurations';
import { normalizeStyle, shapeOfStyle } from './style';

const solve = (code, raw = {}) => {
  const links = decode(code);
  const style = normalizeStyle(raw);
  const shape = shapeOfStyle(style, links);
  const result = solveCollisions(links, shape, {
    adjustGaps: style.solveGaps,
    range: style.solveRange,
    step: style.solveStep,
    gapRange: style.solveGapRange,
    middleRange: style.solveMiddleRange,
  });
  return { links, shape, result, collisions: result.after - turningCost(result.turns) };
};
const changedGaps = (rows) => rows.flat().filter((v) => v !== null).length;

it('clears 2211 by default with turns alone, leaving every gap unchanged', () => {
  const { links, shape, result, collisions } = solve('22 11');
  expect(result.before - turningCost(shape.turns)).toBeGreaterThan(1);
  expect(collisions).toBeCloseTo(0, 9);
  expect(changedGaps(result.linkGaps)).toBe(0);
  // Like the reported -90/90 arrangement, one reference goes inside and one outside.
  const [source, target] = result.turns[0];
  expect(Math.sign(source)).toBe(-Math.sign(target));
  expect(Math.max(Math.abs(source), Math.abs(target))).toBeGreaterThan(30);
  expect(overlapCost(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps })).toBeCloseTo(result.after, 9);
});

it('keeps the reported manual 2211 arrangement, which is already collision-free', () => {
  const { result, collisions } = solve('22 11', { turns: '-90 90' });
  expect(collisions).toBeCloseTo(0, 9);
  expect(result.turns).toEqual([
    [-90, 90],
    [0, 0],
  ]);
  expect(result.delta.flat().every((v) => v === 0)).toBe(true);
});

it('tries small turns before wide ones and wide turns before gap changes', () => {
  // 2222 references a self-closed link: small mirrored ends still win.
  const mirrored = solve('22 22').result;
  expect(mirrored.after - turningCost(mirrored.turns)).toBeCloseTo(0, 9);
  mirrored.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(30));
  // An explicit 30° limit is still honored; then gaps are the only remaining tool.
  const limited = solve('22 11', { solveRange: 30 });
  limited.result.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(30));
  expect(changedGaps(limited.result.linkGaps)).toBeGreaterThan(0);
  // Without gap adjustment the wide turn search alone still clears 2211.
  expect(solve('22 11', { solveGaps: false }).collisions).toBeCloseTo(0, 9);
});

it('uses the full ±180° table range as the default largest turn', () => {
  expect(normalizeStyle().solveRange).toBe(180);
});
