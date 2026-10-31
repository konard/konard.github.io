// Which selectors cost the most in a full restyle of /settings/ (issue #45)?
// Records a Chromium trace with selector statistics while a variable on <html>
// changes, and prints the selectors that took the most time, with how often
// they were tried and how often they matched.
// The frame selectors are also summed on their own.
//   [PAGE=/settings/] [TOP=25] [FILTER=text] [PORT=4263] node experiments/issue-45-selector-stats.mjs
/* global document */
import { chromium } from 'playwright';
import { createServer } from 'vite';

const PORT = Number(process.env.PORT || 4263);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' })));
  await page.goto(`http://localhost:${PORT}${process.env.PAGE || '/settings/'}?lang=en`, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
    polling: 250,
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  const events = [];
  cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
  const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.start', {
    traceConfig: { includedCategories: ['disabled-by-default-blink.debug', 'disabled-by-default-devtools.timeline'] },
  });
  await page.evaluate(() => {
    for (let i = 0; i < 3; i += 1) {
      document.documentElement.style.setProperty('--probe', String(i + Math.random()));
      void document.body.offsetHeight;
    }
  });
  await cdp.send('Tracing.end');
  await done;
  const totals = new Map();
  for (const event of events) {
    const timings = event.args?.selector_stats?.selector_timings;
    if (!timings) continue;
    for (const t of timings) {
      const old = totals.get(t.selector) || { us: 0, attempts: 0, matches: 0, fast: 0 };
      old.us += t['elapsed (us)'];
      old.attempts += t.match_attempts;
      old.matches += t.match_count;
      old.fast += t.fast_reject_count;
      totals.set(t.selector, old);
    }
  }
  const all = [...totals.entries()].sort((a, b) => b[1].us - a[1].us);
  const total = all.reduce((sum, [, t]) => sum + t.us, 0);
  console.log(`selectors ${all.length}, total ${Math.round(total / 1000)} ms in 3 restyles`);
  // The selectors of the custom frame (src/skins.frames*.css) on their own.
  const frames = all.filter(([s]) => /data-corner-|data-future-frame="custom"|data-ui-border-style/.test(s));
  const framesUs = frames.reduce((sum, [, t]) => sum + t.us, 0);
  console.log(`frame selectors ${frames.length}, ${Math.round(framesUs / 1000)} ms in 3 restyles`);
  const filter = process.env.FILTER;
  for (const [selector, t] of all
    .filter(([s]) => !filter || s.includes(filter))
    .slice(0, Number(process.env.TOP || 25)))
    console.log(
      `${(t.us / 1000).toFixed(1).padStart(7)} ms ${String(t.attempts).padStart(7)} tried ${String(t.matches).padStart(6)} matched  ${selector.replace(/\s+/g, ' ').slice(0, 150)}`,
    );
} finally {
  await browser.close();
  await server.close();
}
