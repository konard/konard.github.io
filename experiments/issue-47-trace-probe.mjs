// Issue #47 (C5): where the time of an animated page goes in Chromium. Records
// a trace of a few seconds and sums the durations of complete events by name
// and thread, so painting, rasterizing and compositing can be told apart from
// script, style and layout.
//
// Usage: npm run build && node experiments/issue-47-trace-probe.mjs [path] [out.json]
//   BASE=http://localhost:4173  measure a running server instead of a preview
//   ARGS="--enable-gpu-rasterization"  extra Chromium flags
//   CSS="…"                     a stylesheet injected before the trace
//   THREAD=CrRendererMain       only the events of one thread
//   JS="…"                      a script run in the page before the trace
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const [path = '/', out] = process.argv.slice(2);
const server = process.env.BASE
  ? null
  : await preview({ preview: { port: 4193, strictPort: true }, logLevel: 'error' });
const base = process.env.BASE || 'http://localhost:4193';
const browser = await chromium.launch({ args: (process.env.ARGS || '').split(' ').filter(Boolean) });
let summary;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}${path}?lang=en`, { waitUntil: 'networkidle' });
  if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
  if (process.env.JS) await page.evaluate(process.env.JS);
  await page.waitForTimeout(1500);
  await browser.startTracing(page, {
    categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'gpu', 'viz', 'blink'],
  });
  await page.waitForTimeout(3000);
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const threads = Object.fromEntries(
    trace.traceEvents.filter((e) => e.name === 'thread_name').map((e) => [`${e.pid}:${e.tid}`, e.args.name]),
  );
  const totals = {};
  // Style recalculations: how many, and how many elements they restyled.
  const styles = { recalcs: 0, elements: 0, frames: 0 };
  for (const e of trace.traceEvents) {
    if (e.name === 'UpdateLayoutTree' && e.args?.elementCount !== undefined) {
      styles.recalcs++;
      styles.elements += e.args.elementCount;
    }
    if (e.name === 'BeginMainThreadFrame') styles.frames++;
    if (e.ph !== 'X' || !e.dur) continue;
    if (process.env.THREAD && threads[`${e.pid}:${e.tid}`] !== process.env.THREAD) continue;
    const key = `${threads[`${e.pid}:${e.tid}`] || e.tid} ${e.name}`;
    totals[key] = (totals[key] || 0) + e.dur / 1000;
  }
  summary = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name, ms]) => [name, Math.round(ms)]);
  for (const [name, ms] of summary) console.log(String(ms).padStart(7), 'ms ', name);
  console.log(JSON.stringify(styles));
  summary.push(['styles', styles]);
} finally {
  await browser.close();
  await server?.close();
}
if (out) await writeFile(out, JSON.stringify({ path, seconds: 3, summary }, null, 2) + '\n');
