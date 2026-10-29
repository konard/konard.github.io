import { expect, it, vi } from 'vitest';
import { decode } from './configurations';
import { solveCollisions, overlapCost, turningCost } from './collisions';
import { glyphParts, glyphCurves } from './glyph';
import { networkSvg } from './render';
import { normalizeStyle, shapeOfStyle, styleFromParams, styleToParams, withTurns } from './style';
import { withGaps } from './gaps';

const links = decode('22 22');
const fixture = (patch = {}) => normalizeStyle({ rotation: 90, ...patch });
it('discovers separated reference gaps for 2222 without manual gaps', () => {
  const style = fixture();
  const shape = shapeOfStyle(style, 2);
  const result = solveCollisions(links, shape, { adjustGaps: true });
  expect(result.linkGaps[0][0]).toBeGreaterThan(0.08);
  expect(result.linkGaps[0][1]).toBeGreaterThan(0.08);
  expect(result.after).toBeLessThan(result.before);
  const applied = withGaps(withTurns(style, result.turns), result.linkGaps);
  expect(networkSvg(links, style, { extraTurns: result.delta, extraGaps: result.linkGaps })).toBe(
    networkSvg(links, applied),
  );
  expect(overlapCost(links, shapeOfStyle(applied, 2))).toBeCloseTo(result.after, 8);
});
it('scores painted markers and user selected spacing, including near reference middles', () => {
  const cost = (patch) => overlapCost(links, shapeOfStyle(fixture(patch), 2));
  expect(cost({ start: 'none', end: 'none', middle: 'none' })).toBeLessThan(cost({}));
  expect(cost({ clearance: 6 })).toBeGreaterThan(cost({ clearance: 0 }));
  expect(cost({ strokeWidth: 5 })).toBeGreaterThan(cost({ strokeWidth: 0.5 }));
});
it('recognizes the supplied perfect manual arrangement and keeps diagnostics opt-in', () => {
  const shape = shapeOfStyle(fixture({ turns: '15 -15', gaps: '0.18 0.18 ~ ~' }), 2);
  // Only the 30 degrees of existing turns contribute; no painted overlap.
  expect(overlapCost(links, shape)).toBeCloseTo(turningCost(shape.turns), 8);
  const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
  try {
    solveCollisions(links, shape, { passes: 0 });
    expect(debug).not.toHaveBeenCalled();
    solveCollisions(links, shape, { passes: 0, debug: true });
    expect(debug).toHaveBeenCalledWith('[network solver]', expect.objectContaining({ links: 2, clearance: 1 }));
  } finally {
    debug.mockRestore();
  }
});
it('keeps acute arrow tips sharp independent of line corners, with balanced extent by default', () => {
  for (const endAngle of [5, 15, 45]) {
    const style = fixture({ turns: '15 -15', gaps: '0.18 0.18 ~ ~', endAngle, linejoin: 'round' });
    const svg = networkSvg(links, style);
    expect(svg).toMatch(/stroke-linejoin="miter" stroke-miterlimit="[\d.]+"/);
    const part = glyphParts(links, shapeOfStyle(style, 2))[0];
    const numbers = (path) => path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const start = numbers(part.line).slice(0, 2);
    const tip = numbers(part.end.d).slice(2, 4);
    const raw = glyphParts(links, shapeOfStyle({ ...style, balanceArrows: false }, 2))[0];
    const rawTip = numbers(raw.end.d).slice(2, 4);
    expect(tip[1]).toBeLessThan(rawTip[1]);
    const extension = style.strokeWidth / 2 / Math.sin((endAngle * Math.PI) / 180);
    const curve = glyphCurves(links, shapeOfStyle(style, 2))[0];
    expect(Math.abs(tip[1] + extension * curve.end.dir[1] - (start[1] + style.strokeWidth / 2))).toBeLessThan(0.03);
  }
});
it('round trips rounded arrows, legacy lengths and spacing settings', () => {
  const style = fixture({ arrowJoin: 'round', balanceArrows: false, clearance: 4.5 });
  expect(styleFromParams(styleToParams(style))).toEqual(style);
  expect(style.arrowJoin).toBe('round');
  expect(style.balanceArrows).toBe(false);
  expect(style.clearance).toBe(4.5);
});
it('keeps zero-gap self loops finite when both endpoints coincide with their middle', () => {
  const style = fixture({ start: 'tail', startOffset: 0, startGap: 0, endGap: 0 });
  const svg = networkSvg(decode('11'), style);
  expect(svg).not.toMatch(/NaN|Infinity/);
});
