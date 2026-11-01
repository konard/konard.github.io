/* global document, getComputedStyle */
// Issue #47: finds framed elements whose cut corners are not transparent.
// A framed element of the custom frame has an outline (--fx-el-clip, or the
// clip-path of a control); its corners are transparent only when the element
// (or a layer of its surface) is clipped to that outline. The script lists
// every framed element on a page whose surface is not clipped, and saves a
// close look of the corners of the first chart.
//   node experiments/issue-47-corners.mjs [out-dir] [engine] [paths…]
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { mkdirSync } from 'node:fs';
import * as pw from 'playwright';

const [dir = '/tmp/issue-47-corners', engine = 'chromium', ...paths] = process.argv.slice(2);
const PATHS = paths.length ? paths : ['/', '/experience/', '/repositories/', '/research/', '/settings/'];
mkdirSync(dir, { recursive: true });
const browser = await pw[engine].launch();
const report = {};
for (const path of PATHS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  report[path] = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      const outline = cs.getPropertyValue('--fx-el-clip').trim();
      if (!outline || outline === 'none') continue;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      // The surface is clipped when the element is, or when its surface layer is.
      const surface = getComputedStyle(el, '::before');
      const clipped = cs.clipPath !== 'none' || (surface.content !== 'none' && surface.clipPath !== 'none');
      if (!clipped)
        out.push({
          element:
            el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''),
          background: cs.backgroundColor,
          backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
          shadow: cs.boxShadow.slice(0, 40),
        });
    }
    return out;
  });
  console.log(path, JSON.stringify(report[path], null, 1));
  const chart = page.locator('.chart').first();
  if (await chart.count()) {
    await chart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const b = await chart.boundingBox();
    const name = path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'cv';
    await page.screenshot({
      path: `${dir}/${engine}-${name}-chart-tl.png`,
      clip: { x: b.x - 8, y: b.y - 8, width: 120, height: 70 },
    });
    await page.screenshot({
      path: `${dir}/${engine}-${name}-chart-br.png`,
      clip: { x: b.x + b.width - 112, y: b.y + b.height - 62, width: 120, height: 70 },
    });
  }
  await page.close();
}
await browser.close();
const total = Object.values(report).reduce((n, list) => n + list.length, 0);
console.log(`framed elements with corners that are not transparent: ${total}`);
