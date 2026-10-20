import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import archive from '../data/posts.json';
import { fields, professions } from '../data/fields';
import { experience, roles } from '../data/profile';
import codes from '../links/configurations.json';
import ArtPage, { ART, SymbolGallery } from './ArtPage';
import AssociativePage, { STACK } from './AssociativePage';
import BlogPage from './BlogPage';
import ExperiencePage from './ExperiencePage';
import { dedupe, pick } from './feed';
import { PAGES } from './pages';
import RepositoriesPage from './RepositoriesPage';
import { allRepositories, inField, matches, ownRepositories, repo } from './repos';
import ResearchPage, { HIGHLIGHTS, LAWS } from './ResearchPage';

const go = (search = '') => window.history.replaceState(null, '', `/${search}`);
afterEach(() => go());

// Direct items only: repository rows contain their own list of fields.
const count = (list) => list.children.length;

describe('curated repository lists', () => {
  const curated = {
    professions: professions.flatMap((p) => p.repos.map(([name]) => name)),
    highlights: HIGHLIGHTS.flatMap((g) => g.repos.map(([name]) => name)),
    laws: LAWS.map(([name]) => name),
    stack: STACK.flatMap((l) => l.repos.map(([name]) => name)),
    art: ART.map(([name]) => name),
  };

  it.each(Object.keys(curated))('only name original repositories that exist (%s)', (list) => {
    const missing = curated[list].filter((name) => repo(name)?.kind !== 'own');
    expect(missing).toEqual([]);
  });

  it('count only original repositories, without forks or client copies', () => {
    expect(ownRepositories.length).toBeGreaterThan(400);
    expect(ownRepositories.every((r) => r.kind === 'own')).toBe(true);
    expect(allRepositories.length).toBeGreaterThan(ownRepositories.length);
  });

  it('search names, descriptions, topics and languages', () => {
    const notation = repo('link-foundation/links-notation');
    expect(matches(notation, 'LINKS notation')).toBe(true);
    expect(matches(notation, 'links nonexistent-word')).toBe(false);
  });
});

describe('RepositoriesPage', () => {
  it('summarizes every field and lists the examples of every profession', () => {
    const { container } = render(<RepositoriesPage />);
    expect(container.querySelectorAll('.field-card')).toHaveLength(fields.length);
    professions.forEach((p) => expect(screen.getByRole('heading', { level: 3, name: p.name })).toBeInTheDocument());
  });

  it('filters the catalog by field and search, kept in the query string', () => {
    go('?field=research');
    render(<RepositoriesPage />);
    const list = screen.getByRole('list', { name: 'All repositories' });
    expect(count(list)).toBe(Math.min(60, inField('research').length));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'p-vs-np' } });
    expect(within(list).getByRole('link', { name: /p-vs-np/ })).toBeInTheDocument();
    expect(window.location.search).toContain('q=p-vs-np');
    expect(window.location.search).toContain('field=research');
  });
});

