// jest-dom adds custom matchers for asserting on DOM nodes, such as
// expect(element).toHaveTextContent(/react/i).
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { format } from 'node:util';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setLang, setTheme } from './i18n/prefs';
import { setSaved } from './settings/presets';
import { resetSettings } from './settings/store';

// jsdom has no canvas renderer. Exercise the unsupported-context fallback in
// component tests; drawing tests supply their own contexts and browser CI checks
// real pixels. Avoid jsdom emitting an error for every animation frame.
HTMLCanvasElement.prototype.getContext = () => null;

// Issue #51: a warning from React (an update outside act()) or jsdom (a missing
// API) passed silently and only cluttered the CI log, so it fails the test that
// caused it. The message still prints; a test that expects a warning replaces
// console.error or console.warn with its own spy, which bypasses this check.
const warnings = [];
for (const method of ['error', 'warn']) {
  const print = console[method];
  console[method] = (...args) => {
    warnings.push(`console.${method}: ${format(...args).split('\n')[0]}`);
    print.apply(console, args);
  };
}
// Registered before the reset below, so it runs after it and also catches
// warnings from unmounting.
afterEach(() => {
  const found = warnings.splice(0);
  if (found.length) throw new Error(`The test printed ${found.length} warning(s):\n${found.join('\n')}`);
});

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
