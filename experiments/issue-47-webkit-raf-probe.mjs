/* global window, document, requestAnimationFrame -- page code run by Playwright */
// Counts requestAnimationFrame callbacks and timer ticks on a page in headless WebKit (issue #47).
// Usage: node experiments/issue-47-webkit-raf-probe.mjs [url] [extra-css] [browser]
// Prints one line per second; rAF that stops while timers go on means the page stopped rendering.
import * as playwright from 'playwright';

const url = process.argv[2] || 'http://localhost:4173/';
const css = process.argv[3] || '';
const browser = await playwright[process.argv[4] || 'webkit'].launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.addInitScript((css) => {
  window.__raf = 0;
  window.__timer = 0;
  const tick = () => {
    window.__raf++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setInterval(() => window.__timer++, 100);
  if (css)
    document.addEventListener('DOMContentLoaded', () =>
      document.head.append(Object.assign(document.createElement('style'), { textContent: css })),
    );
}, css);
await page.goto(url);
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(1000);
  console.log(JSON.stringify(await page.evaluate(() => ({ raf: window.__raf, timer: window.__timer }))));
}
await browser.close();
