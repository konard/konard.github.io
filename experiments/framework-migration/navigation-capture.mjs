// Bound the cold-load probe to three pages. Preserve raw matrix differences;
// inspect whether the unchanged navigation's font-time centering is stable.
/* global document */
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const root = '/tmp/issue54-renderings';
const id = 'chromium-default-dark-mobile-art';
const before = PNG.sync.read(await readFile(`${root}/baseline/${id}.png`));
const after = PNG.sync.read(await readFile(`${root}/after/${id}.png`));
const diff = new PNG({ width: before.width, height: before.height });
const changedPixels = pixelmatch(before.data, after.data, diff.data, before.width, before.height, {
  threshold: 0.1,
  diffMask: true,
});
const bounds = { left: before.width, top: before.height, right: 0, bottom: 0 };
for (let y = 0; y < before.height; y++) {
  for (let x = 0; x < before.width; x++) {
    if (!diff.data[(y * before.width + x) * 4 + 3]) continue;
    bounds.left = Math.min(bounds.left, x);
    bounds.right = Math.max(bounds.right, x);
    bounds.top = Math.min(bounds.top, y);
    bounds.bottom = Math.max(bounds.bottom, y);
  }
}
const look = JSON.parse(await readFile('docs/case-studies/issue-54/data/presets-before.json')).default;
const samples = [];
for (let i = 0; i < 3; i++) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.addInitScript((look) => {
      localStorage.setItem('lang', 'en');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('settings', JSON.stringify({ ...look, 'motion.mode': 'off' }));
    }, look);
    await page.goto(`${process.env.BASE || 'http://127.0.0.1:3001'}/art/#symbols`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const measure = () =>
      page.locator('.pages ul').evaluate((list) => {
        const current = list.querySelector('[aria-current="page"]').getBoundingClientRect();
        return { scrollLeft: list.scrollLeft, currentLeft: current.left, currentRight: current.right };
      });
    const initial = await measure();
    await page.waitForTimeout(1000);
    samples.push({ initial, later: await measure() });
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ changedPixels, bounds, samples }, null, 2));
