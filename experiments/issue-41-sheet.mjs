import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const root = 'docs/case-studies/issue-41';
const before = JSON.parse(await readFile(`${root}/data/chromium-before.json`, 'utf8')).networks;
const after = JSON.parse(await readFile(`${root}/data/chromium-after.json`, 'utf8')).networks;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1320, height: 1000 }, deviceScaleFactor: 1 });
  for (let part = 0; part < 2; part++) {
    const cards = after
      .slice(part * 12, (part + 1) * 12)
      .map(({ code, svg }) => {
        const original = before.find((item) => item.code === code).svg;
        return `<article><h2>${code}</h2><div><figure>${original}<figcaption>Before</figcaption></figure><figure>${svg}<figcaption>After</figcaption></figure></div></article>`;
      })
      .join('');
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Issue 41 before/after ${part + 1}</title><style>body{margin:16px;background:#101420;color:#fff;font:14px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}article{border:1px solid #586178;border-radius:8px;padding:8px}h2{font:16px monospace;margin:0 0 8px}article div{display:flex;gap:8px}figure{flex:1;margin:0;min-width:0}svg{width:100%;height:auto;display:block}figcaption{text-align:center;margin-top:4px}</style><h1>Issue 41: four reported cases and twenty seeded 1–3-link networks (${part + 1}/2)</h1><main>${cards}</main></html>`;
    await writeFile(`${root}/data/comparison-${part + 1}.html`, html);
    await page.setContent(html);
    await page.screenshot({ path: `${root}/screenshots/comparison-${part + 1}.png`, fullPage: true });
  }
} finally {
  await browser.close();
}
