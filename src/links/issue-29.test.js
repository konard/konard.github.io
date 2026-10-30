import { expect, it } from 'vitest';
import { decode } from './configurations';
import { solveCollisions, overlapCost, turningCost, visiblePolyline } from './collisions';
import { layoutCurves, curveTransform } from './glyph';
import { referenceSpaces } from './collision-symmetry';
import { paintedDistance } from './painted-collisions';
import { normalizeStyle, shapeOfStyle, withSpacing, STYLE_DEFAULTS, styleFromParams, styleToParams } from './style';
import { networkSvg } from './render';

it.each([5, 10, 15])('preserves the reported valid manual %s-degree configuration exactly', (angle) => {
  const links = decode('11 11');
  const style = normalizeStyle({ rotation: -90, turns: `0 5,-${angle} ${angle}`, gaps: '0.08 ~ 0,0.18 0.18 0' });
  const shape = shapeOfStyle(style, 2);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  expect(result.turns).toEqual(shape.turns);
  expect(result.linkGaps).toEqual(shape.linkGaps);
  expect(result.after).toBe(result.before);
  expect(
    networkSvg(links, style, { extraTurns: result.delta, extraGaps: result.linkGaps, extraFrame: result.frame }),
  ).toBe(networkSvg(links, style));
});
it.each(['1111', '2222'])('finds symmetric close references to a closed link in %s', (code) => {
  const links = decode(code.match(/../g).join(' '));
  const shape = shapeOfStyle(STYLE_DEFAULTS, 2);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  const open = code === '1111' ? 1 : 0;
  expect(result.turns[open][0] + result.turns[open][1]).toBe(0);
  expect(result.linkGaps[open][0]).toBe(result.linkGaps[open][1]);
  expect(result.linkGaps[open][0]).toBeGreaterThan(0.08);
  expect(result.linkGaps[open][0]).toBeLessThan(0.2);
  expect(result.after - turningCost(result.turns)).toBeCloseTo(0, 9);
  const solved = { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame };
  const curves = layoutCurves(links, solved);
  const { scale } = curveTransform(curves, solved);
  const lines = curves.map((c, i) => visiblePolyline(c, solved, i, scale));
  const spaces = referenceSpaces(lines[open], lines[1 - open], scale);
  expect(spaces.every((v) => v >= shape.clearance - 1e-8)).toBe(true);
  // The coupled search closes the former excessive space between the ends.
  expect(spaces[2]).toBeLessThan(shape.clearance + 0.5);
  const target = curves[1 - open].middle.at;
  const radii = [curves[open].start.at, curves[open].end.at].map((p) => Math.hypot(...p.map((v, i) => v - target[i])));
  expect(radii[0]).toBeCloseTo(radii[1], 9);
  const again = solveCollisions(links, solved, { adjustGaps: true });
  expect(again.turns).toEqual(result.turns);
  expect(again.linkGaps).toEqual(result.linkGaps);
  const changed = withSpacing(STYLE_DEFAULTS, result);
  expect(networkSvg(links, changed)).toBe(
    networkSvg(links, STYLE_DEFAULTS, {
      extraTurns: result.delta,
      extraGaps: result.linkGaps,
      extraFrame: result.frame,
    }),
  );
  expect(overlapCost(links, shapeOfStyle(changed, 2))).toBeCloseTo(result.after, 8);
  expect(styleFromParams(styleToParams(changed))).toEqual(changed);
});
it.each([
  { range: 0, gapRange: 0, middleRange: 0 },
  { range: 4, gapRange: 0.02, middleRange: 0 },
  { range: 10, step: 5, gapRange: 0.1, middleRange: 0 },
])('respects original turn and gap bounds across all joint search stages: %j', (bounds) => {
  const links = decode('11 11 22');
  const shape = shapeOfStyle(normalizeStyle({ turns: '0 5,7 -7,175 -175' }), 3);
  const snapshot = JSON.stringify(shape);
  const result = solveCollisions(links, shape, { adjustGaps: true, ...bounds });
  expect(JSON.stringify(shape)).toBe(snapshot);
  expect(result.after).toBeLessThanOrEqual(result.before);
  result.turns.forEach((pair, i) =>
    pair.forEach((angle, end) => {
      expect(Math.abs(angle)).toBeLessThanOrEqual(180);
      expect(Math.abs(angle - shape.turns[i][end])).toBeLessThanOrEqual(bounds.range);
      expect(Math.abs((angle - shape.turns[i][end]) % (bounds.step || 1))).toBe(0);
    }),
  );
  result.linkGaps.forEach((row, i) =>
    row.forEach((gap, k) => {
      const original = shape.linkGaps[i][k] ?? shape[['startGap', 'endGap', 'middleGapStart', 'middleGapEnd'][k]];
      expect(Math.abs((gap ?? original) - original)).toBeLessThanOrEqual(
        (k < 2 ? bounds.gapRange : bounds.middleRange) + 1e-9,
      );
    }),
  );
});
it('measures painted boundaries of strokes, crossings, filled markers and broken paths', () => {
  const line = (points, width = 0, fills = []) => Object.assign(points, { width, fills });
  const a = line(
    [
      [0, 0],
      [3, 0],
    ],
    1,
  );
  expect(
    paintedDistance(
      a,
      line(
        [
          [0, 3],
          [3, 3],
        ],
        1,
      ),
    ),
  ).toBe(2);
  expect(
    paintedDistance(
      a,
      line([
        [1, -1],
        [1, 1],
      ]),
    ),
  ).toBe(0);
  const polygon = [
    [0, 0],
    [3, 0],
    [3, 3],
    [0, 3],
    [0, 0],
  ];
  expect(
    paintedDistance(
      line(polygon, 0, [polygon]),
      line([
        [1, 1],
        [2, 1],
      ]),
    ),
  ).toBe(0);
  expect(paintedDistance(line([[0, 0], null, [3, 0]]), a)).toBe(Infinity);
});
it('defaults both the editable turn step and solver turn resolution to one degree', () => {
  expect(STYLE_DEFAULTS.solveStep).toBe(1);
  const links = decode('22 13 31');
  const shape = shapeOfStyle(STYLE_DEFAULTS, 3);
  expect(solveCollisions(links, shape)).toEqual(solveCollisions(links, shape, { step: 1 }));
});
