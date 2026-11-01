// Issue #47: "in all places instead of json (for example for configuration of
// UI/UX) we should use indented/nested links notation".
import { formatIndented, parseIndented } from 'lino-objects-codec';
import { describe, expect, it } from 'vitest';
import { isObject, readNotation, toIndented, toNested } from './lino';
import { readStored, writeStored } from './settings/notation';
import { randomLook } from './settings/presets';
import { DEFAULTS } from './settings/schema';
import { settingsText } from './settings/store';

describe('Links Notation instead of JSON (issue #47)', () => {
  it('writes flat settings indented and nested data nested, and reads both back with their types', () => {
    const settings = { 'skin.name': 'liquid', 'grid.size': 96, 'rain.on': false, 'avatar.text': '45' };
    const indented = toIndented('settings', settings);
    expect(indented).toBe("settings:\n  skin.name liquid\n  grid.size 96\n  rain.on false\n  avatar.text '45'");
    expect(readNotation(indented)).toEqual({ id: 'settings', value: settings, format: 'indented' });

    const list = [
      { name: 'Calm "night"', look: settings },
      { name: "it's", look: {} },
    ];
    const nested = toNested(list);
    expect(nested.startsWith('(')).toBe(true);
    expect(readNotation(nested)).toEqual({ id: null, value: list, format: 'nested' });
  });

  it('still reads JSON saved or copied before and refuses nothing', () => {
    expect(readNotation(' {"a": 1} ')).toEqual({ id: null, value: { a: 1 }, format: 'json' });
    expect(readNotation('[1]').value).toEqual([1]);
    expect(() => readNotation('')).toThrow();
    expect(() => readNotation('  ')).toThrow();
    expect(() => readNotation(null)).toThrow();
    expect(() => readNotation('{broken')).toThrow();
    expect([isObject({}), isObject([]), isObject(null), isObject('x')]).toEqual([true, false, false, false]);
  });

  it('parses in a browser, where there is no process (lino-objects-codec#79)', () => {
    const real = globalThis.process;
    globalThis.process = undefined;
    try {
      expect(readNotation('settings:\n  a 1').value).toEqual({ a: 1 });
      expect(readNotation('(\n  a 1\n)').value).toEqual({ a: 1 });
    } finally {
      globalThis.process = real;
    }
  });

  it('reads and writes the stored settings of every page exactly as the codec does, without loading it', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const looks = [DEFAULTS, ...Array.from({ length: 30 }, () => randomLook(random))];
    const strings = {
      a: "it's",
      b: 'say "hi"',
      c: 'a:b',
      d: '(x)',
      e: 'true',
      f: '1e3',
      g: '',
      h: 'null',
      i: '#ff00aa',
    };
    const repeated = { a: 'liquid', b: 'liquid', c: 'settings', d: "it's \"x\" ''", e: 'a`b' };
    for (const look of [...looks, strings, repeated, { n: -3.5, m: 1e21, t: true, z: null }]) {
      // The small writer of every page writes what the codec writes…
      const text = settingsText(look);
      expect(text).toBe(formatIndented({ id: 'settings', obj: look }));
      expect(writeStored).toBe(settingsText);
      // …and the small reader reads it as the codec does.
      expect(readStored(text)).toEqual(parseIndented({ text }).obj);
      expect(readStored(text)).toEqual(look);
    }
    expect(readStored(null)).toEqual({});
    expect(readStored('{"a":1}')).toEqual({ a: 1 });
    expect(() => readStored('colors:\n  red 1')).toThrow();
    expect(() => readStored("settings:\n  a 'x\ny'")).toThrow();
  });
});

describe('the data of the site in Links Notation (issue #47)', () => {
  const fs = require('node:fs');
  const { readLino, toLino } = require('../scripts/lino-data.cjs');
  const FILES = ['github', 'habr', 'indicators', 'posts', 'repositories'];

  it('keeps no generated data as JSON in src/data', () => {
    expect(fs.readdirSync('src/data').filter((file) => file.endsWith('.json'))).toEqual([]);
    FILES.forEach((name) => expect(fs.existsSync(`src/data/${name}.lino`)).toBe(true));
  });

  it.each(FILES)('src/data/%s.lino is nested Links Notation exactly as the codec writes it', (name) => {
    const text = fs.readFileSync(`src/data/${name}.lino`, 'utf8');
    expect(text.startsWith('(')).toBe(true);
    expect(toLino(readLino(`src/data/${name}.lino`))).toBe(text);
  });

  it('imports a .lino file as the object it holds, with names as named exports', async () => {
    const { linoData } = await import('../vite.config.js');
    const notation = toNested({ sources: [1, 'two'], 'not-a-name': true, default: 3, items: { a: null } });
    const { code } = linoData().transform(notation, '/x/data.lino');
    const exports = {};
    new Function(
      'exports',
      code
        .replace(/^export default data;$/m, 'exports.default = data;')
        .replace(/^export const (\w+) = (.*);$/gm, 'exports.$1 = $2;'),
    )(exports);
    expect(exports.default).toEqual({ sources: [1, 'two'], 'not-a-name': true, default: 3, items: { a: null } });
    expect(Object.keys(exports).sort()).toEqual(['default', 'items', 'sources']);
    expect(linoData().transform('{}', '/x/data.json')).toBeNull();
  });

  it('gives the pages the same objects as the files hold', async () => {
    const github = (await import('./data/github.lino')).default;
    const { sources } = await import('./data/indicators.lino');
    expect(github).toEqual(readLino('src/data/github.lino'));
    expect(sources).toEqual(readLino('src/data/indicators.lino').sources);
  });
});
