// Issue #45: a setting of the custom frame changes an attribute or a variable
// of <html>, and every element of the page then computes its style again. The
// WebKit job of CI ran out of its 15 minutes because a restyle of the settings
// page took several times longer than on main: every chosen shape and line had
// a rule `:root[attribute] :where(<44 framed selectors>)`, which a browser
// tries on every element (a list in one `:where()` cannot be filed under a
// class or a tag) and, when the attribute is not set, checks every ancestor up
// to the root. These tests failed before the change.
import { describe, expect, it } from 'vitest';
import {
  BLOCKS,
  CONTROLS,
  CORNERS,
  cornersCss,
  cornerSteps,
  framesCss,
  INNER,
  LINES,
  PANELS,
  POINTS,
  SHAPES,
} from './skins.frames';

const FRAMES = framesCss();
const NUMBERS = cornersCss();

/** Every rule of a stylesheet as [selectors, declarations]. */
const rules = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => [
    selector.trim(),
    Object.fromEntries(
      body
        .split(/;\s*\n/)
        .map((line) => line.trim().replace(/;$/, ''))
        .filter(Boolean)
        .map((line) => [line.slice(0, line.indexOf(':')).trim(), line.slice(line.indexOf(':') + 1).trim()]),
    ),
  ]);

/** The declarations of the root for a shape and a line at every corner. */
const rootValues = (shape, line) =>
  Object.assign(
    {},
    ...rules(NUMBERS)
      .filter(([selector]) =>
        CORNERS.some(
          (c) =>
            selector === `:root[data-corner-${c}-shape='${shape}']` ||
            selector === `:root[data-corner-${c}-line='${line}']`,
        ),
      )
      .map(([, declarations]) => declarations),
  );

/** The value of a CSS length expression in px, with the variables of `values`. */
const evaluate = (expression, values) => {
  let text = expression;
  for (let i = 0; i < 20 && text.includes('var('); i += 1)
    text = text.replace(/var\((--[\w-]+)(?:, ([^()]*|[^()]*\([^()]*\)))?\)/g, (_, name, fallback) => {
      const value = values[name] ?? fallback;
      if (value === undefined) throw new Error(`${name} is not set`);
      return `(${value})`;
    });
  const js = text.replace(/calc/g, '').replace(/(\d)px/g, '$1');
  if (!/^[\d\s.+\-*/()]+$/.test(js)) throw new Error(`cannot evaluate ${text}`);
  return Function(`return ${js}`)();
};

/** Splits `a b` (two lengths of a size or a position) at the space between top level parts. */
const pair = (text) => {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') depth -= 1;
    else if (text[i] === ' ' && depth === 0 && !/[+\-*/]/.test(text[i + 1]) && !/[+\-*/]/.test(text[i - 1]))
      return [text.slice(0, i), text.slice(i + 1)];
  }
  return [text];
};

