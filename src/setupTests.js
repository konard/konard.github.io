// jest-dom adds custom matchers for asserting on DOM nodes, such as
// expect(element).toHaveTextContent(/react/i).
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setLang, setTheme } from './i18n/prefs';
import { setSaved } from './settings/presets';
import { resetSettings } from './settings/store';

// Every test starts in English with the system theme, default settings and no saved looks, whatever an earlier test switched to.
afterEach(() => {
  cleanup();
  setLang('en', { save: false });
  setTheme('auto', { save: false });
  resetSettings(undefined, { save: false });
  setSaved([]);
  window.localStorage.clear();
});

// Components that refresh data live (Habr statistics) must never reach the
// network in tests: unless a test passes its own fetch, requests fail fast and
// the committed snapshot stays on screen.
globalThis.fetch = () => Promise.reject(new Error('Network is disabled in tests'));
