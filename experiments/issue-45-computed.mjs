// Computed styles of elements on a page with a look (issue #45).
//   node experiments/issue-45-computed.mjs <path> <selector> <prop,prop> [look.json-string]
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
/* global document, getComputedStyle */
import { chromium } from 'playwright';

const [path = '/settings/', selector = 'button', props = 'background', look = '{}'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript((s) => localStorage.setItem('settings', s), look);
await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`);
await page.waitForTimeout(1200);
const result = await page.evaluate(
  ([sel, names]) =>
    [...document.querySelectorAll(sel)].slice(0, 4).map((element) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(names.split(',').map((name) => [name, style.getPropertyValue(name)]));
    }),
  [selector, props],
);
console.log(JSON.stringify(result, null, 2));
await browser.close();
