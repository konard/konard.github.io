import {
  classCount as countClasses,
  codeAt,
  count,
  decode,
  encode,
  formatPairs,
  indexOf as exactIndex,
  randomCode as sampleDigits,
  relabel as rename,
  representatives as classRepresentatives,
} from '@link-foundation/ui-components/links-view/configurations';

export { canonical, codeAt, decode, encode } from '@link-foundation/ui-components/links-view/configurations';

export const baseOf = (n) => n + 1;
export const networkCount = (n, options) => Number(count(n, options));
export const classCount = (n, options) => Number(countClasses(n, options));
export const isReal = (code) => decode(code).every((pair) => pair.every((ref) => ref !== 0));

export function indexOf(code, options) {
  const links = decode(code);
  const index = exactIndex(links, options);
  // The gallery already uses Number for small counts and BigInt for long codes.
  return links.length > 9 ? index : Number(index);
}

/** Preserve the seeded sequence for small networks used in the backgrounds. */
export function randomCode(random = Math.random, n = 1 + Math.floor(random() * 4), { real = false } = {}) {
  const total = networkCount(n, { real });
  return Number.isSafeInteger(total)
    ? codeAt(n, Math.floor(random() * total), { real })
    : sampleDigits(n, { real, random });
}

export const mathNotation = (code) => formatPairs(decode(code));
export const linksNotation = (code) => decode(code).map(([s, t], i) => `(${i + 1}: ${s} ${t})`);
export const relabel = (links, permutation) =>
  rename(
    links,
    permutation.map((index) => index + 1),
  );

const cache = new Map();

/** Reuse the small gallery's encoded representatives between renders. */
export function representatives(n, { real = false } = {}) {
  const key = `${n}:${real}`;
  if (!cache.has(key)) cache.set(key, classRepresentatives(n, { real }).map(encode));
  return cache.get(key);
}
