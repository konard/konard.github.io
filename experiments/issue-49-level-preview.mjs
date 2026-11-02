/* global document, innerHeight */
// Issue #49: "in CORNERS OF THE FRAME we should always see the preview of what
// we configuring at the moment". Opens the corners section of /settings/ on the
// futuristic skin with the custom frame, picks every level, scrolls to the
// bottom of the section and checks that the preview is still under the top bar.
//   node experiments/issue-49-level-preview.mjs [width] [shots-dir]
import { chromium } from 'playwright';

const [width = '1440', dir] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, colorScheme: 'dark' });
await page.addInitScript(() =>
  localStorage.setItem(
    'settings',
    JSON.stringify({ 'skin.name': 'futuristic', 'future.frame': 'custom', 'motion.mode': 'off' }),
  ),
);
await page.goto(`${process.env.BASE || 'http://localhost:3000'}/settings/`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
const levels = await page.$$eval('#corners [role=tablist][aria-label=Levels] [role=tab]', (tabs) =>
  tabs.map((t) => t.id),
);
let failed = 0;
for (const id of levels) {
  await page.click(`#${id}`);
  // The last setting of the section, at the bottom of the screen.
  await page.evaluate(() => {
    const rows = document.querySelectorAll('#corners .setting');
    rows[rows.length - 1].scrollIntoView({ block: 'end' });
  });
  await page.waitForTimeout(150);
  const state = await page.evaluate(() => {
    const bar = document.querySelector('.topbar').getBoundingClientRect();
    const preview = document.querySelector('#corners .level-preview').getBoundingClientRect();
    const samples = document.querySelectorAll('#corners .level-preview__stage *').length;
    return {
      barBottom: Math.round(bar.bottom),
      top: Math.round(preview.top),
      bottom: Math.round(preview.bottom),
      samples,
      inView: preview.top >= bar.bottom - 1 && preview.bottom <= innerHeight,
    };
  });
  if (!state.inView || !state.samples) failed++;
  console.log(id.padEnd(16), JSON.stringify(state));
  if (dir) await page.screenshot({ path: `${dir}/level-preview-${id}.png` });
}
await browser.close();
console.log(failed ? `${failed} levels without a preview in sight` : 'the preview is in sight for every level');
process.exitCode = failed ? 1 : 0;
