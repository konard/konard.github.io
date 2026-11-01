// Figures quoted inside hand-written texts (issue #47): repository counts and
// package downloads are read from src/data/github.json, the same data the stat
// tiles and the registries section show, so the texts cannot go stale.
import github from './github.json';
import { plural } from '../i18n/plural';

const LOCALES = { en: 'en-US', ru: 'ru-RU' };
// Two significant digits are enough for a figure in a sentence: 78,703 is "79K".
const compact = (value, lang) =>
  new Intl.NumberFormat(LOCALES[lang], { notation: 'compact', maximumSignificantDigits: 2 }).format(value);
const both = (text) => ({ en: text('en'), ru: text('ru') });

/** Rounds `value` down to two significant digits, so "N+" stays true: 637,350 → 630,000. */
export function floorTwoDigits(value) {
  if (value < 100) return Math.floor(value);
  const step = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.floor(value / step) * step;
}

/** A rounded figure: { en: '≈79K', ru: 'около 79 тыс.' }. */
export const about = (value) => ({ en: `≈${compact(value, 'en')}`, ru: `около ${compact(value, 'ru')}` });

/** A lower bound: { en: '630K+', ru: 'более 630 тыс.' }. */
export const atLeast = (value) => ({
  en: `${compact(floorTwoDigits(value), 'en')}+`,
  ru: `более ${compact(floorTwoDigits(value), 'ru')}`,
});

export const registry = (id) => github.registries.find((r) => r.id === id);

/** Monthly npm downloads of a package, as the registries section shows them. */
export function npmMonthly(name) {
  const pkg = registry('npm').top.find((p) => p.name === name);
  if (!pkg) throw new Error(`${name} is not among the top npm packages in src/data/github.json`);
  const value = about(pkg.downloads);
  return { en: `${value.en} npm downloads per month`, ru: `${value.ru} загрузок из npm в месяц` };
}

const CRATES = { en: ['crate', 'crates'], ru: ['крейт', 'крейта', 'крейтов'] };
const crates = registry('crates');
/** { en: '36 crates', ru: '36 крейтов' }. */
export const crateCount = both((lang) => `${crates.packages} ${plural(crates.packages, lang, CRATES)}`);
/** { en: '630K+ downloads', ru: 'более 630 тыс. загрузок' }. */
export const crateDownloads = {
  en: `${atLeast(crates.downloads).en} downloads`,
  ru: `${atLeast(crates.downloads).ru} загрузок`,
};

const { ownRepositories, organizations } = github.totals;
const REPOSITORIES = {
  en: ['original open-source repository', 'original open-source repositories'],
  ru: [
    'собственный open-source-репозиторий',
    'собственных open-source-репозитория',
    'собственных open-source-репозиториев',
  ],
};
// «в N организациях»: the prepositional case after «в».
const ORGANIZATIONS = { en: ['organization', 'organizations'], ru: ['организации', 'организациях', 'организациях'] };
/** The original repositories of the personal account and the organizations (the stat tiles show the same totals). */
export const ownRepositoriesText = {
  en: `${ownRepositories} ${plural(ownRepositories, 'en', REPOSITORIES)} in ${organizations} ${plural(organizations, 'en', ORGANIZATIONS)} and the personal account, without forks or mirrors`,
  ru: `${ownRepositories} ${plural(ownRepositories, 'ru', REPOSITORIES)} в ${organizations} ${plural(organizations, 'ru', ORGANIZATIONS)} и личном аккаунте, без форков и зеркал`,
};
