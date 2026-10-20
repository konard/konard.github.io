import codes from './configurations.json';
import { canonical, configurations, decode, isConnected, relabel } from './configurations';
import { glyphId, glyphPaths, glyphSymbol, SIZE } from './glyph';

describe('link configurations (issue #7)', () => {
  test('there are 1, 10, 129 and 2836 configurations of 1–4 links (OEIS A054050)', () => {
    expect([1, 2, 3, 4].map((n) => codes[n].length)).toEqual([1, 10, 129, 2836]);
  });

  test('committed configurations.json matches the enumeration', () => {
    [1, 2, 3, 4].forEach((n) => expect(codes[n]).toEqual(configurations(n)));
  });

  test('codes are canonical under relabeling', () => {
    expect(
      canonical([
        [1, 1],
        [1, 1],
      ]),
    ).toBe('00 00');
    expect(
      canonical([
        [1, 1],
        [0, 0],
      ]),
    ).toBe('11 00');
    expect(canonical(relabel(decode('01 12 20'), [2, 0, 1]))).toBe(canonical(decode('01 12 20')));
    codes[3].forEach((code) => expect(canonical(decode(code))).toBe(code));
  });

  test('connected configurations are 1, 9 and 119 for 1–3 links', () => {
    expect([1, 2, 3].map((n) => codes[n].filter((c) => isConnected(decode(c))).length)).toEqual([1, 9, 119]);
  });
});

describe('link glyphs', () => {
  const all = [1, 2, 3, 4].flatMap((n) => codes[n]);

  test('every glyph stays inside the shared view box', () => {
    // One assertion for all ~300k coordinates: an expect() per number is slow.
    const outside = all.filter((code) =>
      glyphPaths(decode(code))
        .stroke.match(/-?\d+(\.\d+)?/g)
        .map(Number)
        .some((v) => v < 0 || v > SIZE),
    );
    expect(outside).toEqual([]);
  });

  test('every configuration gets a distinct drawing and id', () => {
    expect(new Set(all.map((code) => glyphPaths(decode(code)).stroke)).size).toBe(all.length);
    expect(new Set(all.map(glyphId)).size).toBe(all.length);
  });

  test('symbols are same-size SVG with one arrow per link', () => {
    const svg = glyphSymbol(decode('01 10'), glyphId('01 10'));
    expect(svg).toMatch(/^<symbol id="links-2-01-10" viewBox="0 0 100 100">/);
    expect(svg.match(/<circle/g)).toHaveLength(2);
    expect(() => glyphPaths([])).toThrow(RangeError);
  });
});
