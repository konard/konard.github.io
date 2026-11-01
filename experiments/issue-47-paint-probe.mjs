/* global document, requestAnimationFrame */
// Issue #47 (C5, "maximum possible performance for UI/UX rendering with the
// same visuals"): finds what makes the frames of an animated page slow. It
// turns off one kind of drawing at a time with an injected stylesheet and
// measures the frame gaps of requestAnimationFrame; the variant that brings the
// frames back to the display rate names the cost.
//
// Usage: npm run build && node experiments/issue-47-paint-probe.mjs [path] [out.json]
//   BASE=http://localhost:4173  measure a running server instead of a preview
//   ENGINE=firefox|webkit       another browser (default chromium)
//   SECONDS=3                   length of each measured window
import { writeFile } from 'node:fs/promises';
import * as pw from 'playwright';
import { preview } from 'vite';

const [path = '/', out] = process.argv.slice(2);
const server = process.env.BASE
  ? null
  : await preview({ preview: { port: 4192, strictPort: true }, logLevel: 'error' });
const base = process.env.BASE || 'http://localhost:4192';
const seconds = Number(process.env.SECONDS || 3);
const all = '*, *::before, *::after';
const VARIANTS = {
  base: '',
  'no backdrop-filter': `${all} { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,
  'no filter': `${all} { filter: none !important; }`,
  'no box-shadow': `${all} { box-shadow: none !important; }`,
  'no clip-path': `${all} { clip-path: none !important; }`,
  'no CSS animations': `${all} { animation: none !important; transition: none !important; }`,
  'no background layers': '.cosmos { display: none !important; }',
  ...Object.fromEntries(
    ['universe', 'stars', 'grid', 'beams', 'rain'].map((layer) => [
      `no ${layer}`,
      `.cosmos__${layer} { display: none !important; }`,
    ]),
  ),
};

const browser = await pw[process.env.ENGINE || 'chromium'].launch();
const results = [];
try {
  for (const [name, css] of Object.entries(VARIANTS)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}${path}?lang=en`, { waitUntil: 'networkidle' });
    if (css) await page.addStyleTag({ content: css });
    await page.waitForTimeout(1500);
    const gaps = await page.evaluate(
      (ms) =>
        new Promise((resolve) => {
          const times = [];
          const tick = (now) => {
            times.push(now);
            if (now - times[0] < ms) requestAnimationFrame(tick);
            else resolve(times.slice(1).map((t, i) => t - times[i]));
          };
          requestAnimationFrame(tick);
        }),
      seconds * 1000,
    );
    const layers = await page.evaluate(() =>
      [...document.querySelectorAll('.cosmos > *')].map((e) => `${e.className}:${e.width ?? ''}x${e.height ?? ''}`),
    );
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const result = { variant: name, frames: gaps.length, meanFrameMs: +mean.toFixed(1), layers };
    console.log(JSON.stringify(result));
    results.push(result);
    await page.close();
  }
} finally {
  await browser.close();
  await server?.close();
}
if (out) await writeFile(out, JSON.stringify({ path, seconds, results }, null, 2) + '\n');
