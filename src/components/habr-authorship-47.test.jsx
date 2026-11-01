import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import habr from '../data/habr.json';
import github from '../data/github.json';
import { habrAuthorship } from '../data/habrAuthorship';
import { setLang } from '../i18n/prefs';
import HabrCards from './HabrCards';
import StatTiles, { buildStats } from './StatTiles';

// Issue #47: the Habr numbers must not read as if every article were the owner's own.
describe('Habr authorship (issue #47)', () => {
  afterEach(() => setLang('en'));
  const { mine, team } = habrAuthorship(habr);

  it('splits the articles between the owner and the Deep.Foundation team', () => {
    expect(mine).toBeGreaterThan(0);
    expect(team).toBeGreaterThan(0);
    expect(mine + team).toBe(habr.articles.length);
  });

  it('names both groups on the stat tile and points to the footnote', () => {
    const tile = buildStats(github, 2000, new Date('2026-10-16'), habr).find((s) => s.id === 'habr');
    expect(tile.hint).toBe(`${mine} articles by me, ${team} articles by the Deep.Foundation team`);
    expect(tile.hint).not.toMatch(/^\d+ articles on/);
    render(<StatTiles github={github} codingSince={2000} habr={habr} />);
    expect(screen.getByRole('link', { name: 'Who wrote these articles' })).toHaveAttribute('href', '#habr-authorship');
  });

  it('states who wrote the articles in both languages', () => {
    const { container, unmount } = render(<HabrCards snapshot={habr} live={false} />);
    const note = container.querySelector('#habr-authorship');
    expect(note.textContent).toMatch(/direct participation, in consultation with me or under my direction/);
    expect(note.textContent).toContain(`${mine} of the ${habr.articles.length} articles are written by me`);
    expect(screen.getAllByText('by me')).toHaveLength(mine);
    unmount();
    setLang('ru');
    const ru = render(<HabrCards snapshot={habr} live={false} />);
    expect(ru.container.querySelector('#habr-authorship').textContent).toMatch(
      /при моём непосредственном участии, в консультации со мной или под моим руководством/,
    );
  });
});
