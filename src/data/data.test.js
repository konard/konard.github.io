import github from './github.lino';
import repositories from './repositories.lino';
import { fields, professions } from './fields';
import {
  education,
  experience,
  favoriteLanguages,
  featuredProjects,
  profile,
  publications,
  skillGroups,
  socials,
} from './profile';

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

describe('profile data integrity', () => {
  test('experience entries have valid, ordered dates', () => {
    const ids = new Set();
    experience.forEach((e) => {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(['company', 'open-source']).toContain(e.type);
      expect(e.start).toMatch(YM);
      if (e.end) {
        expect(e.end).toMatch(YM);
        expect(e.end >= e.start).toBe(true);
      }
      expect(e.title).toBeTruthy();
      expect(e.role).toBeTruthy();
      expect(e.summary).toBeTruthy();
    });
  });

  test('every featured project exists in the generated GitHub data', () => {
    const known = new Set(github.projects.map((p) => p.fullName));
    const missing = featuredProjects.filter((f) => !known.has(f.fullName)).map((f) => f.fullName);
    expect(missing).toEqual([]);
  });

  test('favorite languages appear in the skills list', () => {
    const all = skillGroups.flatMap((g) => g.items);
    favoriteLanguages.forEach((l) => expect(all).toContain(l));
  });

  test('links are absolute https URLs (or mailto)', () => {
    const urls = [
      ...socials.map((s) => s.url),
      ...publications.map((p) => p.url),
      ...experience.filter((e) => e.url).map((e) => e.url),
    ];
    urls.forEach((u) => expect(u).toMatch(/^(https:\/\/|mailto:)/));
    expect(new Set(socials.map((s) => s.id)).size).toBe(socials.length);
  });

  test('education and profile basics are present', () => {
    expect(profile.name).toEqual({ en: 'Konstantin Diachenko', ru: 'Константин Дьяченко' });
    expect(profile.handle).toBe(github.profile.login);
    expect(education.length).toBeGreaterThan(0);
  });
});

