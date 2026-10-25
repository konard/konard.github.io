// Language and theme of the site (issue #11). Both are small stores read with
// useSyncExternalStore, so any component can use them without a provider and
// tests can switch them with setLang / setTheme.
//
// Language: `?lang=ru|en` in the URL, then the remembered choice, then the
// browser languages, then English. Theme: the remembered choice, otherwise
// `prefers-color-scheme`. index.html applies the theme before the first paint
// with the same rules (see THEME_SCRIPT in vite.config.js).
import { useCallback, useSyncExternalStore } from 'react';
import { replaceAddress } from '../history';

export const LANGS = ['en', 'ru'];
export const THEMES = ['auto', 'light', 'dark'];

const storage = () => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};

const remembered = (key) => {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const remember = (key, value) => {
  try {
    if (value == null) storage()?.removeItem(key);
    else storage()?.setItem(key, value);
  } catch {
    // Private mode or disabled storage: the choice lasts until the page closes.
  }
};

/** The language to show: URL parameter, remembered choice, browser languages, English. */
export function detectLang({ search = '', stored = null, languages = [] } = {}) {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  if (LANGS.includes(stored)) return stored;
  for (const language of languages) {
    const base = String(language).toLowerCase().split('-')[0];
    if (LANGS.includes(base)) return base;
  }
  return 'en';
}

/** 'light' or 'dark': the remembered choice, otherwise what the system prefers. */
export function resolveTheme(choice, prefersLight) {
  if (choice === 'light' || choice === 'dark') return choice;
  return prefersLight ? 'light' : 'dark';
}

const browser = typeof window !== 'undefined';
const prefersLight = () =>
  browser && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches;

function createStore(initial, apply) {
  let value = initial;
  const listeners = new Set();
  apply(value);
  return {
    get: () => value,
    set(next) {
      if (next === value) return;
      value = next;
      apply(value);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const langStore = createStore(
  detectLang({
    search: browser ? window.location.search : '',
    stored: remembered('lang'),
    languages: browser ? navigator.languages || [navigator.language] : [],
  }),
  (lang) => {
    if (browser) document.documentElement.lang = lang;
  },
);

const themeStore = createStore(THEMES.includes(remembered('theme')) ? remembered('theme') : 'auto', (choice) => {
  if (!browser) return;
  const theme = resolveTheme(choice, prefersLight());
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f5f7fb' : '#070b14');
});

if (browser && typeof window.matchMedia === 'function') {
  // In the automatic mode the site follows the system theme while it is open.
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (themeStore.get() === 'auto') {
      document.documentElement.dataset.theme = resolveTheme('auto', prefersLight());
    }
  });
}

export const getLang = langStore.get;
export const getTheme = themeStore.get;

/** Switches the language, remembers it and keeps `?lang=` in the address so the page can be shared. */
export function setLang(lang, { save = true } = {}) {
  if (!LANGS.includes(lang)) return;
  if (save) remember('lang', lang);
  if (browser && save) {
    const params = new URLSearchParams(window.location.search);
    params.set('lang', lang);
    replaceAddress(`${window.location.pathname}?${params}${window.location.hash}`);
  }
  langStore.set(lang);
}

/** Switches the theme: 'auto' forgets the choice and follows the system again. */
export function setTheme(choice, { save = true } = {}) {
  if (!THEMES.includes(choice)) return;
  if (save) remember('theme', choice === 'auto' ? null : choice);
  themeStore.set(choice);
}

/** Text in the current language: plain strings are the same in every language, `{ en, ru }` objects are translated. */
export function tr(text, lang) {
  if (text && typeof text === 'object' && !Array.isArray(text) && 'en' in text) return text[lang] ?? text.en;
  return text;
}

/** `{ lang, setLang, t }`; `t(text)` translates `{ en, ru }` objects (see tr). */
export function useLang() {
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, () => 'en');
  const t = useCallback((text) => tr(text, lang), [lang]);
  return { lang, setLang, t };
}

/** `{ theme, setTheme }`, where theme is 'auto', 'light' or 'dark'. */
export function useTheme() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => 'auto');
  return { theme, setTheme };
}

/** The effective theme, including changes to the system preference in automatic mode. */
const subscribeSystemTheme = (listener) => {
  const media = window.matchMedia?.('(prefers-color-scheme: light)');
  media?.addEventListener?.('change', listener);
  return () => media?.removeEventListener?.('change', listener);
};
export function useResolvedTheme() {
  const { theme } = useTheme();
  const light = useSyncExternalStore(subscribeSystemTheme, prefersLight, () => false);
  return resolveTheme(theme, light);
}
