// The visitor's settings (issue #13), a small store like the language and the
// theme in src/i18n/prefs.js. Only the values that differ from the defaults are
// remembered, in localStorage under `settings`, so better defaults chosen later
// still reach everybody who did not change that particular setting. Other open
// tabs of the site follow along through the `storage` event.
import { useSyncExternalStore } from 'react';
import { applySettings, normalize } from './apply';
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
    const stored = JSON.parse(storage()?.getItem(STORAGE_KEY) || '{}');
    return normalize(RULES, stored && typeof stored === 'object' ? stored : {});
  } catch {
    return DEFAULTS;
  }
}

/** The settings that differ from the defaults, as `{ key: value }`. */
export const changesOf = (settings) =>
  Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== DEFAULTS[key]));

let current = loadSettings();
const listeners = new Set();

const apply = () => {
  if (browser) applySettings(document.documentElement, CSS_RULES, current);
};

const save = () => {
  const changes = changesOf(current);
  try {
    if (Object.keys(changes).length) storage()?.setItem(STORAGE_KEY, JSON.stringify(changes));
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

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** All settings, `{ key: value }`; components re-render when they change. */
export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);
}
