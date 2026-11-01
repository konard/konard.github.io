// Acceptance tests of issue #11 for the career data: every job is complete,
// every text has both languages and every position points to existing data.
import { TOPICS, experience, experienceMonths, experienceYears, missingFields, yearsText } from './experience';
import { positions, practices, products } from './positions';
import { achievements, education, featuredProjects, languages, profile, skillGroups } from './profile';
import { professions } from './fields';
import repositories from './repositories.lino';

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const BASE_ROLES = ['ml', 'devops', 'lead', 'developer', 'research'];
const job = (id) => experience.find((e) => e.id === id);

/** Paths of `{ en }` texts without a non-empty `ru` (or the other way round) anywhere inside `value`. */
export function untranslated(value, path = '') {
  if (Array.isArray(value)) return value.flatMap((v, i) => untranslated(v, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return [];
  if ('en' in value || 'ru' in value) {
    const ok = ['en', 'ru'].every((l) => typeof value[l] === 'string' && value[l].trim() !== '');
    return ok ? [] : [path || '(root)'];
  }
  return Object.entries(value).flatMap(([key, v]) => untranslated(v, path ? `${path}.${key}` : key));
}

describe('experience: every job is complete (issue #11)', () => {
  test.each(experience.map((e) => [e.id, e]))('%s has a role, dates, summary, bullets and tags', (_, e) => {
    expect(missingFields(e)).toEqual([]);
    expect(['company', 'open-source']).toContain(e.type);
    expect(e.start).toMatch(YM);
    if (e.end) {
      expect(e.end).toMatch(YM);
      expect(e.end >= e.start).toBe(true);
    }
    expect(e.summary.en.length).toBeGreaterThan(20);
    expect(e.tags.length).toBeGreaterThan(0);
    expect(e.bullets.length).toBeGreaterThan(0);
    e.bullets.forEach((b) => {
      expect(b.topics.length).toBeGreaterThan(0);
      b.topics.forEach((t) => expect(TOPICS).toContain(t));
    });
    expect(e.roles.length).toBeGreaterThan(0);
    e.roles.forEach((r) => expect(BASE_ROLES).toContain(r));
    if (e.url) expect(e.url).toMatch(/^https:\/\//);
  });

  test('the ids are unique and the timeline is ordered by start date', () => {
    expect(new Set(experience.map((e) => e.id)).size).toBe(experience.length);
    const starts = experience.map((e) => e.start);
    expect(starts).toEqual([...starts].sort());
  });

  test('a job without a role, dates, summary or tags fails the check', () => {
    const kaiten = job('kaiten');
    expect(missingFields({ ...kaiten, role: undefined })).toEqual(['role']);
    expect(missingFields({ ...kaiten, start: '' })).toEqual(['dates']);
    expect(missingFields({ ...kaiten, summary: { en: 'Only English' } })).toEqual(['summary']);
    expect(missingFields({ ...kaiten, tags: [] })).toEqual(['tags']);
    expect(missingFields({ id: 'x' })).toEqual(['title', 'role', 'dates', 'summary', 'bullets', 'tags', 'roles']);
  });

  test('the facts from the hh.ru CV are on the site', () => {
    expect(job('evirma')).toMatchObject({ start: '2026-05', end: null, role: { en: 'Tech Lead' } });
    expect(job('evirma').roles).toEqual(expect.arrayContaining(['lead', 'ml', 'devops', 'developer']));
    expect(job('evirma').tags).toEqual(expect.arrayContaining(['PHP', 'Go', 'AI agents', 'CI/CD']));
    expect(job('capico')).toMatchObject({ start: '2025-11', end: '2026-05', role: { en: 'Senior Software Engineer' } });
    expect(job('capico').location.en).toMatch(/Tbilisi/);
    expect(job('capico').tags).toEqual(
      expect.arrayContaining(['Rust', 'Vue.js', 'PostgreSQL', 'InfluxDB', 'Redis', 'TradingView', 'GitLab CI/CD']),
    );
    expect(job('kaiten')).toMatchObject({ start: '2024-07', end: '2025-11', role: { en: 'Development Team Lead' } });
    expect(job('kaiten').roles).toContain('lead');
    expect(job('deep-foundation').start).toBe('2022-09');
    expect(job('deep-foundation').summary.en).toMatch(/2020/);
    expect(job('linksplatform')).toMatchObject({ start: '2010-03', end: null });
    expect(job('pegas').location.en).toMatch(/Tel Aviv/);
    expect(job('artbridge').role.en).toBe('Web Developer');
    expect(job('elar').summary.ru).toMatch(/«Архив»/);
    expect(job('termika').summary.en).toMatch(/Rosneft/);
  });

  test('Russian legal names of companies are used in Russian', () => {
    expect(job('termika').title.ru).toBe('ЗАО «Термика»');
    expect(job('elar').title.ru).toBe('АО «ЭЛАР»');
    expect(job('abracar').title.ru).toMatch(/^ООО «Абракар»/);
  });

  test('the total professional experience is 18 years (October 2026)', () => {
    expect(experienceYears(experience, new Date('2026-10-22'))).toBe(18);
    expect(experienceMonths(experience, new Date('2026-10-22'))).toBeGreaterThanOrEqual(18 * 12);
    expect(yearsText(new Date('2026-10-22'))).toEqual({ en: '18 years', ru: '18 лет' });
    expect(yearsText(new Date('2029-10-22')).ru).toBe('21 год');
    expect(yearsText(new Date('2030-10-22')).ru).toBe('22 года');
  });
});

describe('positions (issue #11)', () => {
  const ids = positions.map((p) => p.id);
  const skillIds = new Set(skillGroups.map((g) => g.id));
  const professionIds = new Set(professions.map((p) => p.id));
  const productIds = new Set(products.map((p) => p.id));

  test('the old roles stay and the new positions are added', () => {
    expect(ids).toEqual(
      expect.arrayContaining([
        'all',
        ...BASE_ROLES,
        'techlead',
        'cto',
        'backend',
        'fullstack',
        'dotnet',
        'rust',
        'ai-agents',
        'trading',
        'data',
      ]),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(positions.map((p) => [p.id, p]))('%s has titles, a summary, jobs, skills and CV texts', (_, p) => {
    expect(p.name.en && p.title.en && p.summary.en && p.profile.en).toBeTruthy();
    expect(p.jobs.length).toBeGreaterThan(0);
    p.jobs.forEach((id) => expect(job(id)).toBeDefined());
    expect(p.topics.length).toBeGreaterThan(0);
    p.topics.forEach((t) => expect(TOPICS).toContain(t));
    if (p.id !== 'all') {
      expect(p.skills.length).toBeGreaterThan(0);
      p.skills.forEach((s) => expect(skillIds.has(s)).toBe(true));
      p.professions.forEach((s) => expect(professionIds.has(s)).toBe(true));
    }
    expect(p.strengths.length).toBeGreaterThan(0);
    p.products.forEach((id) => expect(productIds.has(id)).toBe(true));
    expect(untranslated(p)).toEqual([]);
  });

  test('a base position lists exactly the jobs that have its role', () => {
    BASE_ROLES.forEach((role) => {
      const position = positions.find((p) => p.id === role);
      expect(position.jobs).toEqual(experience.filter((e) => e.roles.includes(role)).map((e) => e.id));
    });
  });

  test('products point to collected repositories', () => {
    const known = new Set(repositories.items.map((r) => r.fullName.toLowerCase()));
    products.forEach((p) => expect(known.has(p.repo.toLowerCase())).toBe(true));
    products.forEach((p) => (p.packages || []).forEach(([, url]) => expect(url).toMatch(/^https:\/\//)));
    practices.forEach((p) => p.topics.forEach((t) => expect(TOPICS).toContain(t)));
  });
});

describe('every text has English and Russian (issue #11)', () => {
  test('untranslated finds missing languages', () => {
    expect(untranslated({ a: { en: 'x', ru: 'y' }, b: [{ en: 'x' }], c: { ru: 'y', en: ' ' } })).toEqual(['b[0]', 'c']);
  });

  test.each([
    ['experience', experience],
    ['positions', positions],
    ['products', products],
    ['practices', practices],
    ['profile', profile],
    ['languages', languages],
    ['education', education],
    ['achievements', achievements],
    ['featuredProjects', featuredProjects],
    ['skillGroups', skillGroups],
  ])('%s', (_, data) => {
    expect(untranslated(data)).toEqual([]);
  });

  test('spoken languages and education of the hh.ru CV', () => {
    expect(languages.map((l) => [l.id, l.level.en])).toEqual([
      ['ru', 'native'],
      ['en', 'C1 — advanced'],
    ]);
    expect(education.map((e) => e.id)).toEqual(expect.arrayContaining(['mephi', 'mirea', 'digital-office']));
    expect(education.find((e) => e.id === 'digital-office').detail.ru).toMatch(/1С:Документооборот/);
  });
});
