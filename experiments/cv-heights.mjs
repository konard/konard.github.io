// Measures how many A4 pages each CV fills in print media, without printing:
// node experiments/cv-heights.mjs [position…] (needs `npm run build`).
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const roles = process.argv.slice(2);
const vite = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { POSITION_IDS, STYLES, cvPagePath } = await vite.ssrLoadModule('/src/cv/buildCv.js');
await vite.close();
const server = await preview({ logLevel: 'error', preview: { port: 4180 } });
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch();
// A4 with 14 mm side margins: 182 mm of text width at 96 dpi.
const page = await browser.newPage({ viewport: { width: Math.round((182 / 25.4) * 96), height: 1000 } });
await page.emulateMedia({ media: 'print' });
const pageHeight = (273 / 25.4) * 96;
for (const role of roles.length ? roles : POSITION_IDS) {
  const row = [];
  for (const lang of ['en', 'ru']) {
    for (const style of STYLES) {
      await page.goto(`${base}${cvPagePath({ role, style, lang })}`);
      const height = await page.locator('.cv').evaluate((el) => el.getBoundingClientRect().height);
      row.push(`${style[0]}${lang}:${(height / pageHeight).toFixed(2)}`);
    }
  }
  console.log(role.padEnd(10), row.join(' '));
}
await browser.close();
await server.close();
