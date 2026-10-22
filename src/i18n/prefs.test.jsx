import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { THEME_SCRIPT } from '../../vite.config';
import PrefSwitches from '../components/PrefSwitches';
import { detectLang, getLang, getTheme, resolveTheme, setLang, tr, useLang } from './prefs';

describe('language detection', () => {
  it('prefers ?lang= in the URL, then the remembered choice, then the browser', () => {
    expect(detectLang({ search: '?lang=ru', stored: 'en', languages: ['en-US'] })).toBe('ru');
    expect(detectLang({ search: '?lang=de', stored: 'ru', languages: ['en-US'] })).toBe('ru');
    expect(detectLang({ languages: ['de-DE', 'ru-RU', 'en'] })).toBe('ru');
    expect(detectLang({ languages: ['RU'] })).toBe('ru');
    expect(detectLang({ languages: ['fr-FR'] })).toBe('en');
    expect(detectLang()).toBe('en');
  });
});

describe('theme', () => {
  it('uses the remembered choice, otherwise the system preference', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('auto', true)).toBe('light');
    expect(resolveTheme('auto', false)).toBe('dark');
  });

  it('is applied before the first paint by the script injected into every page', () => {
    const run = (stored, prefersLight) => {
      window.localStorage.clear();
      if (stored) window.localStorage.setItem('theme', stored);
      const matchMedia = window.matchMedia;
      window.matchMedia = () => ({ matches: prefersLight });
      delete document.documentElement.dataset.theme;
      new Function(THEME_SCRIPT)();
      window.matchMedia = matchMedia;
      return document.documentElement.dataset.theme;
    };
    expect(run(null, true)).toBe('light');
    expect(run(null, false)).toBe('dark');
    expect(run('dark', true)).toBe('dark');
    expect(run('light', false)).toBe('light');
  });
});

describe('translation', () => {
  it('translates { en, ru } objects and keeps plain values', () => {
    expect(tr({ en: 'Experience', ru: 'Опыт' }, 'ru')).toBe('Опыт');
    expect(tr({ en: 'Experience', ru: 'Опыт' }, 'en')).toBe('Experience');
    expect(tr({ en: 'Only English' }, 'ru')).toBe('Only English');
    expect(tr('Rust', 'ru')).toBe('Rust');
    expect(tr(['a'], 'ru')).toEqual(['a']);
  });
});

function Greeting() {
  const { t } = useLang();
  return <p>{t({ en: 'Hello', ru: 'Привет' })}</p>;
}

describe('switches', () => {
  it('switch the language everywhere, remember it and put it in the URL', () => {
    render(
      <>
        <PrefSwitches />
        <Greeting />
      </>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'RU' }));
    expect(screen.getByText('Привет')).toBeInTheDocument();
    expect(getLang()).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(window.localStorage.getItem('lang')).toBe('ru');
    expect(window.location.search).toContain('lang=ru');
    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'true');
    setLang('en');
    window.history.replaceState(null, '', '/');
  });

  it('cycle the theme system → light → dark → system and remember it', () => {
    render(<PrefSwitches />);
    const button = () => screen.getByTitle(/^Theme/);
    expect(getTheme()).toBe('auto');
    fireEvent.click(button());
    expect(getTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
    fireEvent.click(button());
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(button());
    expect(getTheme()).toBe('auto');
    expect(window.localStorage.getItem('theme')).toBeNull();
  });
});
