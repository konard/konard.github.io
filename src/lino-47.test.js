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
