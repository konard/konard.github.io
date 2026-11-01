// The visitor's settings (issue #13), a small store like the language and the
// theme in src/i18n/prefs.js. Only the values that differ from the defaults are
// remembered, in localStorage under `settings` as indented Links Notation
// (issue #47; JSON saved before still loads), so better defaults chosen later
// still reach everybody who did not change that particular setting. Other open
// tabs of the site follow along through the `storage` event.
import { useSyncExternalStore } from 'react';
import { replaceAddress } from '../history';
import { applySettings, normalize } from './apply';
import { getLang } from '../i18n/prefs';
import { readStored, writeStored } from './notation';
import { CSS_RULES, DEFAULTS, RULES } from './schema';

export const STORAGE_KEY = 'settings';

const browser = typeof window !== 'undefined';

const storage = () => {
  try {
    return browser ? window.localStorage : null;
  } catch {
    return null;
  }
};

/** Settings remembered in localStorage, checked against the rules. */
export function loadSettings() {
  try {
    const stored = readStored(storage()?.getItem(STORAGE_KEY));
    return normalize(RULES, stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {});
  } catch {
    return DEFAULTS;
  }
}

/** The settings that differ from the defaults, as `{ key: value }`. */
export const changesOf = (settings) =>
  Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== DEFAULTS[key]));

/** Settings changes as the indented Links Notation that is saved, shown and copied (issue #47). */
export const settingsText = writeStored;

let current = loadSettings();
const listeners = new Set();

const apply = () => {
  if (browser) applySettings(document.documentElement, CSS_RULES, current);
};

const save = () => {
  const changes = changesOf(current);
  try {
    if (Object.keys(changes).length) storage()?.setItem(STORAGE_KEY, settingsText(changes));
    else storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or disabled storage: the settings last until the page closes.
  }
};

const replace = (next, remember) => {
  const changed = Object.keys(next).some((key) => next[key] !== current[key]);
  if (!changed) return;
  current = next;
  apply();
  if (remember) save();
  listeners.forEach((listener) => listener());
};

apply();

if (browser) {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) replace(loadSettings(), false);
  });
}

export const getSettings = () => current;

/** Changes some settings (`{ 'rain.step': 50 }`); invalid values fall back to what the rules allow. */
export function setSettings(patch, { save: remember = true } = {}) {
  replace(normalize(RULES, { ...current, ...patch }), remember);
}

/** Returns the given keys (all keys by default) to their defaults. */
export function resetSettings(keys = Object.keys(DEFAULTS), options) {
  setSettings(Object.fromEntries(keys.map((key) => [key, DEFAULTS[key]])), options);
}

/** Calls `listener` whenever the settings change; returns a function that stops it. */
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Opens the look a link carries (`#settings=…`, made by "Copy link" on the
 * settings page, issue #15): it replaces the look of this browser but keeps the
 * visitor's comfort settings, and the look it replaces is kept among the saved
 * looks under `before`. The hash is then removed, so a reload does not apply it
 * again. The preset code is loaded only for such links.
 */
export async function openSharedLook(before = getLang() === 'ru' ? 'До ссылки' : 'Before the link') {
  if (!browser || !window.location.hash.startsWith('#settings=')) return false;
  const { applyLook, cleanLook, getSaved, isLook, lookOfHash, setSaved, withSaved } = await import('./presets');
  const look = lookOfHash(window.location.hash);
  replaceAddress(window.location.pathname + window.location.search);
  if (!look) return false;
  const mine = cleanLook(changesOf(current));
  if (Object.keys(mine).length && !isLook(look, current)) setSaved(withSaved(getSaved(), before, mine));
  replace(applyLook(look, current), true);
  return true;
}

openSharedLook();

/** All settings, `{ key: value }`; components re-render when they change. */
export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);
}
