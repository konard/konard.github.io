// Writes experiments/out/contact-sheet-<n>.html: every network of n links
// (or a page of them) drawn by the glyph renderer, with codes underneath,
// to review the drawings by eye.  Usage: node experiments/contact-sheet.mjs 2 [offset] [count] [classes]
import fs from 'node:fs';
import { codeAt, decode, mathNotation, networkCount, representatives } from '../src/links/configurations.js';
import { glyphSvg } from '../src/links/glyph.js';

const [n = 2, offset = 0, count = 120, classes = '', size = 96] = process.argv.slice(2);
const N = Number(n);
const list = classes ? representatives(N) : Array.from({ length: networkCount(N) }, (_, i) => codeAt(N, i));
const page = list.slice(Number(offset), Number(offset) + Number(count));
const cells = page
  .map(
    (code) => `<figure>${glyphSvg(decode(code), Number(size))}<figcaption>${mathNotation(code)}</figcaption></figure>`,
  )
  .join('\n');
fs.mkdirSync('experiments/out', { recursive: true });
const file = `experiments/out/contact-sheet-${N}${classes ? '-classes' : ''}-${offset}.html`;
fs.writeFileSync(
  file,
  `<!doctype html><meta charset="utf-8"><style>body{background:#070b16;color:#94a3b8;font:11px monospace;display:flex;flex-wrap:wrap;gap:6px;margin:8px}
figure{margin:0;padding:4px;border:1px solid #1e293b;border-radius:6px;text-align:center}svg{display:block}</style>${cells}`,
);
console.log(file, page.length);
