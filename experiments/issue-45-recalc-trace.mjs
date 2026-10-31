// What makes one key press on a settings slider compute styles again (issue
// #45)? A Chromium trace of a single key press: every style recalculation with
// its element count, time and the script that forced it.
//   [SLIDER=setting-future-cut] [KEY=ArrowUp] [LOOK='{"key":value}'] [PORT=4259] node experiments/issue-45-recalc-trace.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';

const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4259);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(
    (settings) => localStorage.setItem('settings', settings),
    JSON.stringify({ 'motion.mode': 'off', ...look }),
  );
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`);
  await page.locator('main').waitFor();
  await page.waitForTimeout(1500);
  const input = page.locator(`#${process.env.SLIDER || 'setting-future-cut'}`);
  await input.focus();
  await input.press('ArrowDown');
  await page.waitForTimeout(500);
  await browser.startTracing(page, {
    categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing'],
  });
  await input.press(process.env.KEY || 'ArrowUp');
  await input.inputValue();
  await page.waitForTimeout(300);
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const events = trace.traceEvents.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
  const rows = events.map((e) => {
    const stack = e.args?.beginData?.stackTrace || [];
    return {
      ms: Math.round((e.dur / 1000) * 10) / 10,
      elements: e.args?.elementCount,
      by: stack
        .slice(0, 3)
        .map((f) => `${f.functionName || '?'}@${f.url?.replace(/^.*\/src\//, '').replace(/\?.*$/, '')}:${f.lineNumber}`)
        .join(' < '),
    };
  });
  const total = rows.reduce((sum, row) => sum + row.ms, 0);
  console.log(JSON.stringify({ look, recalcs: rows.length, totalMs: Math.round(total), rows }, null, 1));
} finally {
  await browser.close();
  await server.close();
}