describe('ExperiencePage', () => {
  it('shows every position without a role', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Experience by role' })).toBeInTheDocument();
    expect(count(screen.getByRole('list', { name: 'Career timeline' }))).toBe(experience.length);
  });

  it.each(roles.map((r) => r.id))('shows only the matching experience for ?role=%s', (id) => {
    go(`?role=${id}`);
    render(<ExperiencePage />);
    const role = roles.find((r) => r.id === id);
    expect(screen.getByRole('heading', { level: 1, name: `${role.name} experience` })).toBeInTheDocument();
    const expected = experience.filter((e) => e.roles.includes(id)).length;
    expect(expected).toBeGreaterThan(0);
    expect(count(screen.getByRole('list', { name: 'Career timeline' }))).toBe(expected);
    expect(screen.getByRole('link', { name: new RegExp(role.name.replace(/[/]/g, '\\/')) })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('switches the role without reloading the page', () => {
    render(<ExperiencePage />);
    fireEvent.click(screen.getByRole('link', { name: /DevOps/ }));
    expect(window.location.search).toBe('?role=devops');
    expect(screen.getByRole('heading', { level: 1, name: 'DevOps experience' })).toBeInTheDocument();
  });
});

describe('ResearchPage', () => {
  it('shows the meta-theory, the problem solving algorithm, highlights and laws', () => {
    const { container } = render(<ResearchPage />);
    ['theory', 'method', 'highlights', 'laws', 'all'].forEach((id) =>
      expect(container.querySelector(`#${id}`)).not.toBeNull(),
    );
    expect(container.querySelector('.psd')).not.toBeNull();
    const highlights = within(container.querySelector('#highlights'));
    expect(highlights.getByRole('link', { name: 'konard/p-vs-np' })).toBeInTheDocument();
    expect(highlights.getByRole('link', { name: 'konard/tsp' })).toBeInTheDocument();
    expect(container.querySelector('#laws').querySelectorAll('.repo')).toHaveLength(LAWS.length);
  });
});

describe('AssociativePage', () => {
  it('draws the stack from AI on top to the theory at the bottom', () => {
    const { container } = render(<AssociativePage />);
    const layers = [...container.querySelectorAll('.stack__layer')].map((l) => l.id);
    expect(layers).toEqual(STACK.map((l) => `layer-${l.id}`).reverse());
    expect(
      within(container.querySelector('#layer-storage')).getByRole('link', { name: 'konard/LinksPlatform' }),
    ).toBeInTheDocument();
  });
});

describe('ArtPage', () => {
  it('lists art projects and uncategorized repositories', () => {
    render(<ArtPage />);
    expect(count(screen.getByRole('list', { name: 'Art' }))).toBe(ART.length);
    expect(count(screen.getByRole('list', { name: 'Other' }))).toBe(inField('other').length);
  });

  it('shows every configuration of 1–4 links from the sprite', () => {
    render(<SymbolGallery sprite="/s.svg" />);
    expect(count(screen.getByRole('list', { name: 'Configurations of 3 links' }))).toBe(codes[3].length);
    fireEvent.click(screen.getByRole('button', { name: /^2 links/ }));
    const two = screen.getByRole('list', { name: 'Configurations of 2 links' });
    expect(count(two)).toBe(10);
    expect(two.querySelector('use').getAttribute('href')).toMatch(/^\/s\.svg#links-2-/);
    fireEvent.click(screen.getByRole('button', { name: /^4 links/ }));
    expect(count(screen.getByRole('list', { name: 'Configurations of 4 links' }))).toBe(480);
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    expect(count(screen.getByRole('list', { name: 'Configurations of 4 links' }))).toBe(1440);
  });
});

describe('BlogPage', () => {
  const stories = dedupe(archive.posts);

  it('shows every story once, from X for English readers', () => {
    render(<BlogPage initialLanguage="en" />);
    const posts = screen.getByRole('list', { name: 'Posts' });
    expect(posts.children).toHaveLength(stories.length);
    const shown = [...posts.children].map((li) => li.querySelector('.post__network').textContent);
    const expected = stories.map((s) => ({ x: 'X', vk: 'VK', telegram: 'Telegram' })[pick(s, 'en').network]);
    expect(shown).toEqual(expected);
    expect(screen.getAllByRole('button', { name: 'Show embed' }).length).toBeGreaterThan(0);
  });

  it('shows the Russian version from VK for Russian readers and filters by language', () => {
    render(<BlogPage initialLanguage="ru" />);
    const posts = screen.getByRole('list', { name: 'Posts' });
    const langs = [...posts.children].map((li) => li.getAttribute('lang'));
    expect(langs.filter((l) => l === 'ru').length).toBeGreaterThan(langs.length / 2);
    fireEvent.click(screen.getByRole('checkbox'));
    expect([...posts.children].every((li) => li.getAttribute('lang') === 'ru' || !li.textContent)).toBe(true);
  });

  it('writes dates in the reader language, also on posts that exist in one language only', () => {
    render(<BlogPage initialLanguage="en" />);
    const dates = [...screen.getByRole('list', { name: 'Posts' }).querySelectorAll('time')].map((t) => t.textContent);
    expect(dates.filter((d) => /[а-я]/i.test(d))).toEqual([]);
  });

  it('embeds the X post on demand', () => {
    const { container } = render(<BlogPage initialLanguage="en" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Show embed' })[0]);
    expect(container.querySelector('iframe.post__embed').getAttribute('src')).toMatch(
      /^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?id=\d+/,
    );
  });
});

describe('page entries', () => {
  it('every page has a title, a summary and a symbol of links', () => {
    expect(PAGES.map((p) => p.id)).toEqual([
      'home',
      'repositories',
      'experience',
      'research',
      'associative',
      'art',
      'blog',
    ]);
    PAGES.forEach((p) => {
      expect(p.title && p.summary && p.glyph).toBeTruthy();
      expect(p.href).toBe(p.id === 'home' ? '/' : `/${p.id}/`);
    });
  });
});
