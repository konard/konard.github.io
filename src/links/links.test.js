import {
  baseOf,
  canonical,
  classCount,
  codeAt,
  decode,
  indexOf,
  isReal,
  linksNotation,
  mathNotation,
  networkCount,
  randomCode,
  relabel,
  representatives,
} from './configurations';
import { bezier, COLORS, glyphCurves, glyphPaths, glyphSvg, SIZE } from './glyph';

const all = (n) => Array.from({ length: networkCount(n) }, (_, i) => codeAt(n, i));
const near = (a, b, eps = 1e-6) => Math.hypot(a[0] - b[0], a[1] - b[1]) < eps;

describe('networks with the zero link (issue #9)', () => {
  test('N real links are written in base N + 1, so there are (N + 1)^(2N) networks', () => {
    expect([1, 2, 3, 4].map(baseOf)).toEqual([2, 3, 4, 5]);
    expect([1, 2, 3, 4].map(networkCount)).toEqual([4, 81, 4096, 390625]);
  });

  test('one real link has exactly the four networks of the issue: 00, 10, 01, 11', () => {
    expect(all(1)).toEqual(['00', '01', '10', '11']);
    expect(linksNotation('00')).toEqual(['(1: 0 0)']);
    expect(linksNotation('10')).toEqual(['(1: 1 0)']);
    expect(mathNotation('10')).toBe('10₂');
    expect(mathNotation('11')).toBe('11₂');
  });

  test('two links run from 00₃ 00₃ to 22₃ 22₃, three from 00₄ 00₄ 00₄ to 33₄ 33₄ 33₄', () => {
    expect([codeAt(2, 0), codeAt(2, 80)].map(mathNotation)).toEqual(['00₃ 00₃', '22₃ 22₃']);
    expect([codeAt(3, 0), codeAt(3, 4095)].map(mathNotation)).toEqual(['00₄ 00₄ 00₄', '33₄ 33₄ 33₄']);
    expect(mathNotation(codeAt(4, 390624))).toBe('44₅ 44₅ 44₅ 44₅');
    expect(linksNotation('01 20')).toEqual(['(1: 0 1)', '(2: 2 0)']);
  });

  test('codes and positions are inverse to each other and every code is distinct', () => {
    [1, 2, 3].forEach((n) => {
      const codes = all(n);
      expect(new Set(codes).size).toBe(codes.length);
      codes.forEach((code, i) => expect(indexOf(code)).toBe(i));
    });
  });

  test('renaming keeps 0 fixed and the classes match Burnside counting', () => {
    expect(
      relabel(
        [
          [0, 2],
          [1, 0],
        ],
        [1, 0],
      ),
    ).toEqual([
      [2, 0],
      [0, 1],
    ]);
    expect(canonical(decode('11 02'))).toBe('01 22');
    expect([1, 2, 3, 4].map(classCount)).toEqual([4, 45, 720, 16900]);
    expect([1, 2, 3].map((n) => representatives(n).length)).toEqual([4, 45, 720]);
  });

  test('random networks are valid codes of 1–4 links', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 200; k++) {
      const code = randomCode(random);
      const n = code.split(' ').length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(4);
      expect(codeAt(n, indexOf(code))).toBe(code);
    }
  });
});

describe('networks with only real references (issue #13)', () => {
  const real = { real: true };

  test('exclude every network that refers to 0, keeping links that refer to each other or themselves', () => {
    expect([1, 2, 3, 4].map((n) => networkCount(n, real))).toEqual([1, 16, 729, 65536]);
    for (const n of [1, 2, 3]) {
      const codes = Array.from({ length: networkCount(n, real) }, (_, i) => codeAt(n, i, real));
      expect(codes).toEqual(all(n).filter(isReal));
      codes.forEach((code, i) => expect(indexOf(code, real)).toBe(i));
    }
    expect(codeAt(1, 0, real)).toBe('11');
    expect(codeAt(2, 0, real)).toBe('11 11');
    expect(codeAt(2, 15, real)).toBe('22 22');
    expect(codeAt(4, 65535, real)).toBe('44 44 44 44');
  });

  test('count their renaming classes with Burnside’s lemma', () => {
    expect([1, 2, 3, 4].map((n) => classCount(n, real))).toEqual([1, 10, 129, 2836]);
    for (const n of [1, 2, 3, 4]) {
      expect(representatives(n, real)).toHaveLength(classCount(n, real));
      expect(representatives(n, real).every(isReal)).toBe(true);
    }
    // Brute force: the distinct canonical codes of all real networks of 3 links.
    const classes = new Set(
      all(3)
        .filter(isReal)
        .map((code) => canonical(decode(code))),
    );
    expect(classes.size).toBe(129);
  });

  test('random networks with only real references never refer to 0', () => {
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 200; k++) expect(isReal(randomCode(random, undefined, real))).toBe(true);
  });

  test('the default still includes references to 0', () => {
    expect(networkCount(2)).toBe(81);
    expect(codeAt(2, 0)).toBe('00 00');
    expect(classCount(2)).toBe(45);
  });
});

