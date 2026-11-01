// Issue #47: screenshots of parts of a page (the hero, the top bar, contacts…).
//   node experiments/issue-47-shot.mjs <out.png> <path> [selector] [scheme] [width]
// SETTINGS='{"avatar.angle":45}' stores settings before the page loads.
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { chromium } from 'playwright';

const [out, path = '/', selector = '', scheme = 'dark', width = '1280'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, colorScheme: scheme });
if (process.env.SETTINGS)
  await page.addInitScript((value) => localStorage.setItem('settings', value), process.env.SETTINGS);
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
if (selector) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.screenshot({ path: out });
} else await page.screenshot({ path: out });
await browser.close();
