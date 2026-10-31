// Screenshots of the element samples (src/pages/UiSamples.jsx, issue #45) for
// several looks, plus glitch checks in the browser.
//   [THEME=light] node experiments/issue-45-samples.mjs <out-dir> [name=json ...]
// Without looks it shots the defaults and every futuristic frame.
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
/* global document, getSelection, scrollX, scrollY */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [dir = 'samples', ...pairs] = process.argv.slice(2);
const FRAMES = ['custom', 'corners', 'chamfer', 'octagon', 'kranox', 'bracket', 'lines', 'underline', 'plain'];
const looks = pairs.length
  ? pairs.map((pair) => [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)])
  : FRAMES.map((frame) => [frame, JSON.stringify({ 'future.frame': frame })]);
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
for (const [name, look] of looks) {
  const theme = process.env.THEME || 'dark';
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.addInitScript(
    ([s, t]) => {
      localStorage.setItem('settings', s);
      localStorage.setItem('theme', t);
    },
    [look, theme],
  );
  await page.goto(`${process.env.BASE || 'http://localhost:4173'}/settings/`);
  await page.waitForTimeout(1200);
  // The sticky top bar would cover the top of the samples in the shot.
  await page.addStyleTag({ content: '.topbar { position: static !important; }' });
  const samples = page.locator('.ui-samples');
  await samples.scrollIntoViewIfNeeded();
  // Select some text in the text area and in the first panel to see the selection colours.
  await page.evaluate(() => {
    const p = document.querySelector('.ui-samples .card p');
    const range = document.createRange();
    range.selectNodeContents(p);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  });
  await page.waitForTimeout(400);
  // A margin round the box keeps the outer edges of the frames in the shot.
  const box = await samples.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
  });
  const clip = { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 };
  await page.screenshot({ path: `${dir}/${name}.png`, clip, fullPage: true });
  console.log(`${dir}/${name}.png`);
  await page.close();
}
await browser.close();
