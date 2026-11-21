// Reading, writing and editing a network in the notations of the editor of
// /network/ (issue #17). A network is a list of links [[source, target], …]
// where link i + 1 refers to links 0..n (0 is the zero link, "nothing"), as in
// configurations.js. Every notation is editable, so each of them reads what
// the others write:
//
//   math notation (theory)  λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}   (N² = {…} with R → R²)
//   pairs                   01₃ 20₃                         (the gallery captions)
//   N-ary number            0120₃ = 15                      (the code as one number in base n + 1)
//   links notation          (1: 0 1) (2: 2 0)               (github.com/link-foundation/links-notation)
//
// Parsers return `{ links }` or `{ error }`, where `error` is an `{ en, ru }` text.
import { encode } from './configurations.js';
import { parseLinks as readLinks } from '@link-foundation/ui-core';
import {
  count,
  formatDecimal,
  formatTheory,
  parseCode as readCode,
  parseDecimal,
  removeLink as removeConfigurationLink,
  setReference as setConfigurationReference,
} from '@link-foundation/ui-components/links-view/configurations';

export { addLink, formatNumber as numberNotation } from '@link-foundation/ui-components/links-view/configurations';

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const fromSubscripts = (text) => text.replace(/[₀-₉]/g, (c) => String(SUBSCRIPTS.indexOf(c)));

const fail = (en, ru) => ({ error: { en, ru } });

/** `{ links }` if every link refers only to links 0..n of a nonempty network, otherwise `{ error }`. */
export function check(links) {
  const n = links.length;
  if (n < 1) return fail('A network needs at least one link.', 'В сети должна быть хотя бы одна связь.');
  if (links.some((pair) => !Array.isArray(pair) || pair.length !== 2))
    return fail('Each link needs a source and target.', 'Каждой связи нужны начало и конец.');
  const refs = links.flat();
  const badIndex = refs.findIndex((ref) => !Number.isInteger(ref) || ref < 0 || ref > n);
  if (badIndex !== -1)
    return fail(
      `A link refers to ${refs[badIndex]}, but there are only the links 0…${n}.`,
      `Связь ссылается на ${refs[badIndex]}, а есть только связи 0…${n}.`,
    );
  return { links };
}

/** The code ("01 20") of a network written as "0120", "01 20", "01-20" or "01.20"; null if it is not one. */
export function parseCode(text) {
  const source = String(text ?? '');
  const code = source.includes(',') ? source : source.replace(/[\s._-]/g, '');
  if (!/^(?:\d+|\d+,\d+(;\d+,\d+)*)$/.test(code)) return null;
  const { links } = readCode(code);
  return links ? encode(links) : null;
}

