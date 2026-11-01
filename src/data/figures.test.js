import github from './github.lino';
import { experience } from './experience';
import { about, atLeast, crateCount, crateDownloads, floorTwoDigits, npmMonthly, ownRepositoriesText } from './figures';
import { products, positions } from './positions';
import { achievements, featuredProjects } from './profile';

// Issue #47: the figures inside hand-written texts must match the generated data.
const npm = (name) => github.registries.find((r) => r.id === 'npm').top.find((p) => p.name === name).downloads;
const crates = github.registries.find((r) => r.id === 'crates');
const texts = (list) => list.flatMap((t) => [t.en, t.ru]);

describe('figures quoted in texts (issue #47)', () => {
  it('rounds to two significant digits, and down for lower bounds', () => {
    expect(about(78703).en).toBe('≈79K');
    expect(about(33876).en).toBe('≈34K');
    expect(about(78703).ru).toMatch(/^около 79\sтыс\.$/);
    expect(floorTwoDigits(637350)).toBe(630000);
    expect(floorTwoDigits(99)).toBe(99);
    expect(atLeast(637350).en).toBe('630K+');
    expect(atLeast(637350).ru).toMatch(/^более 630\sтыс\.$/);
  });

  it('reads the npm, crates and repository figures from github.lino', () => {
    expect(npmMonthly('links-notation').en).toBe(`${about(npm('links-notation')).en} npm downloads per month`);
    expect(npmMonthly('command-stream').ru).toBe(`${about(npm('command-stream')).ru} загрузок из npm в месяц`);
    expect(() => npmMonthly('no-such-package')).toThrow();
    expect(crateCount.en).toBe(`${crates.packages} crates`);
    expect(crateDownloads.en).toBe(`${atLeast(crates.downloads).en} downloads`);
    const { ownRepositories, organizations } = github.totals;
    expect(ownRepositoriesText.en).toMatch(
      new RegExp(`^${ownRepositories} original .* in ${organizations} organizations`),
    );
    expect(ownRepositoriesText.ru).toMatch(
      new RegExp(`^${ownRepositories} собственных .* в ${organizations} организациях`),
    );
  });

  it('uses them in the profile, the positions and the experience', () => {
    expect(achievements).toContain(ownRepositoriesText);
    const notation = featuredProjects.find((p) => p.fullName === 'link-foundation/links-notation').tagline;
    expect(notation.en).toContain(npmMonthly('links-notation').en);
    expect(products.find((p) => p.id === 'links-notation').summary.ru).toContain(npmMonthly('links-notation').ru);
    expect(products.find((p) => p.id === 'command-stream').summary.en).toContain(npmMonthly('command-stream').en);
    const rust = positions.find((p) => p.id === 'rust');
    expect(rust.profile.en).toContain(`${crateCount.en} on crates.io (${crateDownloads.en})`);
    expect(rust.strengths.flatMap((s) => s.items ?? [])).toContain(`crates.io (${crateCount.en})`);
    const bullets = experience.flatMap((job) => job.bullets ?? []);
    expect(texts(bullets).some((t) => t.includes(npmMonthly('links-notation').ru))).toBe(true);
  });

  it('leaves none of the stale figures behind', () => {
    const all = [...achievements, ...featuredProjects.map((p) => p.tagline), ...products.map((p) => p.summary)];
    const stale =
      /525 |15 organi|15 организ|50K npm|50 тыс\. загрузок|31K npm|31 тыс\.|35 crates|35 крейт|570K|570 тыс/;
    const positionTexts = positions.flatMap((p) => [p.profile, p.summary].filter(Boolean));
    expect(texts([...all, ...positionTexts, ...experience.flatMap((job) => job.bullets ?? [])])).not.toContainEqual(
      expect.stringMatching(stale),
    );
  });
});
