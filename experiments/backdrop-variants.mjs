// Screenshots of one page with extra CSS rules injected (issue #15), to find
// which rule makes headless Chromium paint the glass panels blue.
//
//   node experiments/backdrop-variants.mjs <path> <out-prefix> '<css 1>' '<css 2>' ...
/* global window */
import { chromium } from 'playwright';

const [path = '/research/', prefix = '/tmp/variant', ...variants] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch();
for (const [index, css] of variants.entries()) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await page.goto(`${base}${path}`);
  await page.addStyleTag({ content: css });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${prefix}-${index}.png`, clip: { x: 0, y: 250, width: 1280, height: 200 } });
  console.log(`${prefix}-${index}.png: ${css}`);
  await page.close();
}
await browser.close();
