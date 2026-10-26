/* global document, window, getComputedStyle */
// Bounded reproduction: 4,131 cards (the report shows 4,131), one browser at a time.
import { chromium, webkit } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const engine = process.env.ENGINE || 'chromium';
const output = 'docs/case-studies/issue-23';
const server = await preview({ preview: { port: 4179, strictPort: true } });
let browser;
const result = { engine, date: new Date().toISOString(), samples: [] };
try {
  browser = await { chromium, webkit }[engine].launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await mkdir(`${output}/screenshots`, { recursive: true });
  await page.goto('http://localhost:4179/network/?code=00000000');
  await page.locator('.network__preview').screenshot({ path: `${output}/screenshots/${engine}-before-free.png` });
  await page.goto('http://localhost:4179/network/?code=11&startOffset=12&endOffset=12');
  await page.locator('.network__preview').screenshot({ path: `${output}/screenshots/${engine}-before-markers.png` });
  await page.goto('http://localhost:4179/art/#symbols');
  await page.getByRole('button', { name: /^4 links/ }).click();
  const sample = async () => {
    result.samples.push(
      await page.evaluate(() => ({
        cards: document.querySelectorAll('.symbols__grid li').length,
        filtered: [...document.querySelectorAll('.symbols__grid li')].filter(
          (n) => getComputedStyle(n).backdropFilter !== 'none',
        ).length,
        barFilter: getComputedStyle(document.querySelector('.topbar')).backdropFilter,
        y: window.scrollY,
      })),
    );
    console.log(JSON.stringify(result.samples.at(-1)));
    await writeFile(`${output}/data/${engine}-baseline.json`, JSON.stringify(result, null, 2));
  };
  await page.locator('.symbols__grid li').first().hover();
  await page
    .locator('.symbols__grid li')
    .first()
    .screenshot({ path: `${output}/screenshots/${engine}-before-card.png` });
  await sample();
  for (let k = 0; k < 8; k++) {
    await page.getByRole('button', { name: /^Show more/ }).click();
    await sample();
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1100));
  await page.screenshot({ path: `${output}/screenshots/${engine}-before-gallery.png` });
  await sample();
  console.log(JSON.stringify(result));
} finally {
  await writeFile(`${output}/data/${engine}-baseline.json`, JSON.stringify(result, null, 2) + '\n');
  await browser?.close();
  await server.close();
}
