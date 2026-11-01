// Issue #47 (C5): which selectors make the style recalculations of an animated
// page slow. Records Chromium's selector statistics (the "Enable CSS selector
// stats" of DevTools) for a few seconds and prints the selectors that took the
// longest to match, with the number of match attempts.
//
// Usage: npm run build && node experiments/issue-47-selector-stats.mjs [path] [out.json]
//   CSS="…"  a stylesheet injected before the trace
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const [path = '/', out] = process.argv.slice(2);
const server = await preview({ preview: { port: 4196, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
let top;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:4196${path}?lang=en`, { waitUntil: 'networkidle' });
  if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
  await page.waitForTimeout(1500);
  await browser.startTracing(page, {
    categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-blink.debug'],
  });
  await page.waitForTimeout(3000);
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const stats = {};
  let events = 0;
  for (const e of trace.traceEvents) {
    const list = e.args?.selector_stats?.selector_timings;
    if (!list) continue;
    events++;
    for (const s of list) {
      const k = s.selector;
      const t = (stats[k] ||= { us: 0, attempts: 0, matches: 0 });
      t.us += s['elapsed (us)'] ?? 0;
      t.attempts += s.match_attempts ?? 0;
      t.matches += s.match_count ?? 0;
    }
  }
  const total = Object.values(stats).reduce((s, t) => s + t.us, 0);
  top = Object.entries(stats)
    .sort((a, b) => b[1].us - a[1].us)
    .slice(0, 15)
    .map(([selector, t]) => ({ ms: +(t.us / 1000).toFixed(1), ...t, selector: selector.slice(0, 300) }));
  console.log(JSON.stringify({ events, totalMs: +(total / 1000).toFixed(1), selectors: Object.keys(stats).length }));
  for (const t of top) console.log(t.ms, 'ms', t.attempts, 'attempts', t.matches, 'matches:', t.selector.slice(0, 200));
} finally {
  await browser.close();
  await server.close();
}
if (out) await writeFile(out, JSON.stringify({ path, top }, null, 2) + '\n');
