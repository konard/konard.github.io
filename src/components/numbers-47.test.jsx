import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import github from '../data/github.lino';
import habr from '../data/habr.lino';
import { skillGroups } from '../data/profile';
import { setLang } from '../i18n/prefs';
import ContributionsChart, { withOther } from './ContributionsChart';
import LanguageCloud, { LINGUIST_NAMES, undetectedLanguages } from './LanguageCloud';
import Registries from './Registries';
import { buildStats } from './StatTiles';

// Issue #47: every number on the page must match its source and the others.
const languageSkills = skillGroups.find((g) => g.id === 'languages').items;
const detected = new Set(github.languages.map((l) => l.name));

describe('numbers that agree with each other (issue #47)', () => {
  afterEach(() => setLang('en'));

  it('does not count a skill again when GitHub detects it under its linguist name', () => {
    const others = undetectedLanguages(github.languages, languageSkills);
    expect(others).not.toContain('Shell / Bash');
    expect(others).not.toContain('CUDA');
    expect(others).toEqual(expect.arrayContaining(['SQL', 'GraphQL', 'Assembly']));
    others.forEach((name) => (LINGUIST_NAMES[name] || [name]).forEach((n) => expect(detected.has(n)).toBe(false)));
    Object.keys(LINGUIST_NAMES).forEach((name) => expect(languageSkills).toContain(name));
    const { container } = render(<LanguageCloud languages={github.languages} extra={languageSkills} />);
    expect(container.querySelectorAll('.is-extra')).toHaveLength(others.length);
    expect(container.textContent).toContain(`and ${others.length} more from the skills list`);
  });

  it('adds up the contribution parts to the yearly totals and to the total', () => {
    const rows = github.contributions.map(withOther);
    rows.forEach((d) => {
      expect(d.other).toBeGreaterThanOrEqual(0);
      expect(d.commits + d.pullRequests + d.issues + d.reviews + d.other).toBe(d.total);
    });
    const other = rows.reduce((sum, d) => sum + d.other, 0);
    const { container } = render(<ContributionsChart data={github.contributions} />);
    const legend = within(container.querySelector('.mix .legend'));
    expect(legend.getByText('Other (new repositories, private)', { exact: false })).toBeInTheDocument();
    expect(legend.getByText(other.toLocaleString('en-US'))).toBeInTheDocument();
    const header = [...container.querySelectorAll('.table-view th')].map((th) => th.textContent);
    expect(header).toContain('Other (new repositories, private)');
  });

  it('names the other part of the contributions in Russian too', () => {
    setLang('ru');
    const { container } = render(<ContributionsChart data={github.contributions} />);
    const header = [...container.querySelectorAll('.table-view th')].map((th) => th.textContent);
    expect(header).toContain('Прочее (новые репозитории, приватные)');
    expect(screen.getByRole('group', { name: 'Шкала оси Y' })).toBeInTheDocument();
  });

  it('labels the languages tile as GitHub detection and dates the Habr tile', () => {
    const now = new Date('2026-11-01');
    const en = buildStats(github, 2000, now, habr);
    const ru = buildStats(github, 2000, now, habr, 'ru');
    const languages = en.find((s) => s.id === 'languages');
    expect(languages.label).toBe('Languages detected by GitHub');
    expect(languages.value).toBe(github.languages.length);
    expect(ru.find((s) => s.id === 'languages').label).toBe('Языков по данным GitHub');
    const date = habr.collectedAt.slice(0, 10);
    expect(en.find((s) => s.id === 'habr').hint).toMatch(new RegExp(`snapshot of ${date}$`));
    expect(ru.find((s) => s.id === 'habr').hint).toMatch(new RegExp(`снимок от ${date}$`));
  });

  it('does not say nothing is published where only packages of other repositories are', () => {
    const { container } = render(<Registries registries={github.registries} summary={github.packageRegistries} />);
    const note = container.querySelector('.registries__note').textContent;
    const { empty } = github.packageRegistries;
    expect(empty).not.toContain('Homebrew taps');
    expect(note).toContain(`Nothing published on ${empty.join(', ')}.`);
    expect(note).toContain('Homebrew taps: only packages from repositories that are not original, not counted.');
    setLang('ru');
    const ru = render(<Registries registries={github.registries} summary={github.packageRegistries} />);
    expect(ru.container.querySelector('.registries__note').textContent).toContain(
      'Homebrew taps: только пакеты из несобственных репозиториев, они не учитываются.',
    );
  });
});
