// Every configuration of 1–4 doublet links up to renaming of the links.
// A link is a pair (source, target) where both ends point to links of the same
// configuration, so N links have N^(2N) labelled variants; two variants are the
// same configuration when a permutation of link indices maps one onto the other.
// The counts 1, 10, 129, 2836 are OEIS A054050: isomorphism classes of ordered
// pairs of endofunctions (source, target) on {1..N}.

export function permutations(n) {
  if (n === 0) return [[]];
  const result = [];
  for (const rest of permutations(n - 1))
    for (let i = 0; i <= rest.length; i++) result.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  return result;
}

const encode = (links) => links.map(([s, t]) => `${s}${t}`).join(' ');

/** Relabels links by `perm` (old index → new index) and returns the new list. */
export function relabel(links, perm) {
  const result = new Array(links.length);
  links.forEach(([s, t], i) => {
    result[perm[i]] = [perm[s], perm[t]];
  });
  return result;
}

/** The lexicographically smallest encoding among all relabelings. */
export function canonical(links, perms = permutations(links.length)) {
  let best = null;
  for (const perm of perms) {
    const code = encode(relabel(links, perm));
    if (best === null || code < best) best = code;
  }
  return best;
}

/** Decodes `"00 10"` into `[[0, 0], [1, 0]]`. */
export const decode = (code) => code.split(' ').map((pair) => [Number(pair[0]), Number(pair[1])]);

const cache = new Map();

/** Canonical codes of all distinct configurations of exactly `n` links. */
export function configurations(n) {
  if (cache.has(n)) return cache.get(n);
  const perms = permutations(n);
  const seen = new Set();
  const total = n ** (2 * n);
  for (let index = 0; index < total; index++) {
    const links = [];
    let rest = index;
    for (let i = 0; i < n; i++) {
      const s = rest % n;
      rest = Math.floor(rest / n);
      const t = rest % n;
      rest = Math.floor(rest / n);
      links.push([s, t]);
    }
    seen.add(canonical(links, perms));
  }
  const result = [...seen].sort();
  cache.set(n, result);
  return result;
}

/** Whether all links are reachable from each other ignoring direction. */
export function isConnected(links) {
  const parent = links.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  links.forEach(([s, t], i) => {
    parent[find(s)] = find(i);
    parent[find(t)] = find(i);
  });
  return new Set(links.map((_, i) => find(i))).size === 1;
}
