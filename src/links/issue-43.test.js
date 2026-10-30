import { describe, expect, it } from 'vitest';
import baseline from '../../docs/case-studies/issue-43/data/audit-before.json';
import { codeAt, decode } from './configurations';
import { overlapCost } from './collisions';
import { layoutCurves } from './glyph';
import { linkTurns, normalizeStyle, shapeOfStyle } from './style';

const linksOf = (code) => decode(code.match(/../g).join(' '));
const curves = (links, raw = {}) => layoutCurves(links, shapeOfStyle(normalizeStyle(raw), links));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const straight = (curve) => {
  const axis = sub(curve.end.at, curve.start.at);
  for (const point of curve.segments.flat()) {
    const offset = sub(point, curve.start.at);
    expect(Math.abs(axis[0] * offset[1] - axis[1] * offset[0])).toBeLessThan(1e-10);
  }
};

describe('zero is the neutral reference geometry (issue 43)', () => {
  it.each(['0211', '2011', '2210', '2221', '0222', '0112', '0001', '2002'])(
    '%s starts with zero turns and a straight single reference',
    (code) => {
      const links = linksOf(code);
      expect(linkTurns(normalizeStyle(), links)).toEqual(links.map(() => [0, 0]));
      const actual = curves(links);
      expect(curves(links, { turns: '0 0' })).toEqual(actual);
      actual.forEach((curve, i) => {
        const other = links[i].filter((ref) => ref && ref !== i + 1);
        if (other.length === 1 && links[i].includes(0)) straight(curve);
        else if (other.length === 1) {
          const end = links[i][0] === i + 1 ? 1 : 0;
          const [p0, p1, p2, p3] = curve.segments[end];
          const chord = sub(p3, p0);
          for (const point of [p1, p2]) {
            const offset = sub(point, p0);
            expect(Math.abs(chord[0] * offset[1] - chord[1] * offset[0])).toBeLessThan(1e-10);
          }
        }
      });
    },
  );

  it('uses the same zero defaults for every small topology and count-only geometry callers', () => {
    for (let n = 1; n <= 3; n++) {
      for (let index = 0; index < (n + 1) ** (2 * n); index++) {
        const links = decode(codeAt(n, index));
        const style = normalizeStyle();
        const shape = shapeOfStyle(style, links);
        expect(shape.turns).toEqual(links.map(() => [0, 0]));
        expect(shape).toEqual(shapeOfStyle(style, n));
      }
    }
  });

  it.each(['auto', 'circle', 'square', 'hex', 'dice', 'cards', 'spiral', 'force'])(
    'straightens references at zero under %s placement for larger networks',
    (placement) => {
      for (const n of [3, 5, 10, 25]) {
        const links = Array.from({ length: n }, (_, i) => (i === n - 1 ? [n, n] : [0, n]));
        const raw = { placement, rotation: 39, layoutAspect: 1.2, spread: 0.7, turns: '0 0' };
        curves(links, raw).slice(0, -1).forEach(straight);
      }
    },
  );

  it('preserves every previously clear small drawing from the measured parent baseline', () => {
    expect(baseline.clear).toHaveLength(365);
    for (const code of baseline.clear) {
      const links = decode(code);
      expect(overlapCost(links, shapeOfStyle(normalizeStyle(), links)), code).toBeLessThan(1e-8);
    }
  });

  it('applies explicit turns relative to neutral geometry, at either end', () => {
    for (const code of ['0211', '2011']) {
      const links = linksOf(code);
      const end = links[0][0] === 0 ? 1 : 0;
      const key = end ? 'end' : 'start';
      const original = curves(links)[0][key].dir;
      for (const angle of [-45, -1, 1, 45]) {
        const turns = end ? `0 ${angle}` : `${angle} 0`;
        const actual = curves(links, { turns })[0][key].dir;
        const measured =
          (Math.atan2(
            original[0] * actual[1] - original[1] * actual[0],
            original[0] * actual[0] + original[1] * actual[1],
          ) *
            180) /
          Math.PI;
        expect(measured).toBeCloseTo(angle, 10);
      }
    }
  });
});
