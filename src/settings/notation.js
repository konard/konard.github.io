// The settings of this browser as text (issue #47: "instead of json (for
// example for configuration of UI/UX) we should use indented/nested links
// notation"): the flat indented Links Notation of lino-objects-codec,
//     settings:
//       skin.name liquid
//       grid.size 96
//       avatar.text '45'
// one `key value` per line; a string that could be read as something else is
// quoted with ' or " (the same quote doubled inside), a bare value is a number,
// true, false, null or a word.
//
// Every page reads and writes these settings, and lino-objects-codec brings
// the whole Links Notation parser (≈55 kB, 14.5 kB gzipped, see
// experiments/issue-47-lino-bundle-size.mjs), so this flat case has its own
// small reader and writer; src/lino-47.test.js checks that they agree with
// the codec, which the pages that paste or copy settings load (src/lino.js).
//
// readStored is also copied as text into the script that runs before the first
// paint (SETTINGS_SCRIPT in vite.config.js), so it must not use anything
// outside itself and has no line comments (the copy folds the lines).

/**
 * The settings stored as the text that `writeStored` writes, or as the JSON
 * stored before issue #47; `{}` for nothing. Throws on anything else.
 */
export function readStored(text) {
  if (!text) return {};
  if (/^\s*[[{]/.test(text)) return JSON.parse(text);
  var lines = text.replace(/\r/g, '').split('\n');
  if (lines[0].trim() !== 'settings:') throw new Error('not settings');
  var out = {};
  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var match = /^\s+(\S+) (.*)$/.exec(lines[i]);
    if (!match) throw new Error('not a setting: ' + lines[i]);
    var value = match[2];
    var quote = value.charAt(0);
    if ((quote === "'" || quote === '"') && value.length > 1 && value.charAt(value.length - 1) === quote) {
      value = value
        .slice(1, -1)
        .split(quote + quote)
        .join(quote);
    } else if (value === 'true' || value === 'false') {
      value = value === 'true';
    } else if (value === 'null') {
      value = null;
    } else if (value !== '' && isFinite(Number(value))) {
      value = Number(value);
    } else if (quote === "'" || quote === '"') {
      throw new Error('a string over more lines: ' + lines[i]);
    }
    out[match[1]] = value;
  }
  return out;
}

/** A string in quotes, as lino-objects-codec quotes it. */
const quoted = (text) => {
  if (text.includes("'") && !text.includes('"')) return `"${text}"`;
  if (text.includes('"') && text.includes("'")) {
    const singles = text.split("'").length;
    if (text.split('"').length < singles) return `"${text.replace(/"/g, '""')}"`;
    return `'${text.replace(/'/g, "''")}'`;
  }
  return `'${text}'`;
};

/** A reference, bare when Links Notation allows it. */
const reference = (text) => (text !== '' && !/[\s()'":`]/.test(text) ? text : quoted(text));

/** Whether a bare string would be read back as a number, true, false or null. */
const ambiguous = (text) =>
  text === '' || text === 'true' || text === 'false' || text === 'null' || (text.trim() !== '' && !isNaN(Number(text)));

/**
 * Flat settings `{ key: value }` as the text lino-objects-codec writes with
 * `formatIndented({ id: 'settings', obj })`: a string used before (or the id)
 * is quoted, because a bare one would refer to it.
 */
export function writeStored(settings) {
  const used = new Set(['settings']);
  const lines = ['settings:'];
  for (const [key, value] of Object.entries(settings)) {
    let text;
    if (value === null || value === undefined) text = 'null';
    else if (typeof value === 'string') {
      if (used.has(value) || ambiguous(value)) text = quoted(value);
      else {
        used.add(value);
        text = reference(value);
      }
    } else text = String(value);
    lines.push(`  ${reference(key)} ${text}`);
  }
  return lines.join('\n');
}