describe('generated github.lino', () => {
  test('has no auto-generated log repositories', () => {
    github.projects.forEach((p) => expect(p.name).not.toMatch(/^log-tmp-|solution-draft-log/i));
  });

  test('contributions are yearly and consistent with the total', () => {
    const years = github.contributions.map((c) => c.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    expect(github.contributions.reduce((s, c) => s + c.total, 0)).toBe(github.totals.contributions);
  });

  test('languages are sorted by repository count', () => {
    const counts = github.languages.map((l) => l.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
});

describe('scripts/build-data.cjs', () => {
  const { build, isNoise } = require('../../scripts/build-data.cjs');

  test('committed github.lino is up to date with the raw case-study data', () => {
    expect(build({ write: false })).toEqual(github);
  });

  test('isNoise only drops generated log repositories', () => {
    expect(isNoise({ name: 'log-tmp-123' })).toBe(true);
    expect(isNoise({ name: 'pr-42-solution-draft-log' })).toBe(true);
    expect(isNoise({ name: 'log-it' })).toBe(false);
    expect(isNoise({ name: 'links-notation' })).toBe(false);
    expect(isNoise({ name: 'public-logs', fullName: 'konard/public-logs' })).toBe(true);
    expect(isNoise({ name: 'public-logs', fullName: 'another/public-logs' })).toBe(false);
  });
});

describe('repositories that are not shown (issue #9)', () => {
  const {
    HIDDEN_OWNERS,
    excludedBecause,
    isBrokenFork,
    isEmptyRepository,
    readCollected,
    readHealth,
    shownRepositories,
  } = require('../../scripts/repositories.cjs');
  const health = readHealth();
  const collected = readCollected();
  const find = (name) => collected.find((r) => r.fullName === name);
  const shown = new Set(repositories.items.map((r) => r.fullName));

  test('generated logs are excluded from the displayed source catalog', () => {
    const logs = { owner: 'konard', name: 'public-logs', fullName: 'konard/public-logs' };
    const source = { owner: 'konard', name: 'log-it', fullName: 'konard/log-it' };
    expect(shownRepositories([logs, source], {}).shown).toEqual([source]);
  });

  test('every collected repository has its health facts', () => {
    expect(collected.filter((r) => !health[r.fullName])).toEqual([]);
  });

  test('organizations of no value to a visitor are hidden everywhere', () => {
    expect(HIDDEN_OWNERS).toEqual(
      expect.arrayContaining(['EfficiencyParadigm', 'Qvinciy', 'Gls-full', 'links-games', 'open-online-tools']),
    );
    expect(HIDDEN_OWNERS).toEqual(expect.arrayContaining(['Svetozar-Technologies', 'meteor-shuttler']));
    const hidden = new Set(HIDDEN_OWNERS.map((o) => o.toLowerCase()));
    expect(repositories.items.filter((r) => hidden.has(r.owner.toLowerCase()))).toEqual([]);
    expect(github.owners.filter((o) => hidden.has(o.login.toLowerCase()))).toEqual([]);
    expect(github.projects.filter((p) => hidden.has(p.owner.toLowerCase()))).toEqual([]);
    const packages = github.registries.flatMap((r) => r.top.map((p) => p.url || ''));
    expect(packages.filter((url) => HIDDEN_OWNERS.some((o) => url.includes(`github.com/${o}/`)))).toEqual([]);
  });

  test('a repository with only a short README and a license is empty (konard/TheAnime)', () => {
    expect(isEmptyRepository(health['konard/TheAnime'])).toBe(true);
    expect(excludedBecause(find('konard/TheAnime'), health['konard/TheAnime'])).toBe('empty');
    expect(isEmptyRepository({ isEmpty: true, fileCount: 0, files: {} })).toBe(true);
    // A long README is content, and so is any other file.
    expect(isEmptyRepository({ fileCount: 2, files: { 'README.md': 12696, LICENSE: 1211 } })).toBe(false);
    expect(isEmptyRepository({ fileCount: 2, files: { 'README.md': 61, 'index.js': 10 } })).toBe(false);
    expect(shown.has('konard/TheAnime')).toBe(false);
  });

  test('history started by another person before the repository existed is a broken fork (konard/slava)', () => {
    const slava = find('konard/slava');
    expect(isBrokenFork(slava, health['konard/slava'])).toBe(true);
    expect(excludedBecause(slava, health['konard/slava'])).toBe('broken fork');
    // Own history, history written by tools and teamwork in organizations are fine.
    const root = { at: '2020-01-01T00:00:00Z', author: 'someone' };
    const repo = { owner: 'konard', createdAt: '2021-01-01T00:00:00Z' };
    expect(isBrokenFork(repo, { root })).toBe(true);
    expect(isBrokenFork(repo, { root: { ...root, author: 'konard' } })).toBe(false);
    expect(isBrokenFork(repo, { root: { ...root, author: 'lovable-dev[bot]' } })).toBe(false);
    expect(isBrokenFork({ ...repo, owner: 'link-assistant' }, { root })).toBe(false);
    expect(isBrokenFork(repo, { root, upstream: { fullName: 'someone/x', public: true } })).toBe(false);
    expect(shown.has('konard/slava')).toBe(false);
  });

  test('nothing is shown about copies of projects that are not public', () => {
    const copy = { owner: 'konard', name: 'Aboba-site', fullName: 'konard/Aboba-site' };
    expect(excludedBecause(copy, { upstream: { public: false } })).toBe('original is not public');
    expect(excludedBecause(copy, {})).toBe('original is not public');
    expect(Object.values(health).filter((h) => h.upstream && !h.upstream.public && h.upstream.fullName)).toEqual([]);
    repositories.items
      .filter((r) => r.kind === 'fork')
      .forEach((r) => expect(health[r.fullName].upstream).toEqual({ fullName: r.copyOf, public: true }));
  });

  test('the website shows exactly the repositories that pass the rules', () => {
    const { shown: passed, excluded } = shownRepositories();
    expect(passed.map((r) => r.fullName).sort()).toEqual([...shown].sort());
    expect(
      Object.keys(excluded).every((reason) =>
        ['broken fork', 'deleted', 'empty', 'generated logs', 'hidden organization', 'original is not public'].includes(
          reason,
        ),
      ),
    ).toBe(true);
    // A fresh catalog need not contain a deleted repository to exercise the rule.
    expect(excludedBecause({ owner: 'konard' }, { missing: true })).toBe('deleted');
    expect(github.totals.forks).toBe(repositories.items.filter((r) => r.kind === 'fork').length);
    expect(github.totals).not.toHaveProperty('clientCopies');
  });
});

describe('scripts/repositories.cjs (issue #7)', () => {
  const { buildRepositories, kindOf, fieldsOf } = require('../../scripts/repositories.cjs');

  test('committed repositories.lino is up to date with the collected data', () => {
    expect(buildRepositories({ write: false })).toEqual(repositories);
  });

  test('forks are never collected and copies are classified', () => {
    const own = { fullName: 'konard/problem-solving', owner: 'konard', name: 'problem-solving', description: '' };
    expect(kindOf(own)).toBe('own');
    expect(kindOf({ ...own, fullName: 'konard/Aboba-site', name: 'Aboba-site' })).toBe('fork');
    expect(kindOf({ ...own, fullName: 'konard/log-tmp-1', name: 'log-tmp-1' })).toBe('noise');
    expect(kindOf({ ...own, fullName: 'konard/x_fork', name: 'x_fork' })).toBe('mirror');
    expect(kindOf({ ...own, copyOf: 'deep-foundation/deeplinks' })).toBe('mirror');
    expect(repositories.items.some((r) => r.fork)).toBe(false);
  });

  test('fields are assigned from keywords, languages and owners', () => {
    const base = { owner: 'konard', description: '', topics: [], languages: [] };
    expect(fieldsOf({ ...base, fullName: 'konard/p-vs-np', name: 'p-vs-np', language: 'Rocq' })).toContain('research');
    expect(fieldsOf({ ...base, fullName: 'linksplatform/Memory', owner: 'linksplatform', name: 'Memory' })).toContain(
      'associative',
    );
    expect(fieldsOf({ ...base, fullName: 'konard/zzz', name: 'zzz' })).toEqual(['other']);
  });

  test('own repositories match the original repository total', () => {
    const own = repositories.items.filter((r) => r.kind === 'own');
    expect(own.length).toBe(github.totals.ownRepositories);
    expect(repositories.items.every((r) => r.fields.length > 0)).toBe(true);
  });

  test('every field has a description and professions point to original repositories', () => {
    expect(fields.map((f) => f.id)).toEqual(repositories.fields);
    const own = new Set(repositories.items.filter((r) => r.kind === 'own').map((r) => r.fullName));
    const missing = professions.flatMap((p) => p.repos.map(([name]) => name)).filter((n) => !own.has(n));
    expect(missing).toEqual([]);
    professions.forEach((p) => expect(p.repos.length).toBeGreaterThanOrEqual(5));
  });
});

describe('scripts/registries.cjs (issue #7)', () => {
  const { sourceRepository } = require('../../scripts/registries.cjs');

  test('every registry with packages has a card, the empty ones are listed', () => {
    const ids = github.registries.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining(['npm', 'crates', 'nuget', 'pypi', 'dockerhub', 'github-packages', 'go']),
    );
    github.registries.forEach((r) => {
      expect(r.packages).toBeGreaterThan(0);
      expect(r.top.length).toBeGreaterThan(0);
      if (r.downloadsUnit) expect(r.downloads).toBe(Math.max(r.downloads, ...r.top.map((p) => p.downloads)));
    });
    const summary = github.packageRegistries;
    expect(summary.checked).toBe(github.registries.length + summary.empty.length + summary.onlyOthers.length);
    expect(summary.blocked.map((b) => b.id)).toEqual(['github-packages']);
  });

  test('the registries without a public listing are checked too (experiments/collect-other-registries.cjs)', () => {
    const summary = github.packageRegistries;
    expect(summary.notChecked).toEqual([]);
    expect(summary.empty).toEqual(
      expect.arrayContaining(['Hackage', 'CPAN', 'Lean Reservoir', 'Chocolatey', 'winget']),
    );
    expect(summary.checked).toBeGreaterThanOrEqual(33);
  });

  test('packages of forks, mirrors and hidden repositories are not counted', () => {
    const kinds = new Map(repositories.items.map((r) => [r.fullName.toLowerCase(), r.kind]));
    const ghcr = github.registries.find((r) => r.id === 'github-packages');
    ghcr.top.forEach((p) => expect(kinds.get(sourceRepository('github-packages', p)) ?? 'own').toBe('own'));
    expect(github.packageRegistries.droppedPackages).toBeGreaterThan(0);
  });

  test('a registry with packages of other repositories only is not listed as empty (issue #47)', () => {
    const { empty, onlyOthers } = github.packageRegistries;
    expect(onlyOthers).toContain('Homebrew taps');
    expect(empty).not.toContain('Homebrew taps');
    expect(onlyOthers.filter((name) => empty.includes(name))).toEqual([]);
  });

  test('sourceRepository reads the GitHub repository of a package', () => {
    expect(sourceRepository('npm', { repository: 'git+https://github.com/Link-Foundation/links-notation.git' })).toBe(
      'link-foundation/links-notation',
    );
    expect(sourceRepository('github-packages', { name: 'konard/some-repo/service' })).toBe('konard/some-repo');
    expect(sourceRepository('npm', { name: 'x' })).toBeNull();
  });
});
