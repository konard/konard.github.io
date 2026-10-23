// Screenshot of a page with given settings (issue #13): the settings are put
// into localStorage before the page loads, exactly as /settings/ saves them.
//
//   node experiments/settings-shot.mjs <path> '<settings JSON>' <out.png> [light|dark] [scrollY|full] [width]
//
// e.g. node experiments/settings-shot.mjs / '{"skin.name":"liquid"}' liquid.png dark
// ENGINE=webkit or ENGINE=firefox takes another browser engine instead of Chromium.
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
// Prints the console errors of the page, so a broken page fails loudly.
/* global document, window */
import { chromium, firefox, webkit } from 'playwright';

const [path = '/', json = '{}', out = 'shot.png', theme = 'dark', scroll = '0', width = '1280'] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:4173';

const browser = await { chromium, firefox, webkit }[process.env.ENGINE || 'chromium'].launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, colorScheme: theme });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
await page.addInitScript(
  ([settings, choice]) => {
    if (!sessionStorage.getItem('shot')) {
      localStorage.setItem('settings', settings);
      localStorage.setItem('theme', choice);
      sessionStorage.setItem('shot', '1');
    }
  },
  [json, theme],
);
await page.goto(`${base}${path}`);
await page.waitForTimeout(2500);
if (scroll !== 'full' && Number(scroll)) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scroll));
  await page.waitForTimeout(800);
}
await page.screenshot({ path: out, fullPage: scroll === 'full' });
const skin = await page.evaluate(() => document.documentElement.dataset.skinName);
console.log(`${out}: skin ${skin}, theme ${theme}${errors.length ? `, errors: ${errors.join(' | ')}` : ''}`);
await browser.close();
