// Issue #13: after a refresh or a click on a menu item, the rain (and the stars
// of the nebula) are sometimes "scaled up too much". Safari may run
// `<script type="module">` before the stylesheet is applied (WebKit bug 261655,
// https://bugs.webkit.org/show_bug.cgi?id=261655), so both canvases are measured
// at the default canvas size of 300×150 and then stretched over the screen.
//
// This loads the built site (npm run build; npx vite preview --port 4173) in
// Chromium and, with `late`, attaches the stylesheet only after the scripts ran,
// which is what Safari does. It prints how much each canvas is stretched: 1 means
// the bitmap matches the screen, more than 1 is the bug.
//
//   node experiments/rain-scale.mjs [base-url] [late|normal] [screenshot.png]
/* global document */
import { chromium } from 'playwright';
import { delayedStylesheets } from './delayed-stylesheets.mjs';

const base = process.argv[2] || 'http://localhost:4173';
const late = (process.argv[3] || 'late') === 'late';

const measure = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      ['.cosmos__rain', '.cosmos__universe'].map((selector) => {
        const c = document.querySelector(selector);
        const r = c.getBoundingClientRect();
        return [selector, { bitmap: [c.width, c.height], css: [Math.round(r.width), Math.round(r.height)] }];
      }),
    ),
  );

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
if (late)
  await page.route(/\/(index\.html)?$|\/[a-z]+\/$/, async (route) => {
    const response = await route.fetch();
    const html = delayedStylesheets(await response.text());
    await route.fulfill({ response, body: html });
  });
let failed = false;
for (const [step, act] of [
  ['load', () => page.goto(`${base}/repositories/`)],
  ['menu click', () => page.click('a[href="/research/"]')],
  ['reload', () => page.reload()],
]) {
  await act();
  await page.waitForTimeout(1200);
  const sizes = await measure(page);
  for (const [selector, { bitmap, css }] of Object.entries(sizes)) {
    // The nebula renders at 0.6 of the device resolution on purpose.
    const ratio = selector === '.cosmos__universe' ? 2 * 0.6 : 2;
    const stretch = +(css[0] / (bitmap[0] / ratio)).toFixed(2);
    if (Math.abs(stretch - 1) > 0.05) failed = true;
    console.log(
      `${step.padEnd(10)} ${selector.padEnd(18)} bitmap ${bitmap.join('×')} on ${css.join('×')}: stretched ×${stretch}`,
    );
  }
  if (step === 'load' && process.argv[4]) await page.screenshot({ path: process.argv[4] });
}
await browser.close();
console.log(failed ? 'FAIL: a background canvas is stretched' : 'OK: the canvases match the screen');
process.exit(failed ? 1 : 0);
