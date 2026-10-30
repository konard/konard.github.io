import { describe, expect, it } from 'vitest';
import { decode } from './configurations';
import { overlapCost, pairCost, solveCollisions } from './collisions';
import {
  addLink,
  check,
  countOf,
  decimalOf,
  linksText,
  numberNotation,
  parseCode,
  parseIndex,
  parseLinks,
  parseMath,
  parseNumber,
  removeLink,
  setReference,
  theoryNotation,
} from './edit';
import { fileName, shareTargets } from './export';
import { glyphSvg } from './glyph';
import { captionOf, escapeXml, networkSvg } from './render';
import {
  LOOKS,
  STYLE_DEFAULTS,
  applyLook,
  linkColors,
  linkTurns,
  normalizeStyle,
  shapeOfStyle,
  styleFromParams,
  styleToParams,
  withColor,
  withTurns,
  withSpacing,
} from './style';

const links = decode('01 20');

describe('notations of the editor (issue #17)', () => {
  it('writes one network in every notation', () => {
    expect(theoryNotation(links)).toBe('λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}');
    expect(theoryNotation(links, 'R')).toBe('N² = {1 ↦ (0, 1), 2 ↦ (2, 0)}');
    expect(numberNotation(links)).toBe('0120₃');
    // 0·27 + 1·9 + 2·3 + 0 = 15.
    expect(decimalOf(links)).toBe('15');
    expect(linksText(links)).toBe('(1: 0 1) (2: 2 0)');
  });

  it('reads back what it writes, in every notation', () => {
    expect(parseMath(theoryNotation(links)).links).toEqual(links);
    expect(parseMath(theoryNotation(links, 'R')).links).toEqual(links);
    expect(parseMath('01₃ 20₃').links).toEqual(links);
    expect(parseMath('{(0, 1), (2, 0)}').links).toEqual(links);
    expect(parseMath('1 -> (0 1), 2 -> (2 0)').links).toEqual(links);
    expect(parseNumber('0120₃').links).toEqual(links);
    expect(parseNumber('0120_3').links).toEqual(links);
    expect(parseNumber('0120').links).toEqual(links);
    expect(parseIndex('15', 2).links).toEqual(links);
    expect(parseLinks('(1: 0 1) (2: 2 0)').links).toEqual(links);
    expect(parseLinks('(2: 2 0)\n(1: 0 1)').links).toEqual(links);
    expect(parseLinks('(0 1) (2 0)').links).toEqual(links);
    expect(parseCode('0120')).toBe('01 20');
    expect(parseCode('01-20')).toBe('01 20');
  });

  it('explains what is wrong in English and Russian', () => {
    expect(parseNumber('012').error.en).toMatch(/even/);
    expect(parseNumber('0120₄').error.en).toBe('A network of 2 links is written in base 3, not 4.');
    expect(parseNumber('0120₄').error.ru).toBe('Сеть из 2 связей записывается в системе с основанием 3, а не 4.');
    expect(parseNumber('0130').error.en).toBe('A link refers to 3, but there are only the links 0…2.');
    expect(parseIndex('81', 2).error.en).toBe('Write a whole number from 0 to 80.');
    expect(parseLinks('(1: 0 1) (0 2)').error.en).toBe('Name either every link or none.');
    expect(parseLinks('(1: 0 1) (1: 0 2)').error.en).toMatch(/each once/);
    expect(parseMath('hello').error).toBeTruthy();
    expect(check([]).error.en).toMatch(/at least one/);
    expect(check([[0]]).error).toBeTruthy();
    expect(check(Array.from({ length: 10 }, () => [0, 0])).links).toHaveLength(10);
    expect(parseCode('0130')).toBeNull();
    expect(parseCode('<script>')).toBeNull();
  });

  it('counts networks of up to 9 links exactly', () => {
    expect(countOf(2)).toBe(81n);
    expect(countOf(9)).toBe(10n ** 18n);
    const nine = Array.from({ length: 9 }, () => [9, 9]);
    expect(decimalOf(nine)).toBe(String(10n ** 18n - 1n));
    expect(parseIndex(String(10n ** 18n - 1n), 9).links).toEqual(nine);
  });

  it('rejects malformed notation instead of silently discarding part of the network', () => {
    ['(1: 0 1) (2: 2)', '(1: 0 1) trailing', '((1: 0 1))'].forEach((text) => {
      expect(parseLinks(text).error, text).toBeTruthy();
    });
    ['01₄ 20₄', '01₃ 20₄', '013 203', '01oops 20', 'λ = {1 ↦ (0, 1), 2 ↦ (2)}'].forEach((text) => {
      expect(parseMath(text).error, text).toBeTruthy();
    });
  });

  it('adds, removes and rewires links keeping the network consistent', () => {
    expect(addLink(links)).toEqual([...links, [0, 0]]);
    expect(addLink(Array.from({ length: 9 }, () => [0, 0]))).toHaveLength(10);
    // Removing link 1: references to it become 0, link 2 becomes link 1.
    expect(removeLink(links, 1)).toEqual([[1, 0]]);
    expect(removeLink(decode('11 22 12'), 2)).toEqual([
      [1, 1],
      [1, 0],
    ]);
    expect(removeLink([[1, 1]], 1)).toEqual([[1, 1]]);
    expect(setReference(links, 1, 1, 1)).toEqual([
      [0, 1],
      [2, 1],
    ]);
  });
});