describe('network symbols (issue #9 link visuals)', () => {
  const sample = [...all(1), ...all(2), ...all(3), ...representatives(4).filter((_, i) => i % 7 === 0)];

  test('every network is drawable and stays inside the box', () => {
    const outside = [];
    sample.forEach((code) => {
      glyphCurves(decode(code)).forEach(({ segments }) =>
        segments.forEach((seg) => {
          for (let k = 0; k <= 32; k++) {
            const [x, y] = bezier(seg, k / 32);
            if (!(x >= 0 && x <= SIZE && y >= 0 && y <= SIZE)) outside.push(code);
          }
        }),
      );
    });
    expect(outside).toEqual([]);
  });

  test('every link is one unbroken line with matching tangents in its middle, in its own colour', () => {
    sample.forEach((code) => {
      const curves = glyphCurves(decode(code));
      curves.forEach(({ segments: [first, second] }) => {
        // The two halves meet in the middle of the link…
        expect(near(first[3], second[0])).toBe(true);
        // …and continue in the same direction, so there is no corner or gap.
        const inDir = [first[3][0] - first[2][0], first[3][1] - first[2][1]];
        const outDir = [second[1][0] - second[0][0], second[1][1] - second[0][1]];
        const cross = inDir[0] * outDir[1] - inDir[1] * outDir[0];
        expect(Math.abs(cross) / Math.hypot(...inDir) / Math.hypot(...outDir)).toBeLessThan(1e-9);
        expect(inDir[0] * outDir[0] + inDir[1] * outDir[1]).toBeGreaterThan(0);
      });
      const paths = glyphPaths(decode(code));
      paths.forEach(({ d }) => expect(d.match(/M/g).length).toBe(3)); // line, bar, arrow
      expect(paths.map((p) => p.color)).toEqual(COLORS.slice(0, paths.length));
    });
  });

  test('ends touch the middles they refer to, references to 0 stay free', () => {
    sample.forEach((code) => {
      const links = decode(code);
      const curves = glyphCurves(links);
      const middles = curves.map((c) => c.segments[1][0]);
      const span = SIZE;
      links.forEach(([s, t], i) => {
        const ends = [
          [s, curves[i].start.at],
          [t, curves[i].end.at],
        ];
        ends.forEach(([ref, at]) => {
          const distances = middles.map((m) => Math.hypot(at[0] - m[0], at[1] - m[1]));
          if (ref === 0) expect(Math.min(...distances)).toBeGreaterThan(span * 0.08);
          else expect(distances[ref - 1]).toBeLessThan(span * 0.06);
        });
      });
    });
  });

  test('(1: 1 1) is a point-symmetric figure eight around its middle', () => {
    const [{ segments }] = glyphCurves(decode('11'));
    const middle = segments[0][3];
    const mirror = ([x, y]) => [2 * middle[0] - x, 2 * middle[1] - y];
    const [first, second] = segments;
    [...first].reverse().forEach((p, k) => expect(near(mirror(p), second[k], 1e-6)).toBe(true));
  });

  test('a double self-reference inside a network stays symmetric too', () => {
    ['11 01', '00 22 10', '00 01 33 30'].forEach((code) => {
      const links = decode(code);
      const i = links.findIndex(([s, t], k) => s === k + 1 && t === k + 1);
      const { segments } = glyphCurves(links)[i];
      const middle = segments[0][3];
      const mirror = ([x, y]) => [2 * middle[0] - x, 2 * middle[1] - y];
      [...segments[0]].reverse().forEach((p, k) => expect(near(mirror(p), segments[1][k], 1e-6)).toBe(true));
    });
  });

  test('different networks of the same size are drawn differently', () => {
    [1, 2, 3].forEach((n) => {
      const drawings = all(n).map((code) => glyphSvg(decode(code)));
      expect(new Set(drawings).size).toBe(drawings.length);
    });
  });

  test('only 1–4 links fit into a symbol', () => {
    expect(() => glyphPaths([])).toThrow(RangeError);
    expect(() => glyphPaths(decode('00 00 00 00 00'))).toThrow(RangeError);
  });
});
