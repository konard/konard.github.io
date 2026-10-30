// Presets (issue #15: "ability also to have multiple presets, saved and so on").
import { describe, expect, it } from 'vitest';
import {
  COMFORT,
  PRESETS,
  SAVED_KEY,
  applyLook,
  cleanLook,
  getSaved,
  isLook,
  loadSaved,
  lookOfHash,
  randomLook,
  renamed,
  setSaved,
  shareLink,
  withImported,
  withSaved,
  withoutSaved,
} from './presets';
import { DEFAULTS, FIELDS } from './schema';
import { getSettings, openSharedLook, setSettings } from './store';

const comfort = {
  'motion.mode': 'off',
  'sound.on': true,
  'sound.volume': 0.4,
  'theory.notation': 'R',
  'ui.transparency': 'reduce',
};

/** A repeatable random sequence (mulberry32). */
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe('built-in presets', () => {
  it('have unique ids and names in both languages, and the first is the defaults', () => {
    expect(new Set(PRESETS.map((preset) => preset.id)).size).toBe(PRESETS.length);
    for (const preset of PRESETS) {
      expect(preset.name.en && preset.name.ru && preset.text.en && preset.text.ru).toBeTruthy();
    }
    expect(PRESETS[0]).toMatchObject({ id: 'default', look: {} });
    expect(PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it('use only known settings with valid values that differ from the defaults, and no comfort settings', () => {
    for (const preset of PRESETS) {
      // cleanLook drops unknown keys, fixes invalid values and drops defaults: a typo would show here.
      expect(cleanLook(preset.look), preset.id).toEqual(preset.look);
    }
  });

  it('are different looks', () => {
    const looks = PRESETS.map((preset) => JSON.stringify(applyLook(preset.look, DEFAULTS)));
    expect(new Set(looks).size).toBe(PRESETS.length);
  });

  it('"Light and fast" switches the canvas layers off', () => {
    const fast = applyLook(PRESETS.find((preset) => preset.id === 'fast').look, DEFAULTS);
    expect(fast['nebula.on']).toBe(false);
    expect(fast['rain.on']).toBe(false);
    expect([1, 2, 3, 4].some((n) => fast[`stars${n}.on`])).toBe(false);
    expect(fast['glass.blur']).toBe(0);
  });
});

describe('applying a look', () => {
  it('puts the look on the defaults and keeps the comfort settings', () => {
    const current = { ...DEFAULTS, ...comfort, 'rain.step': 300, 'grid.size': 96 };
    const next = applyLook({ 'skin.name': 'liquid', 'motion.mode': 'on', 'sound.on': false }, current);
    expect(next).toEqual({ ...DEFAULTS, ...comfort, 'skin.name': 'liquid' });
    expect(COMFORT).toEqual(['motion.mode', 'sound.on', 'sound.volume', 'theory.notation', 'ui.transparency']);
  });

  it('tells whether the current settings are a look, whatever the comfort settings', () => {
    const current = { ...DEFAULTS, ...comfort, 'skin.name': 'liquid' };
    expect(isLook({ 'skin.name': 'liquid' }, current)).toBe(true);
    expect(isLook({}, current)).toBe(false);
    expect(isLook({}, { ...DEFAULTS, ...comfort })).toBe(true);
  });

  it('cleans what it is given', () => {
    expect(cleanLook(null)).toEqual({});
    expect(cleanLook([1])).toEqual({});
    expect(
      cleanLook({ 'nope.key': 1, 'grid.size': 9999, 'rain.on': 'yes', 'sound.on': true, 'skin.name': 'glass' }),
    ).toEqual({ 'grid.size': 128 });
  });
});

describe('a random look', () => {
  const fields = Object.fromEntries(FIELDS.map((field) => [field.key, field]));

  it('is valid, leaves the sounds and the comfort settings alone and is never heavier than the defaults', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const look = randomLook(seeded(seed));
      expect(cleanLook(look)).toEqual(look);
      for (const [key, value] of Object.entries(look)) {
        expect(key.startsWith('sound.') || COMFORT.includes(key)).toBe(false);
        const field = fields[key];
        if (field.type === 'range') {
          expect(value).toBeGreaterThanOrEqual(field.min);
          expect(value).toBeLessThanOrEqual(field.max);
        }
        if (typeof value === 'number' && /count|fps|resolution|density|refraction|blur|shadow|glow|noise/i.test(key))
          expect(value, key).toBeLessThanOrEqual(DEFAULTS[key]);
      }
      expect(look['liquid.refraction']).toBeUndefined();
    }
  });

  it('differs from one press to the next', () => {
    const random = seeded(7);
    expect(randomLook(random)).not.toEqual(randomLook(random));
  });
});

describe('a link that carries a look', () => {
  it('holds the look without the comfort settings and reads back', () => {
    const settings = { ...DEFAULTS, ...comfort, 'skin.name': 'futuristic', 'future.palette': 'ares' };
    const link = shareLink(settings, 'https://konard.github.io/settings/#rain');
    expect(link.startsWith('https://konard.github.io/settings/#settings=')).toBe(true);
    expect(lookOfHash(new URL(link).hash)).toEqual({ 'skin.name': 'futuristic', 'future.palette': 'ares' });
  });

  it('ignores other hashes and broken links', () => {
    expect(lookOfHash('#rain')).toBeNull();
    expect(lookOfHash('')).toBeNull();
    expect(lookOfHash('#settings=%7Bnot json')).toBeNull();
    expect(lookOfHash('#settings=%5B1%5D')).toBeNull();
  });

  it('is applied when a page opens with it, keeps the look it replaced and leaves the address clean', async () => {
    setSettings({ ...comfort, 'rain.step': 300 });
    const look = { 'skin.name': 'liquid', 'grid.on': false };
    window.history.replaceState(
      null,
      '',
      `/settings/${new URL(shareLink({ ...DEFAULTS, ...look }, 'http://x/')).hash}`,
    );
    expect(await openSharedLook()).toBe(true);
    expect(getSettings()).toEqual({ ...DEFAULTS, ...comfort, ...look });
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/settings/');
    expect(getSaved()).toEqual([{ name: 'Before the link', look: { 'rain.step': 300 } }]);
    expect(await openSharedLook()).toBe(false);
  });
});

describe('looks saved in this browser', () => {
  it('are added, replaced by name, renamed and deleted', () => {
    let list = withSaved([], ' Mine ', { 'grid.size': 96, 'sound.on': true });
    expect(list).toEqual([{ name: 'Mine', look: { 'grid.size': 96 } }]);
    expect(withSaved(list, '  ', {})).toBe(list);
    list = withSaved(list, 'Other', { 'rain.on': false });
    list = withSaved(list, 'Mine', { 'grid.size': 64 });
    expect(list.map((item) => item.name)).toEqual(['Mine', 'Other']);
    expect(list[0].look).toEqual({ 'grid.size': 64 });
    expect(renamed(list, 'Mine', 'Night').map((item) => item.name)).toEqual(['Night', 'Other']);
    // Renaming onto another name replaces that look.
    expect(renamed(list, 'Mine', 'Other')).toEqual([{ name: 'Other', look: { 'grid.size': 64 } }]);
    expect(renamed(list, 'Mine', ' ')).toBe(list);
    expect(withoutSaved(list, 'Mine').map((item) => item.name)).toEqual(['Other']);
  });

  it('are imported from JSON copied in another browser', () => {
    const list = withImported(
      [{ name: 'A', look: {} }],
      [{ name: 'A', look: { 'grid.size': 96 } }, { name: 'B', look: { nope: 1 } }, { look: {} }, null],
    );
    expect(list).toEqual([
      { name: 'A', look: { 'grid.size': 96 } },
      { name: 'B', look: {} },
    ]);
    expect(withImported(list, 'nope')).toBe(list);
  });

  it('are remembered in localStorage and read back checked', () => {
    expect(setSaved([{ name: 'Mine', look: { 'grid.size': 96 } }])).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(SAVED_KEY))).toEqual([{ name: 'Mine', look: { 'grid.size': 96 } }]);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([{ name: 'X', look: { 'grid.size': -5 } }, { name: '' }, 3]));
    expect(loadSaved()).toEqual([{ name: 'X', look: { 'grid.size': 32 } }]);
    window.localStorage.setItem(SAVED_KEY, '{broken');
    expect(loadSaved()).toEqual([]);
    setSaved([]);
    expect(window.localStorage.getItem(SAVED_KEY)).toBeNull();
  });

  it('follow other tabs', () => {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify([{ name: 'From another tab', look: {} }]));
    window.dispatchEvent(new StorageEvent('storage', { key: SAVED_KEY }));
    expect(getSaved()).toEqual([{ name: 'From another tab', look: {} }]);
  });
});