/** The N-ary number "0120₃" (or "0120", "0120_3"); its base, if written, must be n + 1. */
export function parseNumber(text) {
  const raw = String(text).trim();
  const suffix = raw.match(/(?:([₀-₉]+)|_(\d+))$/);
  const base = suffix ? Number(fromSubscripts(suffix[1] || suffix[2])) : null;
  const body = raw.slice(0, suffix ? suffix.index : raw.length);
  if (/^\[\s*\d+(?:[\s,]+\d+)*\s*\]$/.test(body)) {
    const digits = body
      .slice(1, -1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (digits.length % 2) return fail('Every link needs two digits.', 'Каждой связи нужны две цифры.');
    if (base !== null && base !== digits.length / 2 + 1)
      return fail(
        'The base must be the number of links plus one.',
        'Основание должно быть на единицу больше числа связей.',
      );
    return check(Array.from({ length: digits.length / 2 }, (_, i) => digits.slice(2 * i, 2 * i + 2)));
  }
  const digits = body.replace(/[\s.-]/g, '');
  if (!/^\d+$/.test(digits))
    return fail('Write the digits of the number, e.g. 0120₃.', 'Запишите цифры числа, например 0120₃.');
  if (digits.length % 2)
    return fail(
      'Every link takes two digits (source and target), so the number needs an even count of digits.',
      'Каждая связь занимает две цифры (начало и конец), поэтому цифр должно быть чётное число.',
    );
  const n = digits.length / 2;
  if (base !== null && base !== n + 1)
    return fail(
      `A network of ${n} ${n === 1 ? 'link' : 'links'} is written in base ${n + 1}, not ${base}.`,
      `Сеть из ${n} ${n === 1 ? 'связи' : 'связей'} записывается в системе с основанием ${n + 1}, а не ${base}.`,
    );
  return check(digits.match(/../g).map((pair) => [Number(pair[0]), Number(pair[1])]));
}

/**
 * How many networks of `n` links there are, (n + 1)^(2n), as a BigInt: with 9
 * links it is 10^18, beyond the integers a Number holds exactly.
 */
export const countOf = count;

/** The network at position `index` among the networks of `n` links (the decimal value of the N-ary number). */
export function parseIndex(text, n) {
  const raw = String(text).replace(/[\s,_]/g, '');
  const { links } = parseDecimal(raw, n);
  if (links) return { links };
  const max = countOf(n) - 1n;
  return fail(`Write a whole number from 0 to ${max}.`, `Запишите целое число от 0 до ${max}.`);
}

/**
 * Links notation: "(1: 0 1) (2: 2 0)", one link per pair of parentheses;
 * the names may be left out ("(0 1) (2 0)") and then count from 1.
 */
export function parseLinks(text) {
  try {
    // The official parser groups adjacent records on one line. Separate the
    // editor's historical space-separated pairs without flattening nested
    // records (which would silently accept malformed networks).
    const found = readLinks(
      String(text)
        .replace(/,/g, ' ')
        .replace(/\)\s*\(/g, ')\n('),
    );
    if (!found.length) throw new Error('empty network');
    const items = found.map((link) => {
      const values = Array.isArray(link) ? link : link.values;
      const name = Array.isArray(link) ? undefined : link.id;
      if (!values || values.length !== 2 || values.some((v) => typeof v !== 'string' || !/^\d+$/.test(v)))
        throw new Error('not a doublet');
      if (name !== undefined && !/^\d+$/.test(name)) throw new Error('not a link number');
      return [name, ...values.map(Number)];
    });
    return byNames(items);
  } catch {
    return fail('Write links as (1: 0 1) (2: 2 0).', 'Запишите связи как (1: 0 1) (2: 2 0).');
  }
}

/** Links named 1..n in any order, or without names, in the order they are written. */
function byNames(items) {
  const named = items.filter(([name]) => name !== undefined);
  if (!named.length) return check(items.map(([, s, t]) => [s, t]));
  if (named.length !== items.length)
    return fail('Name either every link or none.', 'Назовите либо все связи, либо ни одной.');
  const links = new Array(items.length);
  for (const [name, s, t] of items) {
    const k = Number(name);
    if (!(k >= 1 && k <= items.length) || links[k - 1])
      return fail(
        `The links must be named 1…${items.length}, each once.`,
        `Связи должны называться 1…${items.length}, каждая один раз.`,
      );
    links[k - 1] = [s, t];
  }
  return check(links);
}

/**
 * Math notation: "λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}" (also with -> or →, or
 * without the names), or the pairs with base subscripts "01₃ 20₃".
 */
export function parseMath(text) {
  if (/^[\d(),\s₀-₉]+$/.test(String(text)) && String(text).includes('(') && /[₀-₉]/.test(String(text))) {
    const pattern = /\(\s*(\d+)\s*,\s*(\d+)\s*\)([₀-₉]+)/g;
    const found = [...String(text).matchAll(pattern)];
    if (
      String(text).replace(pattern, '').trim() ||
      found.some((p) => Number(fromSubscripts(p[3])) !== found.length + 1)
    )
      return fail('Every pair must have the network base.', 'У каждой пары должно быть основание сети.');
    return check(found.map((p) => [Number(p[1]), Number(p[2])]));
  }
  const raw = String(text)
    .trim()
    .replace(/^(?:λ|N²)\s*=\s*/, '');
  const body = raw.startsWith('{') && raw.endsWith('}') ? raw.slice(1, -1).trim() : raw;
  if (raw.includes('(')) {
    const pattern = /(?:(\d+)\s*(?:↦|->|→|=>|:)\s*)?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*\)/g;
    const found = [...body.matchAll(pattern)];
    const rest = body.replace(pattern, '|');
    if (
      !found.length ||
      !rest.startsWith('|') ||
      !rest.endsWith('|') ||
      rest.split('|').some((separator) => separator.trim() !== '' && separator.trim() !== ',')
    )
      return fail('Write the links as {1 ↦ (0, 1), 2 ↦ (2, 0)}.', 'Запишите связи как {1 ↦ (0, 1), 2 ↦ (2, 0)}.');
    return byNames(found.map(([, name, s, t]) => [name, Number(s), Number(t)]));
  }
  const pairs = body.split(/\s+/).filter(Boolean);
  if (!pairs.length || pairs.some((pair) => !/^\d\d(?:[₀-₉]+|_\d+)?$/.test(pair)))
    return fail(
      'Write the links as {1 ↦ (0, 1), 2 ↦ (2, 0)} or 01₃ 20₃.',
      'Запишите связи как {1 ↦ (0, 1), 2 ↦ (2, 0)} или 01₃ 20₃.',
    );
  // Every pair's base must agree with the size, just as the N-ary number's does.
  const digits = pairs.map((pair) => pair.slice(0, 2)).join('');
  for (const pair of pairs) {
    const result = parseNumber(`${digits}${pair.slice(2)}`);
    if (result.error) return result;
  }
  return check(pairs.map((pair) => [Number(pair[0]), Number(pair[1])]));
}

/** The name of the function of a doublet network in the notation of the theory: λ (L → L²) or N² (R → R²). */
export const functionOf = (notation) => (notation === 'R' ? 'N²' : 'λ');

/** "λ: L → L × L" or "N²: R → R × R". */
export const signatureOf = (notation) => (notation === 'R' ? 'N²: R → R × R' : 'λ: L → L × L');

/** "λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}". */
export const theoryNotation = (links, notation = 'L') => formatTheory(links).replace(/^λ/, functionOf(notation));

/** The decimal value of the N-ary number (a string): the position of the network among those of its size. */
export const decimalOf = formatDecimal;

/** "(1: 0 1) (2: 2 0)". */
export const linksText = (links, separator = ' ') => links.map(([s, t], i) => `(${i + 1}: ${s} ${t})`).join(separator);

/** Removes a 1-based link and renumbers remaining references. */
export const removeLink = (links, k) => removeConfigurationLink(links, k).links;

/** The editor uses a zero-based index for the selected link. */
export const setReference = (links, i, end, ref) => setConfigurationReference(links, i + 1, end, ref);
