import { buildStats } from './StatTiles';
import { topWithOther } from './LanguagesChart';
import { mergeProjects } from './Projects';
import { formatPeriod, toYear } from './Timeline';
import { contributionScale } from './ContributionsChart';
import { formatCompact, formatNumber, formatPercent, SERIES } from './format';
import github from '../data/github.json';

describe('format', () => {
  test('formats numbers', () => {
    expect(formatNumber(132002)).toBe('132,002');
    expect(formatCompact(132002)).toBe('132K');
    expect(formatCompact(1917488)).toBe('1.9M');
    expect(formatPercent(0.256)).toBe('26%');
  });

  test('categorical palette has 8 fixed slots', () => {
    expect(SERIES).toHaveLength(8);
    expect(new Set(SERIES).size).toBe(8);
  });
});

describe('buildStats', () => {
  test('derives tiles from github data', () => {
    const stats = buildStats(github, 2000, new Date('2026-10-16'));
    const byId = Object.fromEntries(stats.map((s) => [s.id, s]));
    expect(stats).toHaveLength(8);
    expect(byId.years.value).toBe(26);
    expect(byId.contributions.value).toBe(github.totals.contributions);
    expect(byId.packages.value).toBe(github.registries.reduce((s, r) => s + r.packages, 0));
    // npm reports monthly downloads, so only lifetime totals are summed.
    const lifetime = github.registries.filter((r) => r.downloadsUnit === 'downloads total');
    expect(byId.downloads.value).toBe(lifetime.reduce((s, r) => s + r.downloads, 0));
    stats.forEach((s) => expect(Number.isFinite(s.value)).toBe(true));
  });
});

describe('topWithOther', () => {
  const langs = [
    { name: 'A', count: 5 },
    { name: 'B', count: 3 },
    { name: 'C', count: 2 },
    { name: 'D', count: 1 },
  ];

  test('folds the tail into Other', () => {
    expect(topWithOther(langs, 2)).toEqual([
      { name: 'A', count: 5 },
      { name: 'B', count: 3 },
      { name: 'Other', count: 3, isOther: true },
    ]);
  });

  test('no Other row when everything fits', () => {
    expect(topWithOther(langs, 10)).toEqual(langs);
  });
});

describe('mergeProjects', () => {
  test('keeps featured order and fills defaults for unknown repos', () => {
    const merged = mergeProjects(
      [
        { fullName: 'org/b', tagline: 'B' },
        { fullName: 'org/a', tagline: 'A' },
      ],
      [{ fullName: 'org/a', name: 'a', owner: 'org', stars: 7, language: 'Rust', url: 'https://github.com/org/a' }],
    );
    expect(merged.map((p) => p.fullName)).toEqual(['org/b', 'org/a']);
    expect(merged[0]).toMatchObject({ name: 'b', owner: 'org', stars: 0, url: 'https://github.com/org/b', tagline: 'B' });
    expect(merged[1]).toMatchObject({ stars: 7, language: 'Rust', tagline: 'A' });
  });
});

describe('timeline helpers', () => {
  test('toYear converts YYYY-MM to fractional years', () => {
    expect(toYear('2015-01')).toBe(2015);
    expect(toYear('2015-07')).toBeCloseTo(2015.5);
  });

  test('formatPeriod renders open-ended periods', () => {
    expect(formatPeriod('2006-11', '2007-08')).toBe('Nov 2006 – Aug 2007');
    expect(formatPeriod('2024-07', null)).toBe('Jul 2024 – present');
  });
});

describe('contributionScale', () => {
  test('linear scale maps max to full height', () => {
    const y = contributionScale('linear', 100, 200);
    expect(y(0)).toBe(0);
    expect(y(50)).toBe(100);
    expect(y(100)).toBe(200);
  });

  test('log scale is monotonic and keeps small years visible', () => {
    const y = contributionScale('log', 30000, 200);
    expect(y(0)).toBe(0);
    expect(y(30000)).toBeCloseTo(200);
    expect(y(10)).toBeGreaterThan(200 * 0.2);
    expect(y(100)).toBeGreaterThan(y(10));
  });
});
