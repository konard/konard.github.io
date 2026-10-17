import github from './github.json';
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
