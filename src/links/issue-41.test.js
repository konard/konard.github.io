import { describe, expect, it } from 'vitest';
import { codeAt, decode } from './configurations';
import { layoutCurves } from './glyph';
import { linkTurns, normalizeStyle, shapeOfStyle, styleFromParams, styleToParams, withTurns } from './style';
import { reported, randomNetworks } from '../../experiments/issue-41-cases.mjs';

const linksOf = (code) => decode(code.match(/../g).join(' '));
const curves = (links, raw = {}) => layoutCurves(links, shapeOfStyle(normalizeStyle(raw), links));
const near = (a, b) => expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(1e-10);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const simpleOpen = (links, i) => links[i].includes(0) && links[i].some((ref) => ref && ref !== i + 1);
function straight(curve) {
  const axis = sub(curve.end.at, curve.start.at);
  for (const point of curve.segments.flat()) {
    const offset = sub(point, curve.start.at);
    expect(Math.abs(axis[0] * offset[1] - axis[1] * offset[0])).toBeLessThan(1e-10);
  }
}

describe('simple default reference turns (issue 41)', () => {
  // Issue 43 makes the straight arrangement neutral, with zero editable turns.
  it.each(reported)('$code keeps the supplied straight arrangement at zero turns', ({ code }) => {
    const links = linksOf(code);
    const actual = curves(links);
    const expected = curves(links, { turns: '0 0' });
    actual.forEach((curve, i) => {
      curve.segments.flat().forEach((point, k) => near(point, expected[i].segments.flat()[k]));
      if (simpleOpen(links, i)) straight(curve);
    });
    expect(linkTurns(normalizeStyle(), links)).toEqual(links.map(() => [0, 0]));
  });

  it.each(randomNetworks())('%s keeps every free-to-other link straight', (code) => {
    const links = linksOf(code);
    curves(links).forEach((curve, i) => {
      if (simpleOpen(links, i)) straight(curve);
    });
  });

  it('straightens a through-link when its two references and middle are collinear', () => {
    const links = [
      [0, 0],
      [1, 3],
      [0, 0],
    ];
    straight(curves(links, { placement: 'cards' })[1]);
  });

  it('audits every 1–3-link topology: straight open links, fixed middles/closed halves and unchanged gaps', () => {
    let networks = 0;
    let adjusted = 0;
    for (let n = 1; n <= 3; n++) {
      for (let index = 0; index < (n + 1) ** (2 * n); index++) {
        const links = decode(codeAt(n, BigInt(index)));
        const style = normalizeStyle();
        const shape = shapeOfStyle(style, links);
        const original = layoutCurves(links, shapeOfStyle(style, n));
        const actual = layoutCurves(links, shape);
        expect(shape.linkGaps).toEqual(shapeOfStyle(style, n).linkGaps);
        expect(shape.startGap).toBe(style.startGap);
        expect(shape.endGap).toBe(style.endGap);
        actual.forEach((curve, i) => {
          expect(curve.middle).toEqual(original[i].middle);
          links[i].forEach((ref, end) => {
            if (ref === 0 || ref === i + 1) expect(curve.segments[end]).toEqual(original[i].segments[end]);
            if (shape.turns[i][end]) adjusted++;
          });
          if (simpleOpen(links, i)) straight(curve);
        });
        networks++;
      }
    }
    expect(networks).toBe(4181);
    expect(adjusted).toBe(0);
  });

  it.each(['auto', 'circle', 'square', 'hex', 'dice', 'cards', 'spiral', 'force'])(
    'keeps simple references straight under %s placement, rotation, aspect and order',
    (placement) => {
      const links = linksOf('020030');
      const raw = { placement, rotation: 39, layoutAspect: 1.2, order: '2 3 1', spread: 0.7 };
      curves(links, raw).slice(0, 2).forEach(straight);
    },
  );

  it('keeps explicit zero turns neutral, including after sharing', () => {
    const links = linksOf('0222');
    const manual = withTurns(normalizeStyle(), [
      [0, 0],
      [0, 0],
    ]);
    expect(manual.turns).not.toBe('');
    expect(linkTurns(manual, links)).toEqual([
      [0, 0],
      [0, 0],
    ]);
    expect(styleFromParams(styleToParams(manual))).toEqual(manual);
    expect(curves(links, manual)).toEqual(curves(links));
  });

  it('preserves manual angles, bends, legacy geometry and non-straight configurations', () => {
    for (const raw of [
      { turns: '12 -17' },
      { sourceAngle: 24, targetAngle: 40 },
      { bulge: 20 },
      { bendMode: 'rotate' },
      { angles: 'mirror' },
    ]) {
      const links = linksOf('2002');
      const style = normalizeStyle(raw);
      expect(curves(links, raw)).toEqual(layoutCurves(links, shapeOfStyle(style, links.length)));
    }
    for (const code of ['00', '01', '10', '11', '1111', '2222', '112212', '1221', '2012', '1212', '033310']) {
      const links = linksOf(code);
      expect(curves(links)).toEqual(layoutCurves(links, shapeOfStyle(normalizeStyle(), links.length)));
    }
  });
});
