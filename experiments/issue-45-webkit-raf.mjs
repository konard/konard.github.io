// Probe: requestAnimationFrame runs on a blank page in local headless WebKit (issue #45),
// though it does not on the site (experiments/issue-45-frame-rate.mjs).
/* global requestAnimationFrame */
import { webkit } from 'playwright';
const browser = await webkit.launch();
const page = await browser.newPage();
await page.setContent('<p>hi</p>');
const result = await Promise.race([
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve('raf ran')))),
  new Promise((resolve) => setTimeout(() => resolve('raf did not run in 5 s'), 5000)),
]);
console.log(result);
await page
  .locator('p')
  .screenshot({ path: '/tmp/issue-45-webkit-raf.png', timeout: 8000 })
  .then(
    () => console.log('element screenshot ok'),
    (e) => console.log('element screenshot failed:', e.message.split('\n')[0]),
  );
await browser.close();
