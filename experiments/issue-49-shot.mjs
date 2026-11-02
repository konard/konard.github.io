// Issue #49: screenshots of a page or an element.
//   node experiments/issue-49-shot.mjs <out.png> <path> [selector] [width] [height] [full]
// SETTINGS='<settings text>' stores settings before the page loads; BASE overrides the URL
// (default: the dev server at http://localhost:3000).
import { chromium } from 'playwright';

const [out, path = '/', selector = '', width = '1440', height = '900', full = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) }, colorScheme: 'dark' });
if (process.env.SETTINGS)
  await page.addInitScript((value) => localStorage.setItem('settings', value), process.env.SETTINGS);
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${process.env.BASE || 'http://localhost:3000'}${path}`, { waitUntil: 'load' });
await page.waitForTimeout(Number(process.env.WAIT || 2500));
if (selector) {
  const el = page.locator(selector).first();
  await page.addStyleTag({ content: 'header, nav, .topbar, .subnav { position: static !important; }' });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.screenshot({ path: out });
} else await page.screenshot({ path: out, fullPage: full === 'full' });
await browser.close();
