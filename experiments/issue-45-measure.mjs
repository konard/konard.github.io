// Measures boxes on the settings page (issue #45 debugging helper).
//   node experiments/issue-45-measure.mjs '<js expression returning JSON>' [look.json string]
import { chromium } from 'playwright';

const [expr, look = '{}'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  colorScheme: process.env.THEME || 'dark',
});
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.addInitScript((s) => localStorage.setItem('settings', s), look);
await page.goto(`${process.env.BASE || 'http://localhost:4173'}${process.env.PAGE || '/settings/'}`);
await page.waitForTimeout(1000);
console.log(JSON.stringify(await page.evaluate(expr), null, 1));
await browser.close();
