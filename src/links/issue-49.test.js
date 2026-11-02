import { describe, expect, it } from 'vitest';
import before from '../../docs/case-studies/issue-49/data/geometry-before.json';
import { decode } from './configurations';
import { bezier, layout, layoutCurves, OVERLAP_BEND, overlapBends, shapeOf } from './glyph';
import { normalizeStyle, shapeOfStyle } from './style';

const linksOf = (code) => decode(code.match(/../g).join(' '));
const round = (v) => (Array.isArray(v) ? v.map(round) : Math.round(v * 1e9) / 1e9 + 0);
const geometry = (links, raw = {}) =>
  layoutCurves(links, shapeOfStyle(normalizeStyle(raw), links)).map((curve) => round(curve.segments));

// The two-link networks whose two straight references were one line at zero
// turns before issue #49 (docs/case-studies/issue-49/data/overlaps-before.json).
const OVERLAPPING = Object.keys(before);

describe('zero turns never draw two references on top of each other (issue 49)', () => {
  it('draws /network/?code=0201 at zero as `turns=0 45, 0 45` was drawn before', () => {
    expect(geometry(linksOf('0201'))).toEqual(before['0201']['0 45, 0 45']);
    expect(geometry(linksOf('0201'), { turns: '0 0, 0 0' })).toEqual(before['0201']['0 45, 0 45']);
  });

  it.each(OVERLAPPING)('bends both overlapping ends of %s by 45° and nothing else', (code) => {
    const links = linksOf(code);
    // A reference that meets another middle at its source or its target end.
    const ends = links.map(([s, t], i) =>
      [s, t].map((ref) => (ref !== 0 && ref !== i + 1 ? OVERLAP_BEND : 0)).join(' '),
    );
    expect(geometry(links)).toEqual(before[code][ends.join(', ')]);
    // The two curves now meet only near the middles they share.
    const [a, b] = layoutCurves(links, shapeOfStyle(normalizeStyle(), links));
    const samples = (curve) =>
      curve.segments.flatMap((seg) => Array.from({ length: 101 }, (_, k) => bezier(seg, k / 100)));
    const others = samples(b);
    const close = samples(a).filter((p) => others.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.004));
    expect(close.length).toBeLessThan(20);
  });

  it('keeps explicit turns as offsets from the new neutral geometry', () => {
    const links = linksOf('0201');
    expect(geometry(links, { turns: '0 -45, 0 -45' })).toEqual(before['0201']['0']);
  });

  it('keeps the gallery and rain geometry (rotate bending) unchanged', () => {
    const links = linksOf('0201');
    const shape = shapeOf({ bendMode: 'rotate' });
    expect(overlapBends(links, layout(links.length, shape, links), shape)).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it('leaves networks without overlapping references alone', () => {
    for (const code of ['0211', '2011', '0001', '2002', '0102']) {
      const links = linksOf(code);
      const shape = shapeOfStyle(normalizeStyle(), links);
      expect(overlapBends(links, layout(links.length, shape, links), shape)).toEqual(links.map(() => [0, 0]));
    }
  });
});
