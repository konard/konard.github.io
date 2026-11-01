/* global document, getComputedStyle, Image */
// Crops a region of an image with Playwright (no image library needed).
// Usage: node experiments/issue-47-crop.mjs <image> <out> <x> <y> <w> <h> [scale]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [img, out, x, y, w, h, scale = '3'] = process.argv.slice(2);
const data = readFileSync(img).toString('base64');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w * +scale, height: +h * +scale } });
await page.setContent(
  `<body style="margin:0;overflow:hidden"><div style="width:${+w * +scale}px;height:${+h * +scale}px;background:url(data:image/png;base64,${data}) -${+x * +scale}px -${+y * +scale}px / auto;image-rendering:pixelated"></div></body>`,
);
await page.evaluate((s) => {
  const d = document.querySelector('div');
  const i = new Image();
  i.src = getComputedStyle(d).backgroundImage.slice(5, -2);
  return i.decode().then(() => (d.style.backgroundSize = `${i.naturalWidth * s}px ${i.naturalHeight * s}px`));
}, +scale);
await page.screenshot({ path: out });
await browser.close();
