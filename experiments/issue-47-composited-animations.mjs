// Issue #47 (C5): which animations of the home page Chromium cannot run on the
// compositor, with its reasons (the "Animation" trace events): those are
// sampled on the main thread on every frame.
// Usage: npm run build && node experiments/issue-47-composited-animations.mjs
import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4195, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await browser.startTracing(page, {
  categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.animations'],
});
await page.goto('http://localhost:4195/?lang=en', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const trace = JSON.parse((await browser.stopTracing()).toString());
const seen = {};
for (const e of trace.traceEvents)
  if (e.name === 'Animation' && e.args?.data) {
    const d = e.args.data;
    const k = (d.name || '') + ' ' + JSON.stringify({ f: d.compositeFailed, u: d.unsupportedProperties });
    if (d.compositeFailed !== undefined || d.name) seen[k] = (seen[k] || 0) + 1;
  }
console.log(seen);
await browser.close();
await server.close();
