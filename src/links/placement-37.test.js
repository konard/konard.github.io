import { expect, it } from 'vitest';
import { decode } from './configurations';
import { solveCollisions } from './collisions';
import { layout, glyphCurves } from './glyph';
import { networkSvg } from './render';
import { normalizeStyle, shapeOfStyle, withSpacing, styleFromParams, styleToParams } from './style';
import { randomNetworks } from '../../experiments/issue-37-networks.mjs';

it.each(['34442132', '2222', ...randomNetworks()])(
  'automatic spacing cannot move or recolor the links in %s',
  (code) => {
    const links = decode(code.match(/../g).join(' '));
    const style = normalizeStyle({ palette: 'custom', colors: '#ff0000,#00ff00,#0000ff,#ffffff' });
    const shape = shapeOfStyle(style, links.length);
    const original = layout(links.length, shape, links);
    const result = solveCollisions(links, shape, { adjustGaps: true });
    expect(result.layout).toBeUndefined();
    result.delta.flat().forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(30));
    const applied = withSpacing(style, result);
    expect(layout(links.length, shapeOfStyle(applied, links.length), links)).toEqual(original);
    const fitted = { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame };
    const before = glyphCurves(links, shape);
    glyphCurves(links, fitted).forEach((curve, i) => {
      expect(curve.middle.at).toEqual(before[i].middle.at);
      // A closed half is preserved in image coordinates too, including its
      // control handles, endpoint marker and middle attachment.
      links[i].forEach((reference, end) => {
        if (reference === i + 1) expect(curve.segments[end]).toEqual(before[i].segments[end]);
      });
    });
    const colors = (svg) => [...svg.matchAll(/<g stroke="([^"]+)"/g)].map((match) => match[1]);
    expect(colors(networkSvg(links, applied))).toEqual(colors(networkSvg(links, style)));
  },
);

it.each(['auto', 'circle', 'square', 'hex', 'dice', 'cards', 'spiral', 'force'])(
  'keeps the chosen %s placement even with an explicitly broad turn search',
  (placement) => {
    const links = decode('34 44 21 32');
    const style = normalizeStyle({ placement, order: '1 3 2 4', spread: 0.7, rotation: 39, layoutAspect: 1.2 });
    const shape = shapeOfStyle(style, links.length);
    const result = solveCollisions(links, shape, { adjustGaps: true, range: 180 });
    expect(result.layout).toBeUndefined();
    expect(
      layout(links.length, { ...shape, turns: result.turns, linkGaps: result.linkGaps, frame: result.frame }, links),
    ).toEqual(layout(links.length, shape, links));
    const applied = shapeOfStyle(withSpacing(style, result), links.length);
    const original = glyphCurves(links, shape);
    glyphCurves(links, applied).forEach((curve, i) => expect(curve.middle.at).toEqual(original[i].middle.at));
  },
);

it('cannot apply a layout override through the renderer', () => {
  const links = decode('34 44 21 32');
  const style = normalizeStyle();
  expect(networkSvg(links, style, { extraLayout: { order: '1 3 2 4', spread: 0.55, palette: 'pastel' } })).toBe(
    networkSvg(links, style),
  );
});

it('shares the pinned frame exactly and rejects malformed frame metadata', () => {
  const style = normalizeStyle({ frame: ' 42.123456789012  50 -2.5 ' });
  expect(style.frame).toBe('42.123456789012 50 -2.5');
  expect(styleFromParams(styleToParams(style))).toEqual(style);
  for (const frame of ['0 50 50', '-1 50 50', '61 50 50', '20 Infinity 50', '20 50', '20 0 0 3', '<svg>']) {
    expect(normalizeStyle({ frame }).frame).toBe('');
    expect(networkSvg(decode('22 22'), { frame })).toBe(networkSvg(decode('22 22')));
  }
});
