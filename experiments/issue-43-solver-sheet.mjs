// Issue 43 / PR 44 review: before/after comparison sheet of automatic spacing.
// Run after issue-43-solver-browser.mjs has captured both phases.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const dir = process.env.CAPTURE_DIR || 'docs/case-studies/issue-43/screenshots';
const codes = (process.argv[2] || '2211,2010,2011,111212').split(',');
const image = async (name) => `data:image/png;base64,${(await readFile(join(dir, name))).toString('base64')}`;
let rows = '';
for (const code of codes) {
  rows += `<tr><th>${code}</th><td><img src="${await image(`solver-before-${code}.png`)}"></td>`;
  rows += `<td><img src="${await image(`solver-after-${code}.png`)}"></td></tr>`;
}
const html = `<style>body{margin:0;background:#111;color:#ddd;font:20px sans-serif}
table{border-spacing:12px}img{width:300px;display:block}th{padding:0 8px}</style>
<table><tr><th></th><th>before (solve=true)</th><th>after (solve=true)</th></tr>${rows}</table>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 720, height: 400 } });
await page.setContent(html);
await page.locator('table').screenshot({ path: join(dir, 'solver-comparison.png') });
await browser.close();
