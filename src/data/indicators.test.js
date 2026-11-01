import fs from 'node:fs';
import path from 'node:path';
import { decode } from 'lino-objects-codec';
import indicators from './indicators.lino';
import repositories from './repositories.lino';
const dir = 'docs/case-studies/issue-33/data/';
const read = (file) => JSON.parse(fs.readFileSync(dir + file + '.json', 'utf8'));

it('rebuilds the website social fallback from the dated public archive', () => {
  const writes = new Map();
  const writer = vi.spyOn(fs, 'writeFileSync').mockImplementation((file, value) => writes.set(file, value));
  try {
    require('../../scripts/build-data.cjs').build();
    const archive = writes.get(path.resolve('src/data/posts.lino'));
    expect(archive).toBeTypeOf('string');
    expect(decode({ notation: archive })).toEqual(read('posts'));
    expect(fs.readFileSync('src/data/posts.lino', 'utf8')).toBe(archive);
  } finally {
    writer.mockRestore();
  }
});

describe('public source-line snapshot coverage', () => {
  it('has a measured revision and every language for each displayed repository', () => {
    const measured = read('source-lines').repositories;
    const missing = repositories.items.filter(
      (r) =>
        !measured[r.fullName] ||
        !r.sourceCollectedAt ||
        !r.sourceLines ||
        (!r.sourceSha && Object.keys(r.sourceLines).length),
    );
    expect(missing.map((r) => r.fullName)).toEqual([]);
    for (const repo of repositories.items) {
      expect(measured[repo.fullName].sourceLinesScope).toBe('whole-repository');
      for (const counts of Object.values(repo.sourceLines)) {
        expect(Object.keys(counts).sort()).toEqual(['blank', 'code', 'comment']);
        expect(Object.values(counts).every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
      }
    }
  });

  it('includes outside projects and derives totals from the preserved measurements', () => {
    const source = read('source-lines');
    const ownedAccounts = new Set(read('public-inventory').repositories.map((r) => r.fullName.split('/')[0]));
    expect(indicators.sourceLines.authoredRepositories.some((r) => !ownedAccounts.has(r.fullName.split('/')[0]))).toBe(
      true,
    );
    const languages = {};
    const excluded = new Set(indicators.sourceLines.excludedRepositories.map((r) => r.fullName));
    for (const [name, r] of Object.entries(source.repositories)) {
      if (excluded.has(name)) continue;
      for (const [language, n] of Object.entries(r.authoredLines)) languages[language] = (languages[language] || 0) + n;
    }
    expect(indicators.sourceLines.languages).toEqual(languages);
    expect(languages).not.toHaveProperty('diff');
    expect(indicators.sourceLines.authoredRepositories.reduce((sum, r) => sum + r.lines, 0)).toBe(
      Object.values(languages).reduce((sum, n) => sum + n, 0),
    );
    expect(indicators.sourceLines.measuredRepositories).toBe(Object.keys(source.repositories).length);
    expect(source.errors).toEqual({});
  });

  it('covers every non-noise public catalog repository, including forks', () => {
    const source = read('source-lines');
    const inventory = read('public-inventory');
    const required = inventory.repositories.filter((r) => !r.generatedNoise);
    expect(required.some((r) => r.fork)).toBe(true);
    expect(required.filter((r) => !source.repositories[r.fullName]).map((r) => r.fullName)).toEqual([]);
    expect(Object.keys(source.repositories).length).toBe(source.requestedRepositories);
    for (const measurement of Object.values(source.repositories)) {
      expect(['whole-repository', 'authorship-candidates']).toContain(measurement.sourceLinesScope);
      if (measurement.empty) expect(measurement.emptyCheck).toBe('git ls-remote HEAD');
    }
    const audit = read('associative-audit');
    expect(audit.inventory.map((r) => r.fullName).sort()).toEqual(inventory.repositories.map((r) => r.fullName).sort());
  });
});

it('keeps vendored third-party code out of the attributed totals (issue #47)', () => {
  const source = read('source-lines');
  const twin = 'PavelChurkin/digital_twin_Earth';
  const [entry] = indicators.sourceLines.excludedRepositories;
  expect(entry).toMatchObject({ fullName: twin, sha: source.repositories[twin].sha, lines: 2235588 });
  expect(entry.reason.en).toMatch(/CesiumJS/);
  expect(entry.reason.ru).toMatch(/CesiumJS/);
  expect(indicators.sourceLines.authoredRepositories.map((r) => r.fullName)).not.toContain(twin);
  const withTwin = Object.values(source.repositories).reduce((sum, r) => sum + (r.authoredLines.JavaScript || 0), 0);
  expect(indicators.sourceLines.languages.JavaScript).toBe(
    withTwin - source.repositories[twin].authoredLines.JavaScript,
  );
});

it('links each reported runtime omission to a repository in the public audit', () => {
  const audit = read('associative-audit');
  const names = new Set(audit.inventory.map((r) => r.fullName));
  expect(audit.runtimeOmissions.filter((name) => !names.has(name))).toEqual([]);
});

it('rebuilds the same indicator file from dated public evidence', () => {
  const { buildIndicators } = require('../../scripts/build-indicators.cjs');
  expect(buildIndicators({ write: false })).toEqual(indicators);
  expect(Object.values(indicators.sources).every((s) => Number.isFinite(+new Date(s.effectiveAt)))).toBe(true);
  const days = indicators.contributions.calendar.weeks.flatMap((w) => w.contributionDays);
  expect(days.length).toBeGreaterThanOrEqual(365);
  expect(days.reduce((sum, d) => sum + d.contributionCount, 0)).toBe(
    indicators.contributions.calendar.totalContributions,
  );
  expect(read('contributions').calendar.restrictedContributionsCount).toBeGreaterThan(0);
  const profile = read('public-profile-calendar');
  const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  expect(
    days.map((d) => ({ date: d.date, count: d.contributionCount, level: levels.indexOf(d.contributionLevel) })),
  ).toEqual(profile.days);
  expect(JSON.stringify(indicators.contributions)).not.toMatch(/nameWithOwner|isPrivate|repositoryName|author-mail/);
});