describe('style of the picture (issue #17)', () => {
  it('checks every option, so a shared link cannot break the picture', () => {
    const style = normalizeStyle({
      strokeWidth: 999,
      bgColor: 'red;"/><script>',
      start: 'nonsense',
      card: 'false',
      captionText: 'x'.repeat(200),
      turns: '30 -400,abc',
      colors: '#FF0000,#00ff00',
    });
    expect(style.strokeWidth).toBe(10);
    expect(style.bgColor).toBe(STYLE_DEFAULTS.bgColor);
    expect(style.start).toBe(STYLE_DEFAULTS.start);
    expect(style.card).toBe(false);
    expect(style.captionText).toHaveLength(80);
    expect(style.turns).toBe('30 -180');
    expect(style.colors).toBe('#ff0000,#00ff00');
    expect(normalizeStyle({ colors: '#ff0000,blue' }).colors).toBe('');
  });

  it('keeps only the options that differ from the defaults in the address', () => {
    expect(styleToParams(STYLE_DEFAULTS).toString()).toBe('');
    const style = normalizeStyle({ card: false, bgColor: '#000000', end: 'dot', turns: '15 -30' });
    const params = styleToParams(style);
    expect(Object.fromEntries(params)).toEqual({ end: 'dot', turns: '15 -30' });
    expect(styleFromParams(new URLSearchParams(params.toString()))).toEqual(style);
    expect(styleFromParams(new URLSearchParams('strokeWidth=abc&unknown=1'))).toEqual(STYLE_DEFAULTS);
  });

  it('gives each link a colour and turns', () => {
    expect(linkColors(STYLE_DEFAULTS, 2)).toHaveLength(2);
    expect(linkColors(normalizeStyle({ palette: 'mono', monoColor: '#123456' }), 3)).toEqual([
      '#123456',
      '#123456',
      '#123456',
    ]);
    const own = withColor(STYLE_DEFAULTS, 2, 1, '#abcdef');
    expect(own.palette).toBe('custom');
    expect(linkColors(own, 2)).toEqual([linkColors(STYLE_DEFAULTS, 1)[0], '#abcdef']);
    const turned = withTurns(STYLE_DEFAULTS, [
      [10, 20],
      [0, -45],
    ]);
    expect(turned.turns).toBe('10 20,0 -45');
    expect(linkTurns(turned, 3)).toEqual([
      [10, 20],
      [0, -45],
      [0, 0],
    ]);
    expect(withTurns(STYLE_DEFAULTS, [[0, 0]]).turns).toBe('0 0');
    expect(
      shapeOfStyle(turned, 2, [
        [5, 5],
        [0, 0],
      ]).turns,
    ).toEqual([
      [15, 25],
      [0, -45],
    ]);
  });

  it('offers both a card and a plain black background, and keeps the hand-made turns', () => {
    expect(LOOKS.map((look) => look.id)).toEqual(expect.arrayContaining(['card', 'black', 'transparent']));
    const turned = normalizeStyle({ turns: '10 20', strokeWidth: 5 });
    const black = applyLook(turned, 'black');
    expect(black).toMatchObject({ card: false, background: 'solid', bgColor: '#000000', turns: '10 20' });
    expect(black.strokeWidth).toBe(STYLE_DEFAULTS.strokeWidth);
    expect(applyLook(turned, 'card').card).toBe(true);
    expect(applyLook(turned, 'social')).toMatchObject({ width: 1200, height: 630, caption: 'theory' });
  });
});

