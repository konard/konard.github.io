import { expect, it } from 'vitest';
import { glyphCurves, paintedCurve } from './glyph';
import { overlapCost, solveCollisions, turningCost } from './collisions';
import { normalizeStyle, shapeOfStyle, linkTurns, styleFromParams, styleToParams } from './style';
import { linkGaps } from './gaps';

const links = [
  [1, 1],
  [1, 1],
];
const setup = (patch = {}) => shapeOfStyle(normalizeStyle({ rotation: -90, turns: '0 0,-15 15', ...patch }), 2);
const extent = (shape) => {
  const raw = glyphCurves(links, shape)[0];
  const paint = paintedCurve(raw, shape);
  const extra = shape.strokeWidth / 2 / Math.sin((shape.endAngle * Math.PI) / 180);
  const apex = paint.end.at.map((v, i) => v + extra * paint.end.dir[i]);
  const radius = (p) => Math.hypot(...p.map((v, i) => v - raw.middle.at[i]));
  return { source: radius(raw.start.at) - shape.strokeWidth / 2, target: radius(apex) };
};
it('measures exactly equal painted gaps at both ends of the closed 1111 link', () => {
  for (const rotation of [-90, 0, 45, 90])
    for (const endAngle of [5, 15, 45, 85]) {
      const measured = extent(setup({ rotation, endAngle }));
      expect(measured.target).toBeCloseTo(measured.source, 9);
    }
});
it('changes the target gap continuously through 0.07 and 0.08 without moving the source gap', () => {
  const samples = [0.06, 0.07, 0.079, 0.08, 0.081, 0.09].map((gap) =>
    extent(setup({ gaps: `0.08 ${gap} ~ ~,0.18 0.18 ~ ~` })),
  );
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i].source).toBeCloseTo(samples[0].source, 9);
    const step = [0.01, 0.009, 0.001, 0.001, 0.009][i - 1];
    expect(samples[i].target - samples[i - 1].target).toBeCloseTo(step * 60, 8);
  }
});
it('preserves closed halves and discovers gaps and turns on the open 1111 link', () => {
  const shape = shapeOfStyle(normalizeStyle({ rotation: -90 }), 2);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  expect(result.turns[0]).toEqual([0, 0]);
  expect(result.linkGaps[0]).toEqual(shape.linkGaps[0]);
  expect(result.linkGaps[1][0]).toBeGreaterThan(0.08);
  expect(result.linkGaps[1][1]).toBeGreaterThan(0.08);
  expect(result.after).toBeLessThan(result.before);
  expect(
    overlapCost(links, { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame }),
  ).toBeCloseTo(result.after, 8);
});
it('recognizes the exact reported arrangement with the closed gaps corrected to equality', () => {
  const shape = setup({ gaps: '0.08 0.08 ~ ~,0.18 0.18 ~ ~' });
  expect(overlapCost(links, shape)).toBeCloseTo(turningCost(shape.turns), 8);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  expect(result.turns[0]).toEqual([0, 0]);
  expect(result.linkGaps[0]).toEqual([0.08, 0.08, null, null]);
});
it('preserves the closed side and its middle cut on a partially self-referencing link', () => {
  const partial = [
    [1, 2],
    [1, 1],
  ];
  const shape = setup({ turns: '15 0', gaps: '0.09 ~ 1 ~' });
  const result = solveCollisions(partial, shape, { adjustGaps: true });
  expect(result.turns[0][0]).toBe(15);
  expect(result.linkGaps[0][0]).toBe(0.09);
  expect(result.linkGaps[0][2]).toBe(1);
});
it('accepts old turn/gap rows and serializes skipped defaults compactly', () => {
  const old = styleFromParams(new URLSearchParams('turns=0+0%2C-15+15&gaps=~+~+~+~%2C0.18+0.18+~+~'));
  const compact = styleToParams(old);
  expect(compact.get('turns')).toBe(',-15 15');
  expect(compact.get('gaps')).toBe(',0.18 0.18');
  const next = styleFromParams(compact);
  expect(linkTurns(next, 2)).toEqual([
    [0, 0],
    [-15, 15],
  ]);
  expect(linkGaps(next, 2)).toEqual([
    [null, null, null, null],
    [0.18, 0.18, null, null],
  ]);
  expect(styleFromParams(styleToParams(next))).toEqual(next);
});
