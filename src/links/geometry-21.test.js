import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codeAt, decode, networkCount } from './configurations';
import { COLORS, bezier, glyphSvg, layoutCurves } from './glyph';
import { STYLE_DEFAULTS, linkColors, normalizeStyle, shapeOfStyle, styleFromParams, styleToParams } from './style';

const shape = (raw = {}, n = 1) => shapeOfStyle(normalizeStyle(raw), n);
const near = (a, b) => expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(1e-10);
const symmetric = ({ segments: [first, second], middle }) => {
  for (let k = 0; k <= 32; k++) {
    const p = bezier(first, 1 - k / 32);
    near(bezier(second, k / 32), [2 * middle.at[0] - p[0], 2 * middle.at[1] - p[1]]);
  }
};

describe('balanced editor geometry (issue #21)', () => {
  it('makes equal self-reference ends point-symmetric for all equal angles and bends', () => {
    for (const angle of [-60, 0, 24, 30, 60]) {
      for (const bulge of [0, 19, 20, 25, 45, 90]) {
        const links = decode('11 22');
        for (const curve of layoutCurves(links, shape({ sourceAngle: angle, targetAngle: angle, bulge }, 2))) {
          symmetric(curve);
        }
      }
    }
  });

  it('changes curvature without moving free/loop anchors or rotating the whole symbol', () => {
    for (const links of [decode('00'), decode('11'), decode('00 00 00 00'), decode('11 22')]) {
      const a = layoutCurves(links, shape({ bulge: 10 }, links.length));
      const b = layoutCurves(links, shape({ bulge: 60 }, links.length));
      expect(b).not.toEqual(a);
      a.forEach((curve, i) => {
        near(b[i].start.at, curve.start.at);
        near(b[i].end.at, curve.end.at);
        near(b[i].middle.at, curve.middle.at);
        symmetric(curve);
        symmetric(b[i]);
      });
    }
  });

  it('starts with a centered cross made by a bar intersecting the line', () => {
    expect(STYLE_DEFAULTS.start).toBe('bar');
    expect(STYLE_DEFAULTS.startOffset).toBe(STYLE_DEFAULTS.startSize);
    expect(STYLE_DEFAULTS.startAcross).toBe(0);
    expect(STYLE_DEFAULTS.startRotation).toBe(0);
  });

  it('uses gallery colors until the user explicitly changes them', () => {
    expect(linkColors(STYLE_DEFAULTS, 4)).toEqual(COLORS.slice(0, 4));
    expect(linkColors(normalizeStyle({ palette: 'custom', colors: '#ff2600,#00f900' }), 2)).toEqual([
      '#ff2600',
      '#00f900',
    ]);
  });

  it('keeps every explicit supplied setting through query serialization in both directions', () => {
    for (const query of [
      'sourceAngle=24&targetAngle=40&tension=0.4&bulge=25&startGap=0.09&startOffset=2.9',
      'bulge=19&padding=10&startOffset=2.5',
    ]) {
      const params = new URLSearchParams(query);
      const style = styleFromParams(params);
      for (const [key, value] of params) expect(style[key]).toBe(Number(value));
      expect(styleFromParams(styleToParams(style))).toEqual(style);
    }
  });

  it('preserves the gallery and rain SVG byte for byte', () => {
    const baseline = JSON.parse(readFileSync('docs/case-studies/issue-21/data/gallery-baseline.json'));
    for (const n of [1, 2, 3, 4]) {
      const hash = createHash('sha256');
      for (let i = 0; i < baseline[n].count; i++) {
        const index = n < 4 ? i : Math.floor((i * (networkCount(n) - 1)) / (baseline[n].count - 1));
        hash.update(glyphSvg(decode(codeAt(n, index))));
      }
      expect(hash.digest('hex')).toBe(baseline[n].sha256);
    }
  });
});

describe('editor symmetry and compatibility', () => {
  it('keeps four free links related by exact quarter turns, including after fitting', async () => {
    const { glyphCurves } = await import('./glyph');
    const curves = glyphCurves(decode('00 00 00 00'), shape({}, 4));
    for (let i = 0; i < 4; i++) {
      curves[i].segments.forEach((segment, k) =>
        segment.forEach((p, j) => {
          near(curves[(i + 1) % 4].segments[k][j], [100 - p[1], p[0]]);
        }),
      );
    }
  });

  it('makes the source bar exactly centered and perpendicular to its tangent', async () => {
    const { glyphCurves, glyphParts } = await import('./glyph');
    const options = shape({ bulge: 0 });
    const [curve] = glyphCurves([[0, 0]], options);
    const [parts] = glyphParts([[0, 0]], options);
    const [x1, y1, x2, y2] = parts.start.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const center = [(x1 + x2) / 2, (y1 + y2) / 2];
    near(center, [curve.start.at[0] + options.startOffset, curve.start.at[1]]);
    expect(x1).toBe(x2);
    expect(y1 - center[1]).toBe(center[1] - y2);
    expect(Math.hypot(x1 - x2, y1 - y2)).toBe(2 * options.startSize);
  });

  it('honors colors stored by links shared when custom was the default', () => {
    const style = styleFromParams(new URLSearchParams('colors=%23ff2600,%2300f900'));
    expect(style.palette).toBe('custom');
    expect(linkColors(style, 2)).toEqual(['#ff2600', '#00f900']);
  });

  it('keeps all small editor configurations finite and continuous', () => {
    for (const n of [1, 2, 3]) {
      for (let i = 0; i < networkCount(n); i++) {
        const curves = layoutCurves(decode(codeAt(n, i)), shape({}, n));
        for (const {
          segments: [a, b],
        } of curves) {
          expect(a.flat().concat(b.flat()).every(Number.isFinite)).toBe(true);
          near(a[3], b[0]);
          const incoming = [a[3][0] - a[2][0], a[3][1] - a[2][1]];
          const outgoing = [b[1][0] - b[0][0], b[1][1] - b[0][1]];
          expect(Math.abs(incoming[0] * outgoing[1] - incoming[1] * outgoing[0])).toBeLessThan(1e-10);
          expect(incoming[0] * outgoing[0] + incoming[1] * outgoing[1]).toBeGreaterThan(0);
        }
      }
    }
  });
});