describe('picture of a network (issue #17)', () => {
  it('is a standalone SVG of the chosen size with the links of the gallery', () => {
    const svg = networkSvg(links, applyLook(STYLE_DEFAULTS, 'card'));
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('width="2048" height="2048"');
    expect(svg).toContain('aria-label="Links network 01₃ 20₃"');
    // The card preset preserves the gallery; the lines are the same curves as the symbols.
    expect(svg).toContain(STYLE_DEFAULTS.cardColor);
    const symbol = glyphSvg(links);
    const line = symbol.match(/ d="(M[^M"]+)/)[1];
    expect(svg).toContain(line);
  });

  it('draws a transparent background, no card and a wide image on request', () => {
    const svg = networkSvg(links, { background: 'transparent', card: false, width: 1200, height: 630 });
    expect(svg).toContain('viewBox="0 0 190.48 100"');
    expect(svg).not.toContain(STYLE_DEFAULTS.bgColor);
    expect(svg).not.toContain(STYLE_DEFAULTS.cardColor);
    expect(networkSvg(links, { background: 'linear' })).toContain('<linearGradient');
    expect(networkSvg(links, { background: 'radial' })).toContain('<radialGradient');
    expect(networkSvg(links, { card: true, borderStyle: 'dashed' })).toContain('stroke-dasharray');
    expect(networkSvg(links, { glow: 2 })).toContain('feGaussianBlur');
  });

  it('escapes the caption, so a shared link cannot put markup into the picture', () => {
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;');
    const svg = networkSvg(links, { caption: 'custom', captionText: '<script>alert(1)</script>' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(captionOf(links, normalizeStyle({ caption: 'number' }))).toBe('0120₃ = 15');
    expect(captionOf(links, normalizeStyle({ caption: 'pairs' }))).toBe('01₃ 20₃');
    expect(captionOf(links, normalizeStyle({ caption: 'theory' }), 'R')).toBe('N² = {1 ↦ (0, 1), 2 ↦ (2, 0)}');
  });
});

describe('fewer overlaps of lines (experimental, issue #17)', () => {
  it('counts the same crossings regardless of link ordering', () => {
    const a = [
      [0, 0],
      [1, 0],
    ];
    const b = [
      [0.5, -1],
      [0.5, 1],
    ];
    expect(pairCost(a, b, [[0, 0]])).toBe(pairCost(b, a, [[0, 0]]));
  });
  it('turns the ends of the links so that their lines cross and touch less', () => {
    const tangled = decode('22 13 31');
    const result = solveCollisions(tangled, shapeOfStyle(STYLE_DEFAULTS, 3));
    expect(result.before).toBe(overlapCost(tangled, shapeOfStyle(STYLE_DEFAULTS, 3)));
    expect(result.after).toBeLessThan(result.before);
    expect(result.turns).toHaveLength(3);
    expect(result.delta).toHaveLength(3);
    // The turns found draw the same improved picture.
    const turned = shapeOfStyle(withSpacing(STYLE_DEFAULTS, result), 3);
    expect(overlapCost(tangled, turned)).toBeCloseTo(result.after, 6);
  });

  it('never makes a picture worse', () => {
    ['11', '01 20', '11 22 12', '12 21'].forEach((code) => {
      const result = solveCollisions(decode(code), shapeOfStyle(STYLE_DEFAULTS, code.split(' ').length));
      expect(result.after).toBeLessThanOrEqual(result.before);
    });
  });

  it('keeps solved turns editable and preserves the preview when they are applied', () => {
    for (const code of ['22 13 31', '23 31 12', '12 21']) {
      const network = decode(code);
      const style = normalizeStyle({ turns: '180 180,-180 180,170 -170' });
      const result = solveCollisions(network, shapeOfStyle(style, network.length));
      expect(result.after, code).toBeLessThanOrEqual(result.before);
      expect(
        result.turns.flat().every((angle) => Math.abs(angle) <= 180),
        code,
      ).toBe(true);
      const applied = shapeOfStyle(withSpacing(style, result), network.length);
      expect(overlapCost(network, applied), code).toBeCloseTo(result.after, 6);
    }
  });
});

describe('saving and sharing (issue #17)', () => {
  it('names the files by the network and links to the share dialogs', () => {
    expect(fileName('01 20', 'png')).toBe('links-network-01-20.png');
    const targets = shareTargets('https://konard.github.io/network/?code=0120', 'Links network 01₃ 20₃');
    expect(targets.map((target) => target.id)).toEqual(expect.arrayContaining(['x', 'telegram', 'vk', 'facebook']));
    targets
      .filter((target) => target.id !== 'email')
      .forEach((target) => {
        expect(target.href).toMatch(/^https:\/\//);
      });
    expect(targets.find((target) => target.id === 'telegram').href).toContain(
      encodeURIComponent('https://konard.github.io/network/?code=0120'),
    );
  });
});
