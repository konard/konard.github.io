import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Arrange actual browser captures in HTML; do not alter the captured SVG pixels.
const root = 'docs/case-studies/issue-43';
const codes = ['0211', '2011', '2210', '2221'];
const cells = [];
for (const code of codes) {
  const pictures = [];
  for (const phase of ['before', 'after']) {
    const bytes = await readFile(`${root}/screenshots/chromium-${phase}-${code}.png`);
    pictures.push(
      `<figure><figcaption>${phase}</figcaption><img src="data:image/png;base64,${bytes.toString('base64')}" alt="${code} ${phase}"></figure>`,
    );
  }
  cells.push(`<article><h2>${code}</h2><div>${pictures.join('')}</div></article>`);
}
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Issue 43 before and after</title><style>
*{box-sizing:border-box}body{margin:0;background:#111827;color:#e5e7eb;font:18px system-ui;padding:24px;width:1048px}
h1{font-size:25px;margin:0 0 16px}main{display:grid;grid-template-columns:1fr 1fr;gap:16px}
article{border:1px solid #475569;border-radius:8px;padding:12px}h2{margin:0 0 8px;font:20px monospace}
article div{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}figcaption{font-size:14px;margin-bottom:6px}
img{width:100%;display:block;border-radius:4px}
</style><h1>Neutral geometry at zero turns · issue 43</h1><main>${cells.join('')}</main></html>`;
await writeFile(`${root}/data/comparison.html`, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1048, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: `${root}/screenshots/comparison.png`, fullPage: true });
} finally {
  await browser.close();
}
