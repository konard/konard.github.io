import github from './github.json';
import repositories from './repositories.json';
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
    expect(profile.name).toBe('Konstantin Diachenko');
    expect(profile.handle).toBe(github.profile.login);
    expect(education.length).toBeGreaterThan(0);
  });
});

describe('generated github.json', () => {
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

  test('committed github.json is up to date with the raw case-study data', () => {
    expect(build({ write: false })).toEqual(github);
  });

  test('isNoise only drops generated log repositories', () => {
    expect(isNoise({ name: 'log-tmp-123' })).toBe(true);
    expect(isNoise({ name: 'pr-42-solution-draft-log' })).toBe(true);
    expect(isNoise({ name: 'log-it' })).toBe(false);
    expect(isNoise({ name: 'links-notation' })).toBe(false);
  });
});

describe('scripts/repositories.cjs (issue #7)', () => {
  const { buildRepositories, kindOf, fieldsOf, readCollected } = require('../../scripts/repositories.cjs');

  test('committed repositories.json is up to date with the collected data', () => {
    expect(buildRepositories({ write: false, repos: readCollected() })).toEqual(repositories);
  });

  test('forks are never collected and copies are classified', () => {
    const own = { fullName: 'konard/problem-solving', owner: 'konard', name: 'problem-solving', description: '' };
    expect(kindOf(own)).toBe('own');
    expect(kindOf({ ...own, fullName: 'konard/Aboba-site', name: 'Aboba-site' })).toBe('client');
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
    expect(summary.checked).toBe(github.registries.length + summary.empty.length);
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

  test('packages of client copies are not counted', () => {
    const kinds = new Map(repositories.items.map((r) => [r.fullName.toLowerCase(), r.kind]));
    const ghcr = github.registries.find((r) => r.id === 'github-packages');
    ghcr.top.forEach((p) => expect(kinds.get(sourceRepository('github-packages', p)) ?? 'own').toBe('own'));
    expect(github.packageRegistries.droppedPackages).toBeGreaterThan(0);
  });

  test('sourceRepository reads the GitHub repository of a package', () => {
    expect(sourceRepository('npm', { repository: 'git+https://github.com/Link-Foundation/links-notation.git' })).toBe(
      'link-foundation/links-notation',
    );
    expect(sourceRepository('github-packages', { name: 'konard/some-repo/service' })).toBe('konard/some-repo');
    expect(sourceRepository('npm', { name: 'x' })).toBeNull();
  });
});
