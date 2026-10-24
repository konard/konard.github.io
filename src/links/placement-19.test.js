import { describe, expect, it } from 'vitest';
import { codeAt, decode, encode, indexOf, isReal, mathNotation, randomCode } from './configurations';
import {
  decimalOf,
  numberNotation,
  parseCode,
  parseIndex,
  parseLinks,
  parseMath,
  parseNumber,
  linksText,
  theoryNotation,
} from './edit';
import { glyphPaths, layout } from './glyph';
import { placeLinks } from './placement';
import {
  linkColors,
  normalizeStyle,
  shapeOfStyle,
  styleFromParams,
  styleToParams,
  withColor,
  withTurns,
  linkTurns,
} from './style';

const network = (n) => Array.from({ length: n }, (_, i) => [i + 1, ((i + 1) % n) + 1]);
describe('space filling placements (issue #19)', () => {
  for (const placement of ['auto', 'circle', 'square', 'hex', 'dice', 'cards', 'spiral', 'force']) {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 9, 10, 17, 40]) {
      it(`${placement} places ${n} distinct middles deterministically`, () => {
        const links = network(n);
        const options = shapeOfStyle(normalizeStyle({ placement }), n);
        const points = placeLinks(n, options, links);
        expect(points).toEqual(placeLinks(n, options, links));
        expect(points).toHaveLength(n);
        expect(new Set(points.map((p) => p.at.map((v) => v.toFixed(6)).join(','))).size).toBe(n);
        expect(points.flatMap((p) => [...p.at, ...p.out]).every(Number.isFinite)).toBe(true);
        expect(glyphPaths(links, options)).toHaveLength(n);
      });
    }
  }
  it('keeps circle automatic for 1–4 and fills the plane after four', () => {
    for (let n = 1; n <= 4; n++) expect(layout(n, { placement: 'auto' })).toEqual(layout(n));
    expect(layout(7, { placement: 'auto' })).toEqual(layout(7, { placement: 'hex' }));
    for (const n of [100, 1000]) expect(placeLinks(n, { placement: 'hex' })).toHaveLength(n);
  });
  it('uses actual references as springs and reserves more space for self loops', () => {
    const options = { placement: 'force' };
    const a = placeLinks(5, options, network(5));
    const b = placeLinks(
      5,
      options,
      Array.from({ length: 5 }, () => [0, 0]),
    );
    expect(a).not.toEqual(b);
    expect(placeLinks(5, { ...options, forceDistance: 2 }, network(5))).not.toEqual(a);
  });
  it('round trips more than nine links through every notation and exact decimal index', () => {
    for (const n of [10, 37, 100]) {
      const links = network(n);
      const code = encode(links);
      expect(parseCode(code)).toBe(code);
      expect(decode(code)).toEqual(links);
      expect(parseNumber(numberNotation(links)).links).toEqual(links);
      expect(parseIndex(decimalOf(links), n).links).toEqual(links);
      expect(parseLinks(linksText(links)).links).toEqual(links);
      expect(parseMath(theoryNotation(links)).links).toEqual(links);
      expect(parseMath(mathNotation(code)).links).toEqual(links);
      expect(linkColors(normalizeStyle(), n).every((c) => /^#[0-9a-f]{6}$/.test(c))).toBe(true);
      const colors = withColor(normalizeStyle(), n, n - 1, '#abcdef');
      expect(linkColors(colors, n)[n - 1]).toBe('#abcdef');
      const turns = withTurns(
        colors,
        links.map(() => [10, -10]),
      );
      expect(linkTurns(turns, n)[n - 1]).toEqual([10, -10]);
      expect(styleFromParams(styleToParams(turns))).toEqual(turns);
    }
  });
  it('keeps shared configuration helpers valid for multi-digit references', () => {
    for (const n of [10, 37, 100]) {
      const links = network(n);
      const code = encode(links);
      expect(isReal(code)).toBe(true);
      expect(indexOf(code)).toBe(BigInt(decimalOf(links)));
      expect(codeAt(n, BigInt(decimalOf(links)))).toBe(code);
      const random = decode(randomCode(() => 0.999, n));
      expect(random).toHaveLength(n);
      expect(random.every((pair) => pair.length === 2 && pair.every((ref) => ref === n))).toBe(true);
    }
  });
});
