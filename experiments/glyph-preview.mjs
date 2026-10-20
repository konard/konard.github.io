// Writes experiments/glyph-preview.html: every 1–3 link configuration and the
// first 4-link ones, to eyeball the glyph geometry in a browser.
import fs from 'node:fs';
import codes from '../src/links/configurations.json' with { type: 'json' };
import { decode } from '../src/links/configurations.js';
import { glyphId, glyphSymbol } from '../src/links/glyph.js';

const list = [...codes[1], ...codes[2], ...codes[3], ...codes[4].filter((_, i) => i % 24 === 0)];
const cells = list
  .map(
    (c) =>
      `<figure><svg width="96" height="96"><use href="#${glyphId(c)}"/></svg><figcaption>${c}</figcaption></figure>`,
  )
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>body{background:#050814;color:#7df9c8;font:10px monospace;display:flex;flex-wrap:wrap;gap:4px}figure{margin:0;text-align:center;border:1px solid #123}</style>
<svg style="display:none">${list.map((c) => glyphSymbol(decode(c), glyphId(c))).join('')}</svg>${cells}`;
fs.writeFileSync(new URL('./glyph-preview.html', import.meta.url), html);
console.log(list.length, 'glyphs');
