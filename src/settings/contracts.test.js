import { afterEach, describe, expect, test } from 'vitest';
import { STORAGE_KEY, getSettings, loadSettings, openSharedLook, setSettings } from './store';
import { applySettings, normalize } from './apply';
import { CSS_RULES, DEFAULTS, RULES } from './schema';
import { applyLook, getSaved, lookOfHash, shareLink } from './presets';
import { readNetwork, DEFAULT_CODE } from '../pages/NetworkPage';
import { encode } from '../links/configurations';
import { SETTINGS_SCRIPT } from '../../vite.config';

afterEach(() => window.history.replaceState(null, '', '/'));

describe('public contracts frozen before issue 54 migration', () => {
  test('old JSON settings, CSS variables and data attributes', () => {
    expect(STORAGE_KEY).toBe('settings');
    localStorage.setItem('settings', JSON.stringify({ 'skin.name': 'liquid', 'liquid.blur': 24 }));
    const values = loadSettings();
    expect(values['skin.name']).toBe('liquid');
    expect(values['liquid.blur']).toBe(24);
    const root = document.createElement('div');
    applySettings(root, CSS_RULES, values);
    expect(root.dataset.skinName).toBe('liquid');
    expect(root.style.getPropertyValue('--liquid-blur')).toBe('24px');
  });

  test('legacy shared looks preserve comfort and save the previous look', async () => {
    const look = { 'skin.name': 'liquid', 'liquid.blur': 24, 'sound.on': true, 'motion.mode': 'on' };
    const hash = `#settings=${encodeURIComponent(JSON.stringify(look))}`;
    const current = { ...DEFAULTS, 'motion.mode': 'off', 'sound.on': false };
    expect(applyLook(lookOfHash(hash), current)).toMatchObject({
      'skin.name': 'liquid',
      'motion.mode': 'off',
      'sound.on': false,
    });
    setSettings({ 'ui.accent': '#123456' });
    window.history.replaceState(null, '', `/settings/${hash}`);
    expect(await openSharedLook()).toBe(true);
    expect(getSaved().some((preset) => preset.name === 'Before the link')).toBe(true);
    expect(localStorage.getItem('settings-presets')).toBeTruthy();
    expect(getSettings()['skin.name']).toBe('liquid');
    expect(window.location.hash).toBe('');
  });

  test('new shared links round-trip through the public reader', () => {
    const look = { 'skin.name': 'liquid', 'liquid.blur': 24 };
    const link = shareLink(look, window.location.origin + '/settings/');
    expect(lookOfHash(new URL(link, window.location.origin).hash)).toMatchObject(look);
  });

  test('before-paint output matches runtime settings', () => {
    localStorage.setItem('settings', JSON.stringify({ 'skin.name': 'liquid', 'liquid.blur': 24 }));
    const expected = document.createElement('div');
    applySettings(expected, CSS_RULES, normalize(RULES, JSON.parse(localStorage.getItem('settings'))));
    window.eval(SETTINGS_SCRIPT);
    expect(document.documentElement.dataset.skinName).toBe(expected.dataset.skinName);
    expect(document.documentElement.style.getPropertyValue('--liquid-blur')).toBe('24px');
  });

  test('network URLs retain the default example and compact codes', () => {
    expect(DEFAULT_CODE).toBe('11 22 12');
    expect(encode(readNetwork('').links)).toBe(DEFAULT_CODE);
    expect(encode(readNetwork('?code=0120').links)).toBe('01 20');
  });
});
