import { chooseSelect } from '../test/select';
// Acceptance tests of issue #11 for the CV: every position × style × language
// renders, holds no private data and only the jobs of its position.
import { renderToStaticMarkup } from 'react-dom/server';
import { act, render, screen } from '@testing-library/react';
import github from '../data/github.json';
import { experience } from '../data/experience';
import { plural } from '../i18n/plural';
import { positions } from '../data/positions';
import { setLang } from '../i18n/prefs';
import CvPage from '../pages/CvPage';
import CvDocument from './CvDocument';
import { POSITION_IDS, STYLES, buildCv, cvPagePath, formatPeriod, pdfPath, pickBullets } from './buildCv';

const AS_OF = new Date('2026-10-22');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const combos = POSITION_IDS.flatMap((role) =>
  STYLES.flatMap((style) => ['en', 'ru'].map((lang) => [role, style, lang])),
);

describe('buildCv', () => {
  test('there are 15 CV positions in 4 styles and 2 languages', () => {
    expect(POSITION_IDS).toHaveLength(15);
    expect(STYLES).toEqual(['classic', 'compact', 'technical', 'academic']);
    expect(combos).toHaveLength(120);
  });

  test.each(combos)('%s · %s · %s renders a complete CV without private data', (role, style, lang) => {
    const cv = buildCv({ role, style, lang, asOf: AS_OF });
    const html = renderToStaticMarkup(<CvDocument cv={cv} />);
    const plain = text(html);
    expect(plain).not.toMatch(/undefined|\[object Object\]|NaN|null/);
    // No phone, birth date, salary or email (issue #11).
    expect(plain).not.toMatch(/\+\d[\d\s()-]{7,}|@gmail|mailto:|proton\.me/i);
    expect(plain).not.toMatch(/born|birth|рожден|salary|зарплат|₽|\$\s?\d/i);
    // Contacts: GitHub, Telegram nick and the website.
    expect(plain).toContain('github.com/konard');
    expect(plain).toContain('@drakonard');
    expect(plain).toContain('konard.github.io');
    expect(plain).toContain(lang === 'ru' ? 'Опыт работы' : 'Professional experience');
    expect(plain).toContain(lang === 'ru' ? 'Образование' : 'Education');
    const name = lang === 'ru' ? 'Константин Дьяченко' : 'Konstantin Diachenko';
    expect(plain).toContain(style === 'classic' || style === 'compact' ? name.toUpperCase() : name);
    if (lang === 'ru') expect(cv.profile).toMatch(/[а-я]/);
    // One column of text: no tables or images for an ATS parser to trip over.
    expect(html).not.toMatch(/<(table|img|svg|canvas)/);
  });

  test('without a position the CV is the full record, with a position only its jobs', () => {
    const all = buildCv({ asOf: AS_OF });
    expect(all.tailored).toBe(false);
    expect(all.jobs.map((j) => j.id).sort()).toEqual(experience.map((e) => e.id).sort());
    positions.forEach((p) => {
      const cv = buildCv({ role: p.id, asOf: AS_OF });
      const listed = experience.filter((e) => cv.earlier.includes(`${e.title.en} (`)).map((e) => e.id);
      expect([...cv.jobs.map((j) => j.id), ...listed].sort()).toEqual([...p.jobs].sort());
      expect(cv.title).toBe(p.title.en);
    });
    expect(buildCv({ role: 'nonsense' }).role).toBe('all');
  });

  test('jobs are most recent first and the current job is Evirma', () => {
    const cv = buildCv({ role: 'techlead', asOf: AS_OF });
    expect(cv.jobs[0]).toMatchObject({ id: 'evirma', role: 'Tech Lead', period: 'May 2026 – present' });
    expect(buildCv({ role: 'techlead', lang: 'ru' }).jobs[0].period).toBe('май 2026 – н. в.');
  });

  test('a position with more than 10 jobs lists the jobs before 2015 in one line to fit 2 pages', () => {
    const cv = buildCv({ role: 'developer', asOf: AS_OF });
    expect(cv.jobs.every((j) => !/20(0\d|1[0-4])$/.test(j.years))).toBe(true);
    expect(cv.earlier).toMatch(/ELAR.*ArtBridge \(2006 – 2007\)/);
    expect(buildCv({ role: 'all', asOf: AS_OF }).earlier).toBe('');
    expect(buildCv({ role: 'rust', asOf: AS_OF }).earlier).toBe('');
  });

  test('the compact CV keeps 5 jobs with one bullet and lists the rest in one line', () => {
    const cv = buildCv({ style: 'compact', asOf: AS_OF });
    expect(cv.jobs).toHaveLength(5);
    cv.jobs.forEach((j) => expect(j.bullets.length).toBeLessThanOrEqual(1));
    expect(cv.earlier).toMatch(/ArtBridge \(2006 – 2007\)/);
    expect(cv.practices).toEqual([]);
  });

  test('the technical CV links repositories and packages, the academic one lists publications', () => {
    const technical = text(renderToStaticMarkup(<CvDocument cv={buildCv({ role: 'rust', style: 'technical' })} />));
    expect(technical).toContain('github.com/linksplatform/Data.Doublets');
    expect(technical).toContain('crates.io');
    expect(technical).toMatch(/Stack: .*Rust/);
    const academic = buildCv({ role: 'research', style: 'academic' });
    expect(academic.publications.length).toBeGreaterThan(0);
    expect(academic.highlights.length).toBeGreaterThan(0);
  });

  test('the registries line uses Russian plural forms and keeps the rounding note (issue #47)', () => {
    const PACKAGES = { en: ['package', 'packages'], ru: ['пакет', 'пакета', 'пакетов'] };
    expect([62, 224, 36].map((n) => plural(n, 'ru', PACKAGES))).toEqual(['пакета', 'пакета', 'пакетов']);
    const lines = (lang) => buildCv({ role: 'rust', style: 'technical', lang }).registries;
    const counted = github.registries.filter((r) => r.downloads);
    expect(lines('ru').map((r) => r.text.split(',')[0])).toEqual(
      counted.map((r) => `${r.packages} ${plural(r.packages, 'ru', PACKAGES)}`),
    );
    const rounded = counted.find((r) => r.downloadsUnit.includes('(rounded)')).name;
    expect(lines('ru').find((r) => r.name === rounded).text).toMatch(/загрузок \(округлённо\)$/);
    expect(lines('en').find((r) => r.name === rounded).text).toMatch(/downloads total \(rounded\)$/);
  });

  test('pickBullets prefers the topics of the position and always keeps one bullet', () => {
    const job = {
      bullets: [
        { en: 'a', topics: ['frontend'] },
        { en: 'b', topics: ['ai'] },
        { en: 'c', topics: ['devops', 'ai'] },
      ],
    };
    expect(pickBullets(job, ['ai', 'devops'], 1).map((b) => b.en)).toEqual(['c']);
    expect(pickBullets(job, ['ai', 'devops'], 2).map((b) => b.en)).toEqual(['b', 'c']);
    expect(pickBullets(job, ['research'], 3).map((b) => b.en)).toEqual(['a']);
    expect(pickBullets(job, ['ai'], 0)).toEqual([]);
  });

  test('periods, PDF names and page links', () => {
    expect(formatPeriod('2024-07', '2025-11')).toBe('Jul 2024 – Nov 2025');
    expect(formatPeriod('2024-07', null, 'ru')).toBe('июль 2024 – н. в.');
    expect(pdfPath({ role: 'rust', style: 'compact', lang: 'ru' })).toBe(
      '/cv/pdf/konstantin-diachenko-rust-compact-ru.pdf',
    );
    expect(cvPagePath({ role: 'all', style: 'classic', lang: 'en' })).toBe('/cv/?lang=en');
    expect(cvPagePath({ role: 'ml', style: 'technical', lang: 'ru' })).toBe('/cv/?role=ml&style=technical&lang=ru');
  });
});

describe('CV page', () => {
  test('choosing a position and a style updates the CV, the PDF link and the address', () => {
    window.history.replaceState(null, '', '/cv/?role=backend');
    render(<CvPage />);
    expect(document.querySelector('.cv').dataset.cvRole).toBe('backend');
    expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
      'href',
      '/cv/pdf/konstantin-diachenko-backend-classic-en.pdf',
    );
    chooseSelect(screen.getByLabelText('Style'), 'compact');
    chooseSelect(screen.getByLabelText('Position'), 'rust');
    expect(window.location.search).toBe('?role=rust&style=compact');
    expect(document.querySelector('.cv').dataset.cvStyle).toBe('compact');
    expect(screen.getByRole('heading', { level: 1, name: 'KONSTANTIN DIACHENKO' })).toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });

  test('the CV follows the language of the site', () => {
    window.history.replaceState(null, '', '/cv/');
    render(<CvPage />);
    act(() => setLang('ru', { save: false }));
    expect(screen.getByRole('heading', { name: 'Скачать резюме' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Опыт работы' })).toBeInTheDocument();
    expect(document.querySelector('.cv')).toHaveAttribute('lang', 'ru');
    window.history.replaceState(null, '', '/');
  });
});
