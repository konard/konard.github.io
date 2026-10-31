// Which rules of the futuristic stylesheet make a full restyle slow (issue #45)?
// Deletes the rules of skins.future.css in blocks of BLOCK rules, one block at a
// time, and times a full restyle of the page without them. Each block runs in
// its own evaluate, so it also works in WebKit, where a restyle takes long.
//   [ENGINE=webkit] [PAGE=/settings/] [BLOCK=10] [SHEET=skins.future.css] [PORT=4259] node experiments/issue-45-rule-blocks.mjs
/* global document, window */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const PORT = Number(process.env.PORT || 4259);
const BLOCK = Number(process.env.BLOCK || 10);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' })));
  await page.goto(`http://localhost:${PORT}${process.env.PAGE || '/settings/'}?lang=en`, { waitUntil: 'commit' });
  // Polling by timer: headless WebKit on Linux runs no animation frames here.
  await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
    polling: 250,
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const total = await page.evaluate((name) => {
    const root = document.documentElement;
    const sheet = [...document.styleSheets].find((s) => s.ownerNode?.dataset?.viteDevId?.endsWith(name));
    const once = () => {
      const start = performance.now();
      root.style.setProperty('--probe', String(Math.random()));
      void document.body.offsetHeight;
      return performance.now() - start;
    };
    const measure = () => {
      once();
      return Math.round(Math.min(once(), once(), once()));
    };
    window.blocks = { sheet, measure, texts: [...sheet.cssRules].map((rule) => rule.cssText) };
    return sheet.cssRules.length;
  }, process.env.SHEET || 'skins.future.css');
  const all = await page.evaluate(() => window.blocks.measure());
  console.log(JSON.stringify({ engine, rules: total, allMs: all }));
  for (let from = 0; from < total; from += BLOCK) {
    const out = await page.evaluate(
      ([start, count]) => {
        const { sheet, measure, texts } = window.blocks;
        const removed = texts.slice(start, start + count);
        for (let i = 0; i < removed.length; i += 1) sheet.deleteRule(start);
        const ms = measure();
        removed.forEach((text, i) => sheet.insertRule(text, start + i));
        return { ms, first: removed[0].slice(0, 110).replace(/\s+/g, ' ') };
      },
      [from, BLOCK],
    );
    console.log(
      JSON.stringify({
        rules: `${from}-${Math.min(total, from + BLOCK) - 1}`,
        savedMs: all - out.ms,
        first: out.first,
      }),
    );
  }
} finally {
  await browser.close();
  await server.close();
}
