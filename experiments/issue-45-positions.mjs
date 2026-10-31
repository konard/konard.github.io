// Checks that the corner layer on top (issue #45), which makes framed panels
// position: relative for their ::after overlay, moves no absolutely positioned
// element: the boxes of every absolute element are compared with the layer on
// top and below on every page.
//   node experiments/issue-45-positions.mjs
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
/* global document, getComputedStyle, scrollY, scrollX */
import { chromium } from 'playwright';

const PAGES = [
  '/',
  '/experience/',
  '/repositories/',
  '/research/',
  '/associative/',
  '/art/',
  '/blog/',
  '/archive/',
  '/network/',
  '/settings/',
  '/cv/',
];
const browser = await chromium.launch();
const boxes = async (path, layer) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript((s) => localStorage.setItem('settings', s), JSON.stringify({ 'corner.layer': layer }));
  await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`);
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((element) => getComputedStyle(element).position === 'absolute')
      // Animated layers (the drifting grid, the rain, the pulsing ring) move with time, not with the layer.
      .filter((element) => !element.closest('.cosmos') && !element.getAnimations().length)
      .map((element) => {
        const r = element.getBoundingClientRect();
        const name = `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;
        return [name, Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
      }),
  );
  await page.close();
  return result;
};
let moved = 0;
for (const path of PAGES) {
  const [top, below] = [await boxes(path, 'top'), await boxes(path, 'below')];
  const differ = top.filter((box, i) => JSON.stringify(box) !== JSON.stringify(below[i]));
  moved += differ.length;
  console.log(
    path,
    `${top.length} absolute elements`,
    differ.length ? `MOVED: ${JSON.stringify(differ.slice(0, 5))}` : 'none moved',
  );
  if (top.length !== below.length) console.log('  count differs', top.length, below.length);
}
console.log(moved ? `FAIL: ${moved} moved` : 'OK: nothing moved');
await browser.close();
process.exit(moved ? 1 : 0);
