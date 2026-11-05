import { localized } from '../i18n/localizer.js';
// Helpers shared by the pages that list repositories.
import repositories from '../data/repositories.lino';

export const allRepositories = repositories.items;
export const ownRepositories = allRepositories.filter((r) => r.kind === 'own');
const byName = new Map(allRepositories.map((r) => [r.fullName.toLowerCase(), r]));

/** Repository record by "owner/name" (case-insensitive), or null. */
export const repo = (fullName) => byName.get(fullName.toLowerCase()) || null;

export const inField = (field, list = ownRepositories) => list.filter((r) => r.fields.includes(field));

export const byStars = (a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt);

// Labels and summaries are `{ en, ru }` objects translated with useLang().t.
export const SORTS = {
  stars: { label: localized('m35c3ae25e12d'), compare: byStars },
  updated: {
    label: localized('m2645b1a5340c'),
    compare: (a, b) => b.pushedAt.localeCompare(a.pushedAt),
  },
  created: { label: localized('m924411b3fc5e'), compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  name: { label: localized('m65b06b178119'), compare: (a, b) => a.fullName.localeCompare(b.fullName) },
};

export const KINDS = {
  own: {
    label: localized('mf0a0a5e9f89b'),
    summary: localized('m6e382f1ae0ba'),
  },
  fork: {
    label: localized('m75158cf5641e'),
    summary: localized('mdda9e170e9a6'),
  },
  mirror: {
    label: localized('mad5c420287dd'),
    summary: localized('m5985e306b388'),
  },
  noise: {
    label: localized('mf896b6940ad9'),
    summary: localized('mf09a305d0777'),
  },
};

/** Case-insensitive search in name, description, topics and languages. */
export function matches(r, query) {
  if (!query) return true;
  const haystack = [r.fullName, r.description, ...(r.topics || []), ...(r.languages || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export const githubUrl = (r) => `https://github.com/${r.fullName}`;
