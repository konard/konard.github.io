import { describe, expect, it } from 'vitest';
import { SETTINGS_SCRIPT } from '../../vite.config';
import { applySettings, normalize } from './apply';
import { DEFAULTS, FIELDS, RULES, SECTIONS } from './schema';
import { changesOf, getSettings, loadSettings, resetSettings, setSettings, STORAGE_KEY } from './store';

const root = document.documentElement;

/** The changes the author of issue #15 copied from the settings page; they became the defaults. */
const ISSUE_15 = {
  'nebula.level': 0.5,
  'nebula.speed': 0.5,
  'nebula.gas': 0.35,
  'nebula.hue': 25,
  'nebula.stars': 1.2,
  'nebula.starBrightness': 0.8,
  'nebula.twinkle': 0.3,
  'nebula.vignette': 0.3,
  'grid.size': 48,
  'grid.period': 109,
  'rain.level': 0.75,
  'rain.step': 105,
  'rain.speeds': 2,
  'rain.density': 0.5,
  'rain.fade': 0.075,
  'rain.lineWidth': 1,
  'rain.glow': 4,
  'rain.glowColor': '#00a3d7',
  'glass.level': 0.4,
  'glass.blur': 3,
  'glass.radius': 10,
};

describe('settings schema (issue #13)', () => {
  it('has unique keys whose defaults fit their own rules', () => {
    const keys = FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(normalize(RULES, {})).toEqual(DEFAULTS);
    FIELDS.filter((f) => f.type === 'range').forEach((f) => {
      expect(f.d, f.key).toBeGreaterThanOrEqual(f.min);
      expect(f.d, f.key).toBeLessThanOrEqual(f.max);
    });
    FIELDS.filter((f) => f.type === 'select').forEach((f) =>
      expect(
        f.options.map((o) => o.value),
        f.key,
      ).toContain(f.d),
    );
  });

  it('uses the settings preferred in issue #15 as the defaults', () => {
    expect(DEFAULTS).toMatchObject(ISSUE_15);
    expect(changesOf(normalize(RULES, ISSUE_15))).toEqual({});
  });

  it('keeps the rest of the look of the site before settings existed by default', () => {
    expect(DEFAULTS).toMatchObject({
      'motion.mode': 'auto',
      'rain.padding': 0,
      'rain.minLinks': 1,
      'rain.maxLinks': 4,
      'rain.real': false,
      'nebula.resolution': 0.6,
      'nebula.fps': 24,
      'skin.name': 'glass',
      'theory.notation': 'L',
    });
  });

  it('labels every section and field in English and Russian', () => {
    SECTIONS.forEach((section) => {
      expect(section.title.en && section.title.ru, section.id).toBeTruthy();
      section.fields.forEach((field) => {
        expect(field.label.en && field.label.ru, field.key).toBeTruthy();
        (field.options || []).forEach((o) => expect(o.label.en && o.label.ru, `${field.key} ${o.value}`).toBeTruthy());
      });
    });
  });
});

describe('checking stored settings', () => {
  it('clamps numbers, rejects unknown choices and broken colours, ignores unknown keys', () => {
    const settings = normalize(RULES, {
      'rain.step': 5,
      'grid.size': 1000,
      'nebula.fps': 'fast',
      'skin.name': 'paper',
      'rain.glowColor': 'red',
      'grid.on': 'yes',
      'future.palette': 'ares',
      'liquid.tint': 'accent',
      'rain.real': true,
      unknown: 1,
    });
    expect(settings['rain.step']).toBe(20);
    expect(settings['grid.size']).toBe(128);
    expect(settings['nebula.fps']).toBe(24);
    expect(settings['skin.name']).toBe('glass');
    expect(settings['rain.glowColor']).toBe('#00a3d7');
    expect(settings['grid.on']).toBe(true);
    expect(settings['future.palette']).toBe('ares');
    expect(settings['liquid.tint']).toBe('accent');
    expect(settings['rain.real']).toBe(true);
    expect(settings).not.toHaveProperty('unknown');
  });

  it('puts numbers and colours into CSS variables and the rest into attributes', () => {
    const element = document.createElement('div');
    applySettings(element, RULES, { ...DEFAULTS, 'skin.name': 'liquid', 'liquid.blur': 30 });
    expect(element.getAttribute('data-skin-name')).toBe('liquid');
    expect(element.getAttribute('data-grid-fade')).toBe('true');
    expect(element.getAttribute('data-theory-notation')).toBe('L');
    expect(element.style.getPropertyValue('--liquid-blur')).toBe('30px');
    expect(element.style.getPropertyValue('--grid-size')).toBe('48px');
    expect(element.style.getPropertyValue('--liquid-saturation')).toBe('180');
    expect(element.style.getPropertyValue('--rain-glow-color')).toBe('#00a3d7');
    expect(element.style.getPropertyValue('--future-spacing')).toBe('0.08em');
  });
});

describe('settings store', () => {
  it('applies a change at once and remembers only what differs from the defaults', () => {
    setSettings({ 'skin.name': 'futuristic', 'rain.step': 120, 'grid.size': 48 });
    expect(getSettings()['skin.name']).toBe('futuristic');
    expect(root.dataset.skinName).toBe('futuristic');
    expect(root.style.getPropertyValue('--rain-step')).toBe('120ms');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual({
      'skin.name': 'futuristic',
      'rain.step': 120,
    });
    expect(loadSettings()).toEqual(getSettings());
  });

  it('resets some or all settings and forgets them when nothing differs', () => {
    setSettings({ 'skin.name': 'liquid', 'liquid.blur': 30, 'rain.real': true });
    resetSettings(['liquid.blur']);
    expect(changesOf(getSettings())).toEqual({ 'skin.name': 'liquid', 'rain.real': true });
    resetSettings();
    expect(getSettings()).toEqual(DEFAULTS);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(root.dataset.skinName).toBe('glass');
  });

  it('survives broken storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSettings()).toEqual(DEFAULTS);
    window.localStorage.setItem(STORAGE_KEY, '"text"');
    expect(loadSettings()).toEqual(DEFAULTS);
  });

  it('follows changes made in another tab', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'skin.name': 'liquid' }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    expect(getSettings()['skin.name']).toBe('liquid');
    expect(root.dataset.skinName).toBe('liquid');
  });
});

describe('settings before the first paint', () => {
  it('are applied by the script injected into every page with the same rules', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'skin.name': 'futuristic', 'glass.blur': 99 }));
    delete root.dataset.skinName;
    root.style.removeProperty('--glass-blur');
    new Function(SETTINGS_SCRIPT)();
    expect(root.dataset.skinName).toBe('futuristic');
    expect(root.style.getPropertyValue('--glass-blur')).toBe('30px');

    window.localStorage.setItem(STORAGE_KEY, 'broken');
    expect(() => new Function(SETTINGS_SCRIPT)()).not.toThrow();
  });
});
