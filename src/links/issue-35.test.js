import { expect, it } from 'vitest';
import { solveCollisions } from './collisions';
import { decode } from './configurations';
import { glyphParts } from './glyph';
import { networkSvg } from './render';
import { normalizeStyle, shapeOfStyle, withSpacing, styleFromParams, styleToParams } from './style';

const links = decode('00 30 02');
const optionsOf = (style) => ({
  range: style.solveRange,
  step: style.solveStep,
  adjustGaps: style.solveGaps,
  gapRange: style.solveGapRange,
  middleRange: style.solveMiddleRange,
});
const solve = (style, options = optionsOf(style)) => {
  const shape = shapeOfStyle(style, links.length);
  const result = solveCollisions(links, shape, options);
  const applied = withSpacing(style, result);
  return { shape, result, applied };
};

it.each(['editor', 'solver'])('keeps the reported network continuous with default %s options', (entry) => {
  const style = styleFromParams(new URLSearchParams('solve=true'));
  const { result, applied } = solve(style, entry === 'solver' ? { adjustGaps: true } : optionsOf(style));
  expect(result.after).toBeLessThan(result.before);
  result.linkGaps.forEach((row) => expect(row.slice(2).every((cut) => cut == null || cut === 0)).toBe(true));
  glyphParts(links, shapeOfStyle(applied, links.length)).forEach(({ line }) => {
    expect(line.match(/M/g)).toHaveLength(1);
    expect(line.match(/C/g)).toHaveLength(2);
  });
  expect(networkSvg(links, applied)).toBe(
    networkSvg(links, style, { extraTurns: result.delta, extraGaps: result.linkGaps, extraFrame: result.frame }),
  );
  expect(styleFromParams(styleToParams(applied))).toEqual(applied);
});

it.each([
  { middleGapStart: 3, middleGapEnd: 2 },
  { middleGapStart: 3, middleGapEnd: 2, gaps: '~ ~ 0 0,~ ~ 1 0,~ ~ 0 4' },
])('preserves every intentional global/per-link middle cut: %j', (patch) => {
  const style = normalizeStyle(patch);
  const { shape, result, applied } = solve(style);
  const fitted = shapeOfStyle(applied, links.length);
  for (let i = 0; i < links.length; i++)
    for (let k = 2; k < 4; k++) {
      const key = k === 2 ? 'middleGapStart' : 'middleGapEnd';
      expect(fitted.linkGaps[i][k] ?? fitted[key]).toBe(shape.linkGaps[i][k] ?? shape[key]);
    }
  expect(result.after).toBeLessThanOrEqual(result.before);
});

it('retains explicit automatic middle-cut opt-in and shares it without changing its meaning', () => {
  const style = styleFromParams(new URLSearchParams('solve=true&solveMiddleRange=4'));
  const { result, applied } = solve(style);
  expect(result.linkGaps.some((row) => row[2] > 0 || row[3] > 0)).toBe(true);
  expect(result.after).toBeLessThan(result.before);
  expect(styleToParams(style).get('solveMiddleRange')).toBe('4');
  expect(styleFromParams(styleToParams(style))).toEqual(style);
  expect(styleFromParams(styleToParams(applied)).gaps).toBe(applied.gaps);
});
