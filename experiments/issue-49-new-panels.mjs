/* global getComputedStyle */
// Issue #49: the career cards of the experience page and the calendar of
// contributions had a border that no setting changed; they are panels now.
// Screenshots both with the custom frame of the futuristic skin.
//   node experiments/issue-49-new-panels.mjs <dir>
import { chromium } from 'playwright';

const dir = process.argv[2] || '/tmp';
const settings = { 'skin.name': 'futuristic', 'future.frame': 'custom', 'motion.mode': 'off' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.addInitScript((s) => localStorage.setItem('settings', s), JSON.stringify(settings));
for (const [path, selector, name] of [
  ['/experience/', '.profession', 'profession'],
  ['/', '.contribution-calendar', 'contribution-calendar'],
]) {
  await page.goto(`${process.env.BASE || 'http://localhost:3000'}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const el = page.locator(selector).first();
  if (!(await el.count())) {
    console.log(`${selector}: not on ${path}`);
    continue;
  }
  await el.scrollIntoViewIfNeeded();
  console.log(selector, await el.evaluate((node) => getComputedStyle(node).clipPath.slice(0, 60)));
  await el.screenshot({ path: `${dir}/${name}.png` });
}
await browser.close();
