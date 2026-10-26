import { describe, expect, it } from 'vitest';
import { bezier, glyphCurves, glyphParts, layoutCurves } from './glyph';
import { STYLE_DEFAULTS, STYLE_FIELDS, normalizeStyle, shapeOfStyle, styleFromParams, styleToParams } from './style';

const shape = (raw = {}, n = 1) => shapeOfStyle(normalizeStyle(raw), n);
const numbers = (path) => path.match(/-?\d+(?:\.\d+)?/g).map(Number);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

describe('issue 23 geometry regressions', () => {
  it('defaults to straight free links with neutral bend and rotation', () => {
    expect(STYLE_DEFAULTS.bulge).toBe(0);
    expect(STYLE_DEFAULTS.rotation).toBe(0);
    const [curve] = layoutCurves([[0, 0]], shape());
    const axis = sub(curve.end.at, curve.start.at);
    for (const segment of curve.segments)
      for (let k = 0; k <= 20; k++)
        expect(Math.abs(cross(sub(bezier(segment, k / 20), curve.start.at), axis))).toBeLessThan(1e-10);
  });

  it('accepts signed bends and endpoint angles over a full turn', () => {
    for (const key of ['bulge', 'rotation', 'sourceAngle', 'targetAngle']) {
      const field = STYLE_FIELDS.find((f) => f.key === key);
      expect(field.min, key).toBeLessThanOrEqual(-180);
      expect(field.max, key).toBeGreaterThanOrEqual(180);
      expect(normalizeStyle({ [key]: -150 })[key]).toBe(-150);
    }
  });

  it('adjusts self/partial loop width independently while leaving free links straight', () => {
    const free = layoutCurves([[0, 0]], shape());
    for (const loopBend of [-180, 0, 180]) {
      expect(layoutCurves([[0, 0]], shape({ loopBend }))).toEqual(free);
      for (const links of [[[1, 1]], [[0, 1]], [[1, 0]]]) {
        const [base] = layoutCurves(links, shape());
        const [curve] = layoutCurves(links, shape({ loopBend }));
        expect(curve.start.at).toEqual(base.start.at);
        expect(curve.end.at).toEqual(base.end.at);
        if (loopBend !== 0) expect(curve.segments).not.toEqual(base.segments);
        if (links[0][0] === 0) expect(curve.segments[0]).toEqual(base.segments[0]);
        if (links[0][1] === 0) expect(curve.segments[1]).toEqual(base.segments[1]);
      }
    }
  });

  it('moves a source bar along its cubic and rotates it with the local tangent', () => {
    const options = shape({ bulge: 90, startOffset: 12 });
    const [curve] = glyphCurves([[0, 0]], options);
    const [part] = glyphParts([[0, 0]], options);
    const [x1, y1, x2, y2] = numbers(part.start.d);
    const at = [(x1 + x2) / 2, (y1 + y2) / 2];
    let best = { distance: Infinity };
    for (let k = 0; k <= 10000; k++) {
      const t = k / 10000;
      const p = bezier(curve.segments[0], t);
      const distance = Math.hypot(...sub(p, at));
      if (distance < best.distance) best = { distance, t };
    }
    expect(best.distance).toBeLessThan(0.02);
    const tangent = sub(bezier(curve.segments[0], best.t + 0.00001), bezier(curve.segments[0], best.t - 0.00001));
    const bar = [x2 - x1, y2 - y1];
    expect(
      Math.abs((tangent[0] * bar[0] + tangent[1] * bar[1]) / Math.hypot(...tangent) / Math.hypot(...bar)),
    ).toBeLessThan(0.005);
  });

  it('preserves independent per-link gaps through normalization and sharing', () => {
    const style = normalizeStyle({ gaps: '0.2 0.3 4 5,~ 0 0 0' });
    expect(style.gaps).toBe('0.2 0.3 4 5,~ 0 0 0');
    expect(styleFromParams(styleToParams(style))).toEqual(style);
    const links = [
      [1, 1],
      [2, 2],
    ];
    const curves = layoutCurves(links, shapeOfStyle(style, 2));
    const distance = (a, b) => Math.hypot(...sub(a, b));
    expect(distance(curves[0].start.at, curves[0].middle.at)).toBeCloseTo(0.2, 10);
    expect(distance(curves[0].end.at, curves[0].middle.at)).toBeCloseTo(0.3, 10);
    expect(distance(curves[1].start.at, curves[1].middle.at)).toBeCloseTo(STYLE_DEFAULTS.startGap, 10);
    const parts = glyphParts(links, shapeOfStyle(style, 2));
    expect(parts[0].line.match(/M/g)).toHaveLength(2);
    expect(parts[1].line.match(/M/g)).toHaveLength(1);
  });
});
