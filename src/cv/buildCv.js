// The CV as plain data (issue #11): one function turns the site data into the
// texts of a CV for a position, a style and a language, so the /cv/ page, the
// PDF script and the tests all print the same thing.
//
// Rules from the issue: the site is the full record and a CV is a subset of
// it; a CV for a position is at most 2 pages, the compact one is 1 page; no
// phone, birth date, salary or email, contacts are GitHub, Telegram and the
// website.
import github from '../data/github.json';
import { experience, yearsText } from '../data/experience';
import { positionById, positions, practices, products } from '../data/positions';
import { achievements, education, languages, profile, publications } from '../data/profile';
import { tr } from '../i18n/prefs';

export const STYLES = ['classic', 'compact', 'technical', 'academic'];
export const POSITION_IDS = positions.map((p) => p.id);

export const STYLE_NAMES = {
  classic: { en: 'Classic', ru: 'Классический' },
  compact: { en: 'Compact (1 page)', ru: 'Компактный (1 страница)' },
  technical: { en: 'Technical', ru: 'Технический' },
  academic: { en: 'Academic', ru: 'Академический' },
};

export const LABELS = {
  profile: { en: 'Profile', ru: 'Профиль' },
  strengths: { en: 'Core strengths', ru: 'Ключевые компетенции' },
  stack: { en: 'Technical stack', ru: 'Технический стек' },
  experience: { en: 'Professional experience', ru: 'Опыт работы' },
  products: { en: 'Selected products', ru: 'Избранные продукты' },
  projects: { en: 'Projects and packages', ru: 'Проекты и пакеты' },
  practices: { en: 'How I work', ru: 'Как я работаю' },
  research: { en: 'Research and publications', ru: 'Исследования и публикации' },
  achievements: { en: 'Highlights', ru: 'Достижения' },
  education: { en: 'Education', ru: 'Образование' },
  languages: { en: 'Languages', ru: 'Языки' },
  earlier: { en: 'Earlier experience', ru: 'Ранее' },
  stackLine: { en: 'Stack', ru: 'Стек' },
  present: { en: 'present', ru: 'н. в.' },
  packages: { en: 'Packages', ru: 'Пакеты' },
};

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
};

/** 'May 2026 – present' / 'май 2026 – н. в.' */
export function formatPeriod(start, end, lang = 'en') {
  const fmt = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return `${MONTHS[lang][month - 1]} ${year}`;
  };
  return `${fmt(start)} – ${end ? fmt(end) : tr(LABELS.present, lang)}`;
}

/** Contacts printed on every CV: no phone, birth date, salary or email. */
export function cvContacts(lang = 'en') {
  const host = profile.website.replace(/^https:\/\//, '');
  return [
    {
      id: 'github',
      label: 'GitHub',
      text: `github.com/${profile.handle}`,
      url: `https://github.com/${profile.handle}`,
    },
    { id: 'telegram', label: 'Telegram', text: '@drakonard', url: 'https://t.me/drakonard' },
    { id: 'website', label: tr({ en: 'Website', ru: 'Сайт' }, lang), text: host, url: profile.website },
  ];
}

const recentFirst = (a, b) => (b.end || '9999').localeCompare(a.end || '9999') || b.start.localeCompare(a.start);

/**
 * The bullets of a job that matter for a position: bullets sharing more of
 * the position's topics (earlier topics weigh more) come first, the order of
 * the job is kept, and a job always shows at least its first bullet.
 */
export function pickBullets(job, topics, count) {
  if (count <= 0) return [];
  const weight = (bullet) =>
    bullet.topics.reduce((sum, t) => sum + (topics.includes(t) ? topics.length - topics.indexOf(t) : 0), 0);
  const scored = job.bullets.map((bullet, index) => ({ bullet, index, score: weight(bullet) }));
  const relevant = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.index - b.index);
  const chosen = (relevant.length ? relevant : scored.slice(0, 1)).slice(0, count);
  return chosen.sort((a, b) => a.index - b.index).map((s) => s.bullet);
}

const isOld = (job) => Boolean(job.end && job.end < '2015-01');

// How many bullets a job gets: older jobs say less, the compact CV says least.
function bulletCount(job, position, style, rank) {
  const old = isOld(job);
  if (style === 'compact') return rank < 5 ? 1 : 0;
  if (old) return position.id === 'all' ? 1 : Math.min(2, position.bullets);
  return position.bullets;
}

// '2006 – 2007', '2014' or '2010 – present'.
const yearSpan = (start, end, lang) =>
  end && end.slice(0, 4) === start.slice(0, 4)
    ? start.slice(0, 4)
    : `${start.slice(0, 4)} – ${end ? end.slice(0, 4) : tr(LABELS.present, lang)}`;

