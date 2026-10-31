import { chooseSelect } from '../test/select';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import archive from '../data/posts.json';
import { fields, professions } from '../data/fields';
import { experience, positions } from '../data/profile';
import NetworkGallery from '../components/NetworkGallery';
import { metaTheory } from '../data/theory';
import { setLang, tr } from '../i18n/prefs';
import { codeAt, indexOf } from '../links/configurations';
import { STACK_ORGANIZATIONS } from '../data/stack';
import { NetworkExample } from '../components/MetaTheory';
import ArtPage, { ART } from './ArtPage';
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

  it('count only original repositories, without forks or mirrors', () => {
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
    professions.forEach((p) =>
      expect(screen.getByRole('heading', { level: 3, name: tr(p.name, 'en') })).toBeInTheDocument(),
    );
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
  const choices = positions.filter((p) => p.id !== 'all');

  it('shows every position without a role', () => {
    render(<ExperiencePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Experience by position' })).toBeInTheDocument();
    expect(count(screen.getByRole('list', { name: 'Career timeline' }))).toBe(experience.length);
    expect(screen.getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', '/cv/?lang=en');
  });

  it('shows every example repository of every profession without a role', () => {
    const { container } = render(<ExperiencePage />);
    const examples = container.querySelector('#examples');
    professions.forEach((p) =>
      expect(within(examples).getByRole('heading', { level: 3, name: tr(p.name, 'en') })).toBeInTheDocument(),
    );
    const listed = professions.reduce((sum, p) => sum + p.repos.length, 0);
    expect(examples.querySelectorAll('.repo')).toHaveLength(listed);
  });

  it('lists the old and the new positions of issue #11', () => {
    expect(choices.map((p) => p.id)).toEqual(
      expect.arrayContaining(['ml', 'devops', 'lead', 'developer', 'research', 'techlead', 'cto', 'backend']),
    );
    expect(choices.map((p) => p.id)).toEqual(
      expect.arrayContaining(['fullstack', 'dotnet', 'rust', 'ai-agents', 'trading', 'data']),
    );
  });

  it.each(choices.map((p) => p.id))('shows only the matching experience for ?role=%s', (id) => {
    go(`?role=${id}`);
    render(<ExperiencePage />);
    const role = positions.find((p) => p.id === id);
    const name = tr(role.name, 'en');
    expect(screen.getByRole('heading', { level: 1, name: `${name} experience` })).toBeInTheDocument();
    expect(role.jobs.length).toBeGreaterThan(0);
    expect(count(screen.getByRole('list', { name: 'Career timeline' }))).toBe(role.jobs.length);
    const tab = screen.getByRole('navigation', { name: 'Positions' });
    expect(within(tab).getByRole('link', { name: new RegExp(`^${RegExp.escape(name)} \\d+$`) })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The CV of the position: its page and its prebuilt PDF.
    expect(screen.getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', `/cv/?role=${id}&lang=en`);
    expect(screen.getByRole('link', { name: 'PDF' })).toHaveAttribute(
      'href',
      `/cv/pdf/konstantin-diachenko-${id}-classic-en.pdf`,
    );
  });

  it('names the research role Scientist', () => {
    expect(positions.find((p) => p.id === 'research').name).toEqual({ en: 'Scientist', ru: 'Учёный' });
    expect(professions.find((p) => p.id === 'research').name).toEqual({ en: 'Scientist', ru: 'Учёный' });
  });

  it('switches the role without reloading the page', () => {
    render(<ExperiencePage />);
    fireEvent.click(screen.getByRole('link', { name: /^DevOps/ }));
    expect(window.location.search).toBe('?role=devops');
    expect(screen.getByRole('heading', { level: 1, name: 'DevOps experience' })).toBeInTheDocument();
  });

  it('is translated to Russian, with the Russian names of the companies', () => {
    go('?role=developer');
    render(<ExperiencePage />);
    act(() => setLang('ru', { save: false }));
    expect(screen.getByRole('heading', { level: 1, name: 'Опыт: Разработчик' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Скачать резюме' })).toHaveAttribute('href', '/cv/?role=developer&lang=ru');
    expect(
      screen.getByText('АО «ЭЛАР»', { selector: '.position__title a, .position__title span' }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('[object Object]');
  });
});

describe('ResearchPage', () => {
  it('shows the meta-theory, the problem solving algorithm, highlights and laws', () => {
    const { container } = render(<ResearchPage />);
    ['theory', 'symbols', 'method', 'highlights', 'laws', 'all'].forEach((id) =>
      expect(container.querySelector(`#${id}`)).not.toBeNull(),
    );
    expect(container.querySelector('.psd')).not.toBeNull();
    // Issue #9: the method explains recursion, self-application, going back to
    // the formulation and links the implementations in code.
    const method = within(container.querySelector('#method'));
    ['Recursive', 'Applicable to itself', 'Returns to formulation', 'Self-improving', 'Implemented'].forEach((t) =>
      expect(method.getByText(t)).toBeInTheDocument(),
    );
    expect(method.getByText(/made less dumb/)).toBeInTheDocument();
    expect(method.getByText(/rarely means redoing everything/)).toBeInTheDocument();
    expect(method.getByText(/the plan is an algorithm/)).toBeInTheDocument();
    ['link-assistant/hive-mind', 'link-assistant/formal-ai'].forEach((repo) =>
      expect(method.getByRole('link', { name: repo })).toHaveAttribute('href', `https://github.com/${repo}`),
    );
    expect(container.querySelector('#method figcaption').textContent).toBe('Original drawing · konard/problem-solving');
    const highlights = within(container.querySelector('#highlights'));
    expect(highlights.getByRole('link', { name: 'konard/p-vs-np' })).toBeInTheDocument();
    expect(highlights.getByRole('link', { name: 'konard/tsp' })).toBeInTheDocument();
    expect(container.querySelector('#laws').querySelectorAll('.repo')).toHaveLength(LAWS.length);
  });
});

describe('AssociativePage', () => {
  it('starts the stack from the links meta-theory and goes up to the applications (issue #13)', () => {
    const { container } = render(<AssociativePage />);
    const layers = [...container.querySelectorAll('.stack__layer')].map((l) => l.id);
    expect(layers).toEqual(STACK.map((l) => `layer-${l.id}`));
    expect(layers[0]).toBe('layer-theory');
    expect(layers.at(-1)).toBe('layer-apps');
    const first = container.querySelector('#layer-theory .repo');
    expect(within(first).getByRole('link', { name: 'link-foundation/meta-theory' })).toBeInTheDocument();
    expect(
      within(container.querySelector('#layer-storage')).getByRole('link', { name: 'konard/LinksPlatform' }),
    ).toBeInTheDocument();
    expect(
      within(container.querySelector('#layer-storage')).getByRole('link', { name: 'link-foundation/lfs' }),
    ).toBeInTheDocument();
  });

  it('places every original repository of linksplatform, link-foundation and link-assistant in one layer', () => {
    const names = STACK.flatMap((l) => l.repos.map(([name]) => name.toLowerCase()));
    expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
    const own = ownRepositories.filter((r) => STACK_ORGANIZATIONS.includes(r.owner)).map((r) => r.fullName);
    expect(own.length).toBeGreaterThan(180);
    expect(own.filter((name) => !names.includes(name.toLowerCase()))).toEqual([]);
  });

  it('links every layer from the index with the number of its repositories', () => {
    const { container } = render(<AssociativePage />);
    const index = within(screen.getByRole('navigation', { name: 'Layers of the stack' }));
    STACK.forEach((l) => {
      const link = index.getByRole('link', { name: new RegExp(`^\\d+\\. ${RegExp.escape(tr(l.title, 'en'))} `) });
      expect(link).toHaveAttribute('href', `#layer-${l.id}`);
      expect(link).toHaveTextContent(String(l.repos.length));
      expect(container.querySelectorAll(`#layer-${l.id} > .repos > .repo`)).toHaveLength(l.repos.length);
    });
  });
});

describe('ArtPage', () => {
  it('lists art projects and uncategorized repositories', () => {
    render(<ArtPage />);
    expect(count(screen.getByRole('list', { name: 'Art' }))).toBe(ART.length);
    expect(count(screen.getByRole('list', { name: 'Other' }))).toBe(inField('other').length);
  });

  it('shows the gallery of every network of 1–4 links', () => {
    const { container } = render(<ArtPage />);
    expect(within(container.querySelector('#symbols')).getByRole('list', { name: 'Networks of 2 links' })).toBeTruthy();
  });
});

describe('NetworkGallery (issue #9)', () => {
  it('draws all (N + 1)^(2N) networks of N links page by page, with base subscripts', () => {
    render(<NetworkGallery />);
    const two = screen.getByRole('list', { name: 'Networks of 2 links' });
    expect(count(two)).toBe(81);
    expect(two.firstChild).toHaveTextContent('00₃ 00₃');
    expect(two.lastChild).toHaveTextContent('22₃ 22₃');
    expect(two.firstChild).toHaveAttribute('title', '(1: 0 0) (2: 0 0)');
    expect(screen.getByText(/00₃ 00₃ … 22₃ 22₃ → 3⁴ = 81 networks/)).toBeInTheDocument();
    expect(screen.getByText(/\(1: 0 0\) \(2: 0 0\) … \(1: 2 2\) \(2: 2 2\)/)).toBeInTheDocument();
    // Every link of every symbol is one path in its own colour.
    expect(two.querySelectorAll('path')).toHaveLength(162);

    fireEvent.click(screen.getByRole('button', { name: /^1 link/ }));
    const one = screen.getByRole('list', { name: 'Networks of 1 link' });
    expect([...one.children].map((li) => li.textContent)).toEqual(['00₂', '01₂', '10₂', '11₂']);

    fireEvent.click(screen.getByRole('button', { name: /^4 links/ }));
    expect(count(screen.getByRole('list', { name: 'Networks of 4 links' }))).toBe(243);
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    expect(count(screen.getByRole('list', { name: 'Networks of 4 links' }))).toBe(729);
    expect(screen.getByRole('button', { name: /Show more \(389,896 left\)/ })).toBeInTheDocument();
  });

  it('can show one network per renaming class', () => {
    render(<NetworkGallery initial={3} />);
    fireEvent.click(screen.getByRole('button', { name: /One per renaming/ }));
    expect(count(screen.getByRole('list', { name: 'Renaming classes of 3 links' }))).toBe(243);
    fireEvent.click(screen.getByRole('button', { name: /^2 links/ }));
    expect(count(screen.getByRole('list', { name: 'Renaming classes of 2 links' }))).toBe(45);
  });

  it('can show only networks whose links refer to real links, not to 0 (issue #13)', () => {
    render(<NetworkGallery />);
    const toggle = screen.getByRole('button', { name: /Show only real references/ });
    // Off by default: the gallery still starts with all 81 networks of 2 links.
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveTextContent('16');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const two = screen.getByRole('list', { name: 'Networks of 2 links' });
    expect(count(two)).toBe(16);
    expect(two.firstChild).toHaveTextContent('11₃ 11₃');
    expect(two.lastChild).toHaveTextContent('22₃ 22₃');
    expect([...two.children].every((li) => !/0/.test(li.textContent))).toBe(true);
    expect(screen.getByText(/11₃ 11₃ … 22₃ 22₃ → 2⁴ = 16 networks/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^4 links/ })).toHaveTextContent('65,536');

    fireEvent.click(screen.getByRole('button', { name: /^1 link/ }));
    expect([...screen.getByRole('list', { name: 'Networks of 1 link' }).children].map((li) => li.textContent)).toEqual([
      '11₂',
    ]);
    fireEvent.click(screen.getByRole('button', { name: /^3 links/ }));
    fireEvent.click(screen.getByRole('button', { name: /One per renaming/ }));
    expect(count(screen.getByRole('list', { name: 'Renaming classes of 3 links' }))).toBe(129);
  });
});

describe('NetworkExample (issue #9)', () => {
  it('labels the math and the links notation and shows a random network on click', () => {
    const { container } = render(<NetworkExample example={metaTheory.example} random={() => 0.6} />);
    expect(screen.getByText('math notation')).toBeInTheDocument();
    expect(screen.getByText('links notation')).toBeInTheDocument();
    const math = () => container.querySelector('[data-notation="math"]').textContent;
    const links = () => container.querySelector('[data-notation="links"]').textContent;
    expect(math()).toBe('11₄ 22₄ 12₄');
    expect(links()).toBe('(1: 1 1)(2: 2 2)(3: 1 2)');
    fireEvent.click(screen.getByRole('button', { name: /Network of 3 links/ }));
    // random() = 0.6 picks 3 links and the network at 0.6 × 4⁶.
    expect(math()).toBe('21₄ 21₄ 21₄');
    expect(links()).toBe('(1: 2 1)(2: 2 1)(3: 2 1)');
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
    expect(screen.getAllByRole('button', { name: 'Show archived copy' }).length).toBeGreaterThan(0);
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

  it('shows the archived copies of pictures, not the CDN links', () => {
    const { container } = render(<BlogPage initialLanguage="ru" />);
    const sources = [...container.querySelectorAll('.post__media img')].map((img) => img.getAttribute('src'));
    const notArchived = new Set(
      archive.posts.flatMap((p) => p.media.filter((m) => m.fileError)).flatMap((m) => [m.url, m.poster]),
    );
    expect(sources.length).toBeGreaterThan(10);
    expect(sources.filter((s) => !s.startsWith('/archive/media/') && !notArchived.has(s))).toEqual([]);
  });

  it('replaces a picture the CDN no longer serves with a note, not a broken image', () => {
    const { container } = render(<BlogPage initialLanguage="ru" />);
    const url = archive.posts.flatMap((p) => p.media).find((m) => m.fileError).url;
    const img = [...container.querySelectorAll('.post__media img')].find((i) => i.getAttribute('src') === url);
    fireEvent.error(img);
    expect(container.querySelector(`.post__media img[src="${url}"]`)).toBeNull();
    expect(screen.getAllByText('Picture no longer available').length).toBeGreaterThan(0);
  });

  it('embeds X first and offers an archived copy and retry', () => {
    const { container } = render(<BlogPage initialLanguage="en" />);
    expect(container.querySelector('[data-social-embed="x"]')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Show archived copy' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Show embed' }));
    expect(container.querySelectorAll('[data-social-embed="x"]').length).toBeGreaterThan(0);
  });
});

describe('page entries', () => {
  it('every page has a title, a summary and a symbol of links, in the order CV, Experience, Repositories…', () => {
    expect(PAGES.map((p) => p.id)).toEqual([
      'home',
      'experience',
      'repositories',
      'research',
      'associative',
      'art',
      'blog',
    ]);
    PAGES.forEach((p) => {
      expect(p.title && p.summary && p.glyph).toBeTruthy();
      expect(codeAt(p.glyph.split(' ').length, indexOf(p.glyph))).toBe(p.glyph);
      expect(p.href).toBe(p.id === 'home' ? '/' : `/${p.id}/`);
    });
  });
});

describe('pages in Russian (issue #11)', () => {
  const russian = () => setLang('ru', { save: false });
  const noObjects = () => expect(document.body.textContent).not.toContain('[object Object]');
  const h = (level, name) => expect(screen.getByRole('heading', { level, name })).toBeInTheDocument();

  it('RepositoriesPage', () => {
    russian();
    const { container } = render(<RepositoriesPage />);
    h(1, 'Репозитории');
    h(2, 'Репозитории по IT-профессиям');
    h(2, 'Чем репозитории полезны в разных областях');
    professions.forEach((p) => h(3, p.name.ru));
    fields.forEach((f) => expect(container.querySelector(`#field-${f.id} h3`).textContent).toContain(f.name.ru));
    expect(screen.getByRole('list', { name: 'Все репозитории' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Поиск' })).toBeInTheDocument();
    expect(container.querySelector('.page-hero__lead').textContent).toMatch(
      /^[\d\s]+ (собственный репозиторий|собственных репозитория|собственных репозиториев) в \d+ аккаунтах/,
    );
    noObjects();
  });

  it('ResearchPage', () => {
    russian();
    const { container } = render(<ResearchPage />);
    h(1, 'Исследования и теория');
    h(2, 'Метатеория связей');
    h(2, 'Универсальный алгоритм решения задач');
    h(2, 'Законы как наука о данных');
    HIGHLIGHTS.forEach((g) => h(3, g.title.ru));
    expect(screen.getByRole('list', { name: 'Сети из 2 связей' })).toBeInTheDocument();
    expect(container.querySelector('#method figcaption').textContent).toBe(
      'Оригинальный рисунок · konard/problem-solving',
    );
    expect(screen.getByText(LAWS[0][1].ru)).toBeInTheDocument();
    noObjects();
  });

  it('AssociativePage', () => {
    russian();
    render(<AssociativePage />);
    h(1, 'Ассоциативный стек');
    h(2, 'От теории до приложений');
    STACK.forEach((l) => h(3, l.title.ru));
    expect(screen.getByRole('list', { name: 'Движки хранения' })).toBeInTheDocument();
    noObjects();
  });

  it('ArtPage', () => {
    russian();
    render(<ArtPage />);
    h(1, 'Искусство и другие проекты');
    h(2, 'Все конфигурации из 1–4 связей');
    expect(count(screen.getByRole('list', { name: 'Искусство' }))).toBe(ART.length);
    expect(count(screen.getByRole('list', { name: 'Прочее' }))).toBe(inField('other').length);
    noObjects();
  });

  it('BlogPage: shows the posts in the site language, without taking over ?lang=', () => {
    russian();
    render(<BlogPage />);
    h(1, 'Записи');
    h(2, 'Лента');
    const posts = screen.getByRole('list', { name: 'Записи' });
    const langs = [...posts.children].map((li) => li.getAttribute('lang'));
    expect(langs.filter((l) => l === 'ru').length).toBeGreaterThan(langs.length / 2);
    expect(screen.getByRole('combobox', { name: 'Язык' })).toHaveTextContent('Авто (Русский)');
    expect(screen.getByText(/^\d+ (история|истории|историй)$/)).toBeInTheDocument();
    chooseSelect(screen.getByRole('combobox', { name: 'Язык' }), 'en');
    expect(window.location.search).toBe('?posts=en');
    expect(screen.getByText('Только записи на английском')).toBeInTheDocument();
    noObjects();
  });
});
