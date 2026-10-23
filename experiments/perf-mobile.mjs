// Loading on a phone with the default settings (issue #15: "make sure our site loads fast on mobile
// devices with these default settings"). Against `npx vite preview --port 4173` (or BASE=...):
// a 412×915 screen at 2.6 dppx, the CPU slowed four times and a slow 4G network (Lighthouse's
// mobile profile: 150 ms, 1.6 Mbit/s down, 750 kbit/s up). For every page it prints the first and
// the largest contentful paint, the bytes and the scripts downloaded, the time of the long tasks
// while loading and the frames per second of the background in the next three seconds.
//   node experiments/perf-mobile.mjs [paths...] [--json file]
/* global window, document, requestAnimationFrame */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const jsonFile = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const paths = args.length ? args : ['/', '/settings/', '/art/', '/blog/', '/cv/'];
const base = process.env.BASE || 'http://localhost:4173';
const runs = Number(process.env.RUNS || 3);
// SETTINGS='{"nebula.on":false}' measures with these settings on top of the defaults.
const settings = process.env.SETTINGS || null;

const browser = await chromium.launch();
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function measure(path) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0;
  const scripts = [];
  cdp.on('Network.loadingFinished', (event) => (bytes += event.encodedDataLength));
  page.on('request', (request) => request.resourceType() === 'script' && scripts.push(request.url().split('/').pop()));
  await page.addInitScript((settings) => {
    if (settings) window.localStorage.setItem('settings', settings);
    window.__perf = { lcp: 0, longTasks: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__perf.longTasks += entry.duration - 50;
    }).observe({ type: 'longtask', buffered: true });
  }, settings);
  await page.goto(`${base}${path}`, { waitUntil: 'load' });
  // SETTLE=6000 lets the layers adapt to the device before the frames are counted.
  await page.waitForTimeout(Number(process.env.SETTLE || 1500));
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = (now) => {
          frames++;
          if (now - start < 3000) requestAnimationFrame(tick);
          else
            resolve({
              fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
              lcp: window.__perf.lcp,
              tbt: window.__perf.longTasks,
              fps: (frames * 1000) / (now - start),
              canvases: document.querySelectorAll('canvas').length,
            });
        };
        requestAnimationFrame(tick);
      }),
  );
  await context.close();
  return { ...result, kb: bytes / 1024, scripts: scripts.length };
}

const report = [];
for (const path of paths) {
  const all = [];
  for (let run = 0; run < runs; run++) all.push(await measure(path));
  const pick = (key) => Math.round(median(all.map((r) => r[key])));
  const row = {
    path,
    fcp: pick('fcp'),
    lcp: pick('lcp'),
    tbt: pick('tbt'),
    fps: pick('fps'),
    kb: pick('kb'),
    scripts: pick('scripts'),
    canvases: pick('canvases'),
  };
  report.push(row);
  console.log(
    `${path.padEnd(16)} FCP ${String(row.fcp).padStart(5)} ms  LCP ${String(row.lcp).padStart(5)} ms  ` +
      `long tasks ${String(row.tbt).padStart(5)} ms  ${String(row.fps).padStart(3)} fps  ` +
      `${String(row.kb).padStart(5)} kB in ${row.scripts} scripts, ${row.canvases} canvases`,
  );
}
if (jsonFile) writeFileSync(jsonFile, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
