import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { replaceAddress } from './history';
import { setLang, getLang } from './i18n/prefs';
import { useQueryParam } from './pages/query';
afterEach(() => {
  vi.restoreAllMocks();
  setLang('en', { save: false });
});

it('preserves existing history state and returns failures without throwing', () => {
  window.history.replaceState({ keep: 1 }, '', '/');
  expect(replaceAddress('/?test=1')).toBeNull();
  expect(window.history.state).toEqual({ keep: 1 });
  const error = new DOMException('quota', 'SecurityError');
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
    throw error;
  });
  expect(replaceAddress('/?test=2')).toBe(error);
});

it('keeps language and filtered-page state usable when history rejects writes too', () => {
  const { result } = renderHook(() => useQueryParam('role'));
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
    throw new DOMException('quota', 'SecurityError');
  });
  act(() => result.current[1]('ml'));
  expect(result.current[0]).toBe('ml');
  expect(() => setLang('ru')).not.toThrow();
  expect(getLang()).toBe('ru');
});