function job(item, position, style, lang, rank) {
  const bullets = pickBullets(item, position.topics, bulletCount(item, position, style, rank));
  return {
    id: item.id,
    company: tr(item.title, lang),
    role: tr(item.role, lang),
    period: formatPeriod(item.start, item.end, lang),
    years: yearSpan(item.start, item.end, lang),
    location: item.location ? tr(item.location, lang) : '',
    url: item.url || '',
    summary: tr(item.summary, lang),
    bullets: bullets.map((b) => tr(b, lang)),
    tags: item.tags,
  };
}

const repoUrl = (repo) => `https://github.com/${repo}`;

function product(p, lang) {
  return {
    id: p.id,
    name: p.name,
    url: repoUrl(p.repo),
    repo: p.repo,
    summary: tr(p.summary, lang),
    packages: (p.packages || []).map(([registry, url]) => ({ registry, url })),
  };
}

/** Registries with their package counts for the technical CV. */
function registries(lang) {
  const fmt = new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US');
  return github.registries
    .filter((r) => r.downloads)
    .map((r) => ({
      name: r.name,
      url: r.url,
      text:
        lang === 'ru'
          ? `${r.packages} пакетов, ${fmt.format(r.downloads)} ${r.downloadsUnit.startsWith('pulls') ? 'скачиваний образов' : 'загрузок'}${r.downloadsUnit.includes('month') ? ' в месяц' : ''}`
          : `${r.packages} packages, ${fmt.format(r.downloads)} ${r.downloadsUnit.replace(' (rounded)', '')}`,
    }));
}

/**
 * The CV of a position (`role`, `all` or unknown = all experience) in a style
 * and a language. `asOf` fixes the date for the years of experience.
 */
export function buildCv({ role = 'all', style = 'classic', lang = 'en', asOf = new Date() } = {}) {
  const position = positionById(role);
  const kind = STYLES.includes(style) ? style : 'classic';
  const t = (text) => tr(text, lang);
  const ids = new Set(position.jobs);
  const jobs = experience
    .filter((e) => ids.has(e.id))
    .sort(recentFirst)
    .map((e, rank) => job(e, position, kind, lang, rank));

  // The compact CV keeps the 5 most recent jobs, a position with more than 10
  // jobs keeps those since 2015 (to fit 2 pages), and both list the others in
  // one line; the full record keeps every job.
  const recent = experience.filter((e) => ids.has(e.id) && !isOld(e)).length;
  const keep = kind === 'compact' ? 5 : position.id !== 'all' && jobs.length > 10 ? recent : jobs.length;
  const shown = jobs.slice(0, keep);
  const earlier =
    jobs.length > keep
      ? jobs
          .slice(keep)
          .map((j) => `${j.company} (${j.years})`)
          .join(' · ')
      : '';

  const chosenPractices = practices
    .filter((p) => p.topics.some((topic) => position.topics.includes(topic)))
    .slice(0, kind === 'compact' ? 0 : 4)
    .map((p) => t(p.text));

  const byId = new Map(products.map((p) => [p.id, p]));
  const chosenProducts = position.products
    .map((id) => byId.get(id))
    .slice(0, kind === 'compact' ? 3 : 5)
    .map((p) => product(p, lang));

  return {
    lang,
    style: kind,
    role: position.id,
    tailored: position.id !== 'all',
    name: t(profile.name),
    title: t(position.title),
    location: t(profile.cvLocation),
    contacts: cvContacts(lang),
    years: yearsText(asOf)[lang],
    labels: Object.fromEntries(Object.entries(LABELS).map(([key, text]) => [key, t(text)])),
    profile: t(position.profile),
    strengths: position.strengths.map((s) => ({ label: t(s.label), items: s.items })),
    jobs: shown,
    earlier,
    products: chosenProducts,
    practices: chosenPractices,
    registries: kind === 'technical' ? registries(lang) : [],
    publications: kind === 'academic' ? publications : [],
    highlights: kind === 'academic' ? achievements.map(t) : [],
    education: education
      .filter((e) => e.id !== 'self')
      .map((e) => ({ title: t(e.title), detail: t(e.detail), period: t(e.period) })),
    languages: languages.map((l) => `${t(l.name)} — ${t(l.level)}`),
  };
}

/** Where the prebuilt PDF of a CV is published (see scripts/build-cv-pdf.mjs). */
export const pdfPath = ({ role = 'all', style = 'classic', lang = 'en' } = {}) =>
  `/cv/pdf/konstantin-diachenko-${role}-${style}-${lang}.pdf`;

/** The /cv/ page of a CV. */
export const cvPagePath = ({ role = 'all', style = 'classic', lang = 'en' } = {}) => {
  const params = new URLSearchParams();
  if (role && role !== 'all') params.set('role', role);
  if (style && style !== 'classic') params.set('style', style);
  params.set('lang', lang);
  return `/cv/?${params}`;
};
