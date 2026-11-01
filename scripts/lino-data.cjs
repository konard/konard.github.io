// The data of the website kept as nested Links Notation instead of JSON (issue
// #47: "in all places instead of json … we should use indented/nested links
// notation"). The generators write src/data/*.lino with lino-objects-codec,
// the codec of the associative technology stack; the `lino-data` plugin of
// vite.config.js parses them when the site is built, so a page gets the same
// objects as from JSON and never loads the codec for them. The public
// snapshots in docs/case-studies stay as the services returned them.
const fs = require('node:fs');
const path = require('node:path');
const { decode, encode } = require('lino-objects-codec');

/** `value` as the text of a .lino data file. */
const toLino = (value) => `${encode({ obj: value })}\n`;

/** The value a .lino data file holds. */
const readLino = (file) => decode({ notation: fs.readFileSync(file, 'utf8') });

/** Writes `value` to a .lino data file. */
function writeLino(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, toLino(value));
}

module.exports = { readLino, toLino, writeLino };
