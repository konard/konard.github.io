// One full restyle of a page, timed in any engine (issue #45). A variable is
// written on <html> and a box is read, so every element computes its style.
// Prints the time of the first restyles one by one (no animation frames needed,
// so it also runs in headless WebKit on Linux).
//   [ENGINE=webkit] [EXTRA_CSS='…'] [PAGE=/settings/] [LOOK='{"key":value}'] [ROUNDS=5] [PORT=4257] node experiments/issue-45-restyle-once.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4257);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
const started = Date.now();
const log = (...args) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s]`, ...args);
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(
    (settings) => localStorage.setItem('settings', settings),
    JSON.stringify({ 'motion.mode': 'off', ...look }),
  );
  await page.goto(`http://localhost:${PORT}${process.env.PAGE || '/settings/'}?lang=en`, { waitUntil: 'commit' });
  log('committed');
  await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
    polling: 250,
    timeout: 120000,
  });
  log('rendered');
  // EXTRA_CSS adds a style sheet to try a change without editing the sources.
  if (process.env.EXTRA_CSS) await page.addStyleTag({ content: process.env.EXTRA_CSS });
  for (let round = 0; round < Number(process.env.ROUNDS || 5); round += 1) {
    const ms = await page.evaluate((i) => {
      const start = performance.now();
      document.documentElement.style.setProperty('--probe', String(i));
      void document.body.offsetHeight;
      return Math.round((performance.now() - start) * 10) / 10;
    }, round);
    log('restyle', ms, 'ms', 'elements', await page.evaluate(() => document.querySelectorAll('*').length));
  }
} finally {
  await browser.close();
  await server.close();
}
