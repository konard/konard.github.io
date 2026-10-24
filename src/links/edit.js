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
import { encode } from './configurations';
import { MAX_LINKS } from './glyph';

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const toSubscript = (k) =>
  String(k)
    .split('')
    .map((d) => SUBSCRIPTS[d])
    .join('');
const fromSubscripts = (text) => text.replace(/[₀-₉]/g, (c) => String(SUBSCRIPTS.indexOf(c)));

const fail = (en, ru) => ({ error: { en, ru } });

/** `{ links }` if every link refers only to links 0..n of a network of 1–9 links, otherwise `{ error }`. */
export function check(links) {
  const n = links.length;
  if (n < 1) return fail('A network needs at least one link.', 'В сети должна быть хотя бы одна связь.');
  if (n > MAX_LINKS)
    return fail(`At most ${MAX_LINKS} links can be drawn.`, `Нарисовать можно не больше ${MAX_LINKS} связей.`);
  const bad = links.flat().find((ref) => !Number.isInteger(ref) || ref < 0 || ref > n);
  if (bad !== undefined)
    return fail(
      `A link refers to ${bad}, but there are only the links 0…${n}.`,
      `Связь ссылается на ${bad}, а есть только связи 0…${n}.`,
    );
  return { links };
}

/** The code ("01 20") of a network written as "0120", "01 20", "01-20" or "01.20"; null if it is not one. */
export function parseCode(text) {
  const digits = String(text ?? '').replace(/[\s._-]/g, '');
  if (!/^\d+$/.test(digits) || digits.length % 2) return null;
  const links = digits.match(/../g).map((pair) => [Number(pair[0]), Number(pair[1])]);
  return check(links).links ? encode(links) : null;
}

/** The N-ary number "0120₃" (or "0120", "0120_3"); its base, if written, must be n + 1. */
export function parseNumber(text) {
  const raw = String(text).trim();
  const suffix = raw.match(/(?:([₀-₉]+)|_(\d+))$/);
  const base = suffix ? Number(fromSubscripts(suffix[1] || suffix[2])) : null;
  const digits = raw.slice(0, suffix ? suffix.index : raw.length).replace(/[\s.-]/g, '');
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
export const countOf = (n) => BigInt(n + 1) ** BigInt(2 * n);

/** The network at position `index` among the networks of `n` links (the decimal value of the N-ary number). */
export function parseIndex(text, n) {
  const raw = String(text).replace(/[\s,_]/g, '');
  const count = countOf(n);
  const index = /^\d+$/.test(raw) ? BigInt(raw) : -1n;
  if (index < 0n || index >= count)
    return fail(`Write a whole number from 0 to ${count - 1n}.`, `Запишите целое число от 0 до ${count - 1n}.`);
  const digits = index.toString(n + 1).padStart(2 * n, '0');
  return check(digits.match(/../g).map((pair) => [Number(pair[0]), Number(pair[1])]));
}

/**
 * Links notation: "(1: 0 1) (2: 2 0)", one link per pair of parentheses;
 * the names may be left out ("(0 1) (2 0)") and then count from 1.
 */
export function parseLinks(text) {
  const found = [...String(text).matchAll(/\(\s*(?:(\d+)\s*:)?\s*(\d+)[\s,]+(\d+)\s*\)/g)];
  if (!found.length) return fail('Write links as (1: 0 1) (2: 2 0).', 'Запишите связи как (1: 0 1) (2: 2 0).');
  return byNames(found.map(([, name, s, t]) => [name, Number(s), Number(t)]));
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
  const raw = String(text);
  if (raw.includes('(')) {
    const found = [...raw.matchAll(/(?:(\d+)\s*(?:↦|->|→|=>|:)\s*)?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*\)/g)];
    if (!found.length)
      return fail('Write the links as {1 ↦ (0, 1), 2 ↦ (2, 0)}.', 'Запишите связи как {1 ↦ (0, 1), 2 ↦ (2, 0)}.');
    return byNames(found.map(([, name, s, t]) => [name, Number(s), Number(t)]));
  }
  const pairs = fromSubscripts(raw)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => pair.slice(0, 2));
  if (!pairs.length || pairs.some((pair) => !/^\d\d$/.test(pair)))
    return fail(
      'Write the links as {1 ↦ (0, 1), 2 ↦ (2, 0)} or 01₃ 20₃.',
      'Запишите связи как {1 ↦ (0, 1), 2 ↦ (2, 0)} или 01₃ 20₃.',
    );
  return check(pairs.map((pair) => [Number(pair[0]), Number(pair[1])]));
}

/** The name of the function of a doublet network in the notation of the theory: λ (L → L²) or N² (R → R²). */
export const functionOf = (notation) => (notation === 'R' ? 'N²' : 'λ');

/** "λ: L → L × L" or "N²: R → R × R". */
export const signatureOf = (notation) => (notation === 'R' ? 'N²: R → R × R' : 'λ: L → L × L');

/** "λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}". */
export const theoryNotation = (links, notation = 'L') =>
  `${functionOf(notation)} = {${links.map(([s, t], i) => `${i + 1} ↦ (${s}, ${t})`).join(', ')}}`;

/** "0120₃". */
export const numberNotation = (links) => `${encode(links).replace(/ /g, '')}${toSubscript(links.length + 1)}`;

/** The decimal value of the N-ary number (a string): the position of the network among those of its size. */
export const decimalOf = (links) =>
  links
    .flat()
    .reduce((value, digit) => value * BigInt(links.length + 1) + BigInt(digit), 0n)
    .toString();

/** "(1: 0 1) (2: 2 0)". */
export const linksText = (links, separator = ' ') => links.map(([s, t], i) => `(${i + 1}: ${s} ${t})`).join(separator);

/** A new link (n + 1: 0 0), which refers to nothing yet. */
export const addLink = (links) => (links.length >= MAX_LINKS ? links : [...links, [0, 0]]);

/**
 * Removes link `k` (1-based): references to it become references to 0, and
 * the links after it move down by one, so the network stays consistent.
 */
export function removeLink(links, k) {
  if (links.length <= 1) return links;
  const rename = (ref) => (ref === k ? 0 : ref > k ? ref - 1 : ref);
  return links.filter((_, i) => i !== k - 1).map(([s, t]) => [rename(s), rename(t)]);
}

/** Sets the source (`end` 0) or the target (`end` 1) of link `i` (0-based) to `ref`. */
export const setReference = (links, i, end, ref) =>
  links.map((link, k) => (k === i ? link.map((value, e) => (e === end ? ref : value)) : link));
