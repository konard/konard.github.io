// Links Notation instead of JSON (issue #47: "in all places instead of json
// (for example for configuration of UI/UX) we should use indented/nested links
// notation", after the associative technology stack of
// https://github.com/link-assistant/formal-ai/blob/main/docs/associative-tech-stack.md).
//
// Configuration that a visitor reads, copies or keeps is written with
// lino-objects-codec, the codec of that stack:
// - a flat set of settings in the indented form, one `key value` per line under
//   a named root:
//       settings:
//         skin.name liquid
//         avatar.angle 45
// - nested data (saved looks, saved styles) in the nested form:
//       (
//         presets (
//           (
//             name "Calm night"
//             look (
//               rain.on false
// Both keep numbers, booleans and strings apart ('45' stays a string).
// What was saved or copied as JSON before still loads.
import { decode, encode, formatIndented, parseIndented, setDebugEnabled } from 'lino-objects-codec';

// lino-objects-codec 0.9.4 reads `process.env.LINO_CODEC_DEBUG` without a guard
// on every parse, which throws "process is not defined" in a browser; turning
// its tracing off from code skips that read. Upstream:
// https://github.com/link-foundation/lino-objects-codec/issues/79
setDebugEnabled(false);

/** A flat object as indented Links Notation under the root `id`. */
export const toIndented = (id, obj) => formatIndented({ id, obj });

/** An object or an array, nested to any depth, as nested Links Notation. */
export const toNested = (value) => encode({ obj: value });

/**
 * What `text` holds, as `{ id, value, format }`: indented Links Notation
 * (`id:` on the first line), nested Links Notation (starts with `(`) or JSON
 * saved or copied before issue #47 (starts with `{` or `[`); `id` is the root
 * name of the indented form. Throws on anything else. The format is told by
 * the first character because each parser reads the other forms as something
 * else instead of failing.
 */
export function readNotation(text) {
  const source = typeof text === 'string' ? text.trim() : '';
  if (!source) throw new Error('nothing to read');
  if (source[0] === '{' || source[0] === '[') return { id: null, value: JSON.parse(source), format: 'json' };
  if (source[0] === '(') return { id: null, value: decode({ notation: source }), format: 'nested' };
  const { id, obj } = parseIndented({ text: source });
  return { id, value: obj, format: 'indented' };
}

/** A plain object (not null, not an array). */
export const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
