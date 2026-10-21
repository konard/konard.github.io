// Every network of 1–4 doublet links, encoded exactly as links.
// Index 0 is the permanent zero link (0: 0 0): "nothing", always assumed and
// never drawn. Real links are 1..N, and every link (i: s t) refers to links
// 0..N by its source s and target t. So a network of N real links is written
// with 2N digits in base N + 1, and there are (N + 1)^(2N) networks:
//
//   N = 1: base 2, 00₂ … 11₂                 4 networks
//   N = 2: base 3, 00₃ 00₃ … 22₃ 22₃         81 networks
//   N = 3: base 4, 00₄ 00₄ 00₄ … 33₄ 33₄ 33₄ 4,096 networks
//   N = 4: base 5, 00₅ … 44₅ (four pairs)    390,625 networks
//
// For example (1: 0 0) is 00₂, (1: 1 0) is 10₂ and (1: 1 1) is 11₂.
// Networks that differ only by renaming the real links (0 stays 0) form one
// class; `classCount` counts them with Burnside's lemma and `representatives`
// lists the smallest code of every class.

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

/** The base of the codes of networks with `n` real links. */
export const baseOf = (n) => n + 1;

/** How many networks of `n` real links exist: (n + 1)^(2n). */
export const networkCount = (n) => baseOf(n) ** (2 * n);

/** "00 10" → [[0, 0], [1, 0]]: link i + 1 is [source, target]. */
export function decode(code) {
  return code.split(' ').map((pair) => [Number(pair[0]), Number(pair[1])]);
}

/** [[0, 0], [1, 0]] → "00 10". */
export const encode = (links) => links.map(([s, t]) => `${s}${t}`).join(' ');

/** The code of the `index`-th network of `n` links, counting in base n + 1. */
export function codeAt(n, index) {
  const base = baseOf(n);
  const digits = index.toString(base).padStart(2 * n, '0');
  return digits.match(/../g).join(' ');
}

/** The position of a code among the networks of its size (inverse of codeAt). */
export const indexOf = (code) => parseInt(code.replace(/ /g, ''), baseOf(code.split(' ').length));

/** A random network of `n` links, or of 1–4 links when `n` is not given. */
export function randomCode(random = Math.random, n = 1 + Math.floor(random() * 4)) {
  return codeAt(n, Math.floor(random() * networkCount(n)));
}

/** Math notation: the code with base subscripts, e.g. "10₂" or "01₃ 20₃". */
export function mathNotation(code) {
  const base = String(baseOf(code.split(' ').length))
    .split('')
    .map((d) => SUBSCRIPTS[d])
    .join('');
  return code
    .split(' ')
    .map((pair) => pair + base)
    .join(' ');
}

/** Links notation: one "(index: source target)" per real link. */
export const linksNotation = (code) => decode(code).map(([s, t], i) => `(${i + 1}: ${s} ${t})`);

export function permutations(n) {
  if (n === 0) return [[]];
  const result = [];
  for (const rest of permutations(n - 1))
    for (let i = 0; i <= rest.length; i++) result.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  return result;
}

/**
 * Renames the real links by `perm` (perm[i] is the new 0-based position of
 * link i + 1); references to 0 stay 0.
 */
export function relabel(links, perm) {
  const name = (ref) => (ref === 0 ? 0 : perm[ref - 1] + 1);
  const result = new Array(links.length);
  links.forEach(([s, t], i) => {
    result[perm[i]] = [name(s), name(t)];
  });
  return result;
}

/** The smallest code among all renamings of the real links. */
export function canonical(links, perms = permutations(links.length)) {
  let best = null;
  for (const perm of perms) {
    const code = encode(relabel(links, perm));
    if (best === null || code < best) best = code;
  }
  return best;
}

/**
 * Whether no renaming of the real links gives a smaller code. Works on flat
 * digit arrays and stops at the first difference, so all 390,625 networks
 * of 4 links are checked in a fraction of a second.
 */
function isSmallest(digits, perms, n) {
  const renamed = new Array(2 * n);
  for (const perm of perms) {
    for (let i = 0; i < n; i++) {
      const s = digits[2 * i];
      const t = digits[2 * i + 1];
      renamed[2 * perm[i]] = s === 0 ? 0 : perm[s - 1] + 1;
      renamed[2 * perm[i] + 1] = t === 0 ? 0 : perm[t - 1] + 1;
    }
    for (let k = 0; k < 2 * n; k++) {
      if (renamed[k] < digits[k]) return false;
      if (renamed[k] > digits[k]) break;
    }
  }
  return true;
}

const cache = new Map();

/** The smallest code of every renaming class of networks with `n` links. */
export function representatives(n) {
  if (!cache.has(n)) {
    const perms = permutations(n);
    const base = baseOf(n);
    const digits = new Array(2 * n).fill(0);
    const result = [];
    for (let i = 0; i < networkCount(n); i++) {
      if (isSmallest(digits, perms, n)) result.push(digits.join('').match(/../g).join(' '));
      // Count up in base n + 1, last digit first.
      for (let k = 2 * n - 1; k >= 0 && ++digits[k] === base; k--) digits[k] = 0;
    }
    cache.set(n, result);
  }
  return cache.get(n);
}

/**
 * The number of renaming classes by Burnside's lemma: the average, over all
 * permutations of the real links, of the networks a permutation keeps fixed.
 */
export function classCount(n) {
  const perms = permutations(n);
  let fixed = 0;
  for (const perm of perms) {
    const cycles = cycleLengths(perm);
    let product = 1;
    for (const k of cycles) {
      // An end of a link on a k-cycle may refer to 0 or to any link whose
      // cycle length divides k; both ends of the cycle's links are free.
      const choices = 1 + cycles.filter((d) => k % d === 0).reduce((sum, d) => sum + d, 0);
      product *= choices ** 2;
    }
    fixed += product;
  }
  return fixed / perms.length;
}

function cycleLengths(perm) {
  const seen = new Array(perm.length).fill(false);
  const lengths = [];
  perm.forEach((_, start) => {
    let length = 0;
    for (let i = start; !seen[i]; i = perm[i]) {
      seen[i] = true;
      length += 1;
    }
    if (length) lengths.push(length);
  });
  return lengths;
}
