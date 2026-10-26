import { expect, it } from 'vitest';
import { pointAlongCurve } from './curve-tools';
import { bezier, glyphCurves, glyphParts } from './glyph';
import { normalizeStyle, shapeOfStyle } from './style';
const numbers = (path) => path.match(/-?\d+(?:\.\d+)?/g).map(Number);
const sub = (a, b) => a.map((v, i) => v - b[i]);
it('places endpoint and middle markers on both halves with local tangents, even across the join', () => {
  for (const key of ['start', 'end', 'middle']) {
    for (const offset of [-12, 12, 20]) {
      const shape = shapeOfStyle(
        normalizeStyle({
          bulge: 130,
          start: 'bar',
          end: 'bar',
          middle: 'bar',
          startOffset: 0,
          [`${key}Offset`]: offset,
        }),
        1,
      );
      const [curve] = glyphCurves([[1, 1]], shape);
      const expected = pointAlongCurve(curve.segments, key === 'end' ? -offset : offset, key);
      const marker = glyphParts([[1, 1]], shape)[0][key];
      const [x, y, u, v] = numbers(marker.d);
      expect(Math.hypot(x + u - 2 * expected.at[0], y + v - 2 * expected.at[1])).toBeLessThan(0.02);
      expect(Math.abs((u - x) * expected.dir[0] + (v - y) * expected.dir[1])).toBeLessThan(0.025);
    }
  }
});
it('measures path distance rather than a tangent translation and extends ends safely', () => {
  const segments = [
    [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ],
    [
      [10, 0],
      [10, -10],
      [20, -10],
      [20, 0],
    ],
  ];
  const at = pointAlongCurve(segments, 10);
  expect(Math.hypot(...sub(at.at, bezier(segments[0], 0.5)))).toBeLessThan(0.001);
  expect(pointAlongCurve(segments, 25).at[0]).toBeGreaterThan(10);
  expect(pointAlongCurve(segments, 0, 'middle').at).toEqual([10, 0]);
  expect(pointAlongCurve(segments, -4).at).toEqual([0, -4]);
  expect(pointAlongCurve(segments, 4, 'end').at).toEqual([20, 4]);
  expect(pointAlongCurve([Array(4).fill([3, 5])], 10)).toEqual({ at: [13, 5], dir: [1, 0] });
});