/** The arguments of every `:is()` and `:where()`, split at their top level commas. */
const lists = (css) => {
  const found = [];
  for (const match of css.matchAll(/:(?:is|where)\(/g)) {
    const items = [];
    let depth = 1;
    let start = match.index + match[0].length;
    for (let i = start; depth > 0; i += 1) {
      if (css[i] === '(') depth += 1;
      else if (css[i] === ')') depth -= 1;
      if ((css[i] === ',' && depth === 1) || depth === 0) {
        items.push(css.slice(start, i).trim());
        start = i + 1;
      }
    }
    found.push(items);
  }
  return found;
};

/** The rule that turns the numbers of the root into lengths on every framed element. */
const frameRule = () => rules(FRAMES).find(([, declarations]) => declarations['--fx-tl-p'])[1];

describe('a setting of the frame restyles the page quickly (issue #45)', () => {
  it('declares the chosen shapes and lines on the root only', () => {
    const attributes = rules(FRAMES + NUMBERS).filter(([selector]) =>
      /data-corner-(tl|tr|br|bl)-(shape|line)/.test(selector),
    );
    expect(attributes).toHaveLength(CORNERS.length * (Object.keys(SHAPES).length + LINES.length));
    for (const [selector] of attributes)
      expect(selector).toMatch(/^:root\[data-corner-(tl|tr|br|bl)-(shape|line)='\w+'\]$/);
  });

  it('names one framed element in every selector, so a browser files it under its class or tag', () => {
    // Inner blocks are panels inside panels: that list stays (one rule for the scale, one for the line).
    const rest = (FRAMES + NUMBERS).replaceAll(INNER.replace(':is(', ':where('), '').replaceAll(INNER, '');
    const framed = [...PANELS, ...CONTROLS];
    const long = lists(rest).filter((items) => items.length > 1 && items.some((item) => framed.includes(item)));
    // Small items of lists are blocks: the rule of the line of inner blocks lists them too.
    expect(long.filter((items) => items.join(', ') !== BLOCKS.join(', '))).toEqual([]);
    for (const element of ['.card', '.repo', '.chip', 'textarea']) {
      expect(FRAMES).toContain(`:root[data-skin-name='futuristic'][data-future-frame='custom'] :where(${element}),`);
    }
  });

  it('turns the numbers of the root into the points of every shape at every corner', () => {
    const frame = frameRule();
    const [W, H, S] = [300, 200, 10];
    for (const shape of Object.keys(SHAPES)) {
      const values = {
        ...rootValues(shape, 'line'),
        ...Object.fromEntries(CORNERS.map((c) => [`--fx-${c}-s`, `${S}px`])),
      };
      for (const corner of CORNERS) {
        const points = frame[`--fx-${corner}-p`]
          .split(/, (?=calc)/)
          .map((point) =>
            pair(point).map((part, axis) => evaluate(part.replace('100%', String(axis ? H : W)), values)),
          );
        expect(points).toHaveLength(POINTS);
        const flip = (k, size, far) => Math.round((far ? size - k * S : k * S) * 1000) / 1000;
        const expected = cornerSteps(corner, shape).map(([x, y]) => [
          flip(x, W, corner === 'tr' || corner === 'br'),
          flip(y, H, corner === 'br' || corner === 'bl'),
        ]);
        expect([shape, corner, points.map((p) => p.map((n) => Math.round(n * 1000) / 1000))]).toEqual([
          shape,
          corner,
          expected,
        ]);
      }
    }
  });

  it('pads every corner to the same number of points by repeating the last one', () => {
    expect(POINTS).toBe(9);
    expect(cornerSteps('tl', 'cut')).toEqual([[0, 1], ...Array(8).fill([1, 0])]);
    expect(cornerSteps('tr', 'cut')).toEqual([[1, 0], ...Array(8).fill([0, 1])]);
    expect(cornerSteps('br', 'round')).toEqual(SHAPES.round.points);
    expect(cornerSteps('bl', 'notch')).toEqual([[1, 0], [1, 1], ...Array(7).fill([0, 1])]);
  });

  it('sizes and places the lines of every shape as before, in the scale of the element', () => {
    const frame = frameRule();
    const [S, Wd] = [10, 2];
    // [layer a size, layer a position, layer b size, layer b position] of the top left corner, in px.
    const before = {
      square: [
        [S, Wd],
        [0, 0],
        [Wd, S],
        [0, 0],
      ],
      cut: [
        [S, S],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      tall: [
        [S, 2 * S],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      wide: [
        [2 * S, S],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      round: [
        [S, S],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      scoop: [
        [S + Wd, S + Wd],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      notch: [
        [S, Wd],
        [0, S],
        [Wd, S],
        [S, 0],
      ],
    };
    for (const [shape, expected] of Object.entries(before)) {
      // A bright line draws the tick of a square corner.
      const values = { ...rootValues(shape, 'accent'), '--fx-tl-s': `${S}px`, '--fx-b': `${Wd}px` };
      // `left X top Y`: the offsets from the sides of the corner.
      const position = (text) => text.match(/^(?:left|right) (.+) (?:top|bottom) (.+)$/).slice(1);
      const actual = ['a-size', 'a-pos', 'b-size', 'b-pos'].map((name) => {
        const text = frame[`--fx-tl-${name}`];
        return (name.endsWith('pos') ? position(text) : pair(text)).map((part) => evaluate(part, values));
      });
      expect([shape, actual]).toEqual([shape, expected]);
      // The images do not depend on the corner size, so the root can hold them.
      expect(rootValues(shape, 'accent')['--fx-tl-a-img']).not.toContain('--fx-tl-s');
    }
  });
});
