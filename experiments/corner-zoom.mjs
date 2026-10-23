// A close look at the corners of one panel (issue #15, custom frames): opens a
// page with the given settings at 3× device pixels and saves one element.
//   node experiments/corner-zoom.mjs <path> '<settings JSON>' <selector> <out.png> [light|dark]
/* global document */
import { chromium } from 'playwright';

const [path = '/', json = '{}', selector = '.stat', out = 'zoom.png', theme = 'dark'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 3,
  colorScheme: theme,
});
await page.addInitScript(
  ([settings, choice]) => {
    localStorage.setItem('settings', settings);
    localStorage.setItem('theme', choice);
  },
  [json, theme],
);
await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`);
await page.waitForTimeout(1500);
const element = page.locator(selector).first();
await element.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await element.screenshot({ path: out });
console.log(out, await page.evaluate(() => document.documentElement.dataset.futureFrame));
await browser.close();
