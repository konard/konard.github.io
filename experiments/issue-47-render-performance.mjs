/* global requestAnimationFrame */
// Issue #47: "Double check that we use maximum possible performance for UI/UX
// rendering with the same visuals." Measures, for every page of the built site
// in Chromium, how the page renders while it is idle and animating: the frame
// intervals of requestAnimationFrame, long tasks, and the time Chromium spends
// on style, layout, painting and script (CDP Performance.getMetrics) over the
// same window.
//
// Usage: npm run build && node experiments/issue-47-render-performance.mjs [out.json]
//   BASE=http://localhost:4173  measure a running server instead of a preview
//   SECONDS=5                   length of the measured window
//   PAGES=/,/settings/          pages to measure
//   ANIMATIONS=off              measure with the animations button turned off
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = process.env.BASE
  ? null
  : await preview({ preview: { port: 4191, strictPort: true }, logLevel: 'error' });
const base = process.env.BASE || 'http://localhost:4191';
const seconds = Number(process.env.SECONDS || 5);
const pages = (process.env.PAGES || '/,/experience/,/repositories/,/settings/,/network/,/blog/').split(',');
const out = process.argv[2];

const METRICS = [
  'RecalcStyleCount',
  'RecalcStyleDuration',
  'LayoutCount',
  'LayoutDuration',
  'ScriptDuration',
  'TaskDuration',
];
const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

const browser = await chromium.launch();
const results = [];
try {
  for (const path of pages) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    if (process.env.ANIMATIONS === 'off') {
      await context.addInitScript(() => localStorage.setItem('settings', 'settings:\n  motion.mode off'));
    }
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto(base + path + (path.includes('?') ? '&' : '?') + 'lang=en', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const metrics = async () =>
      Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));
    const before = await metrics();
    const frames = await page.evaluate(
      (ms) =>
        new Promise((resolve) => {
          const times = [];
          const long = [];
          const observer = new PerformanceObserver((list) => list.getEntries().forEach((e) => long.push(e.duration)));
          try {
            observer.observe({ type: 'longtask', buffered: false });
          } catch {
            // No long task timing in this browser.
          }
          const start = performance.now();
          const tick = (now) => {
            times.push(now);
            if (now - start < ms) requestAnimationFrame(tick);
            else {
              observer.disconnect();
              resolve({ times, long });
            }
          };
          requestAnimationFrame(tick);
        }),
      seconds * 1000,
    );
    const after = await metrics();
    const gaps = frames.times.slice(1).map((t, i) => t - frames.times[i]);
    const sorted = [...gaps].sort((a, b) => a - b);
    const delta = Object.fromEntries(
      METRICS.map((name) => [
        name,
        name.endsWith('Count') ? after[name] - before[name] : Math.round((after[name] - before[name]) * 1000),
      ]),
    );
    const result = {
      path,
      frames: gaps.length,
      meanFrameMs: +(gaps.reduce((s, g) => s + g, 0) / gaps.length).toFixed(2),
      p95FrameMs: +percentile(sorted, 0.95).toFixed(2),
      maxFrameMs: +sorted[sorted.length - 1].toFixed(2),
      framesOver25ms: gaps.filter((g) => g > 25).length,
      longTasks: frames.long.length,
      longTaskMs: Math.round(frames.long.reduce((s, d) => s + d, 0)),
      // Milliseconds spent in the window (counts are numbers of passes).
      ...delta,
      nodes: after.Nodes,
      jsHeapMB: +(after.JSHeapUsedSize / 2 ** 20).toFixed(1),
    };
    console.log(JSON.stringify(result));
    results.push(result);
    await context.close();
  }
} finally {
  await browser.close();
  await server?.close();
}
if (out)
  await writeFile(
    out,
    JSON.stringify({ seconds, animations: process.env.ANIMATIONS || 'on', results }, null, 2) + '\n',
  );
