/* global document */
// Issue #47 (C5): the Habr cards must look the same after their float moved to
// a wrapper. Captures the cards of the built site with every animation stopped
// at the same moment, and the box of a hovered card (the futuristic skin lifts
// a hovered panel, which the float of the card overrode), so two builds can be
// compared pixel by pixel.
//
// Usage: npm run build && node experiments/issue-47-habr-float-shot.mjs <out-dir> <label>
//   ENGINE=firefox|webkit  another browser (default chromium)
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as pw from 'playwright';
import { preview } from 'vite';

const [dir = '/tmp/issue-47-habr', label = 'shot'] = process.argv.slice(2);
await mkdir(dir, { recursive: true });
const server = await preview({ preview: { port: 4197, strictPort: true }, logLevel: 'error' });
const browser = await pw[process.env.ENGINE || 'chromium'].launch();
const report = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4197/?lang=en', { waitUntil: 'networkidle' });
  const cards = page.locator('.habr__cards');
  await cards.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  // Every animation of the cards at 2.5 s of its run, the background hidden.
  const freeze = () =>
    page.evaluate(() => {
      document.querySelector('.cosmos')?.style.setProperty('display', 'none');
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = 2500;
      }
    });
  await freeze();
  await page.waitForTimeout(300);
  await cards.screenshot({ path: join(dir, `${label}-cards.png`), animations: 'allow' });
  const card = page.locator('.habr-card').first();
  const box = async () => {
    const r = await card.boundingBox();
    return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) };
  };
  report.box = await box();
  await card.hover();
  await freeze();
  await page.waitForTimeout(400);
  report.hoverBox = await box();
  report.cards = await page.locator('.habr-card').count();
  report.listItems = await page.locator('.habr__cards > li').count();
  await card.screenshot({ path: join(dir, `${label}-hover.png`), animations: 'allow' });
} finally {
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(report));
await writeFile(join(dir, `${label}.json`), JSON.stringify(report, null, 2) + '\n');
