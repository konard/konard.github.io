/* global document, Image */
// Issue #47: compares two PNG screenshots in a browser canvas and reports the
// box and number of pixels that differ (no image library in the project).
// Usage: node experiments/issue-47-png-diff.mjs a.png b.png
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [a, b] = process.argv.slice(2);
const urls = await Promise.all(
  [a, b].map(async (f) => `data:image/png;base64,${(await readFile(f)).toString('base64')}`),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async (srcs) => {
    const load = (src) =>
      new Promise((r) =>
        Object.assign(new Image(), {
          onload() {
            r(this);
          },
          src,
        }),
      );
    const [x, y] = await Promise.all(srcs.map(load));
    if (x.width !== y.width || x.height !== y.height) return { size: [x.width, x.height, y.width, y.height] };
    const data = (img) => {
      const c = document.createElement('canvas');
      Object.assign(c, { width: img.width, height: img.height });
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, img.width, img.height).data;
    };
    const [p, q] = [data(x), data(y)];
    let count = 0,
      max = 0;
    const box = [Infinity, Infinity, -1, -1];
    for (let i = 0; i < p.length; i += 4) {
      const d = Math.max(...[0, 1, 2].map((k) => Math.abs(p[i + k] - q[i + k])));
      if (!d) continue;
      count++;
      max = Math.max(max, d);
      const px = (i / 4) % x.width,
        py = Math.floor(i / 4 / x.width);
      box[0] = Math.min(box[0], px);
      box[1] = Math.min(box[1], py);
      box[2] = Math.max(box[2], px);
      box[3] = Math.max(box[3], py);
    }
    return { width: x.width, height: x.height, differing: count, maxChannelDiff: max, box: count ? box : null };
  }, urls);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
