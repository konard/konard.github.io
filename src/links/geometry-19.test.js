import { describe, expect, it } from 'vitest';
import { decode } from './configurations';
import { glyphParts, layoutCurves } from './glyph';

const changes = (links, key, a, b) => {
  const base = { angles: 'fixed', [key]: a };
  expect(layoutCurves(links, { ...base, [key]: b }), `${key} on ${JSON.stringify(links)}`).not.toEqual(
    layoutCurves(links, base),
  );
};
describe('self references obey geometry controls (issue #19)', () => {
  for (const code of ['11', '10', '01', '11 22', '11 22 12', '00 02 30 44']) {
    it(`applies fixed angles and curvature to ${code}`, () => {
      const links = decode(code);
      if (links.some(([s]) => s !== 0)) changes(links, 'sourceAngle', 20, 55);
      if (links.some(([, t]) => t !== 0)) changes(links, 'targetAngle', 20, 55);
      changes(links, 'tension', 0.2, 0.6);
      changes(links, 'bulge', 20, 45);
    });
  }
  it('sets source/target gaps independently, including self loops', () => {
    const [curve] = layoutCurves([[1, 1]], { startGap: 0.1, endGap: 0.2 });
    expect(Math.hypot(...curve.start.at)).toBeCloseTo(0.1);
    expect(Math.hypot(...curve.end.at)).toBeCloseTo(0.2);
  });
  it('moves every marker independently of its curve and allows an open ring in the middle', () => {
    const links = [[1, 1]];
    const base = glyphParts(links, { middle: 'circle' })[0];
    for (const key of [
      'startOffset',
      'endOffset',
      'middleOffset',
      'startAcross',
      'endAcross',
      'middleAcross',
      'startRotation',
      'endRotation',
      'middleRotation',
      'middleAngle',
    ]) {
      const options = { middle: key === 'middleAngle' || key === 'middleRotation' ? 'arrow' : 'circle' };
      const initial = glyphParts(links, options)[0];
      const next = glyphParts(links, { ...options, [key]: 10 })[0];
      expect(layoutCurves(links, { ...options, [key]: 10 }), key).toEqual(layoutCurves(links, options));
      const part = key.startsWith('start') ? 'start' : key.startsWith('end') ? 'end' : 'middle';
      if (!key.endsWith('Rotation') || part !== 'middle') expect(next[part].d, key).not.toBe(initial[part].d);
    }
    const cut = glyphParts(links, { middle: 'circle', middleGapStart: 0.08, middleGapEnd: 0.12 })[0];
    expect(cut.line).not.toBe(base.line);
    expect(cut.line.match(/M/g)).toHaveLength(2);
  });
});
