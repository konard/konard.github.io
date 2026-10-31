// Which stylesheet makes a full restyle of /settings/ slow (issue #45)? Times
// a variable written on <html> with every stylesheet on, then with each one
// off in turn, then with each top-level rule of the costliest sheet off.
//   [ENGINE=chromium] [SHEET=ui.css] [LOOK='{"key":value}'] [PORT=4266] node experiments/issue-45-sheet-cost.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4266);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
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
  await page.waitForTimeout(2000);
  const result = await page.evaluate((rule) => {
    const root = document.documentElement;
    const time = () => {
      const runs = [];
      for (let i = 0; i < 7; i += 1) {
        const start = performance.now();
        root.style.setProperty('--probe', String(Math.random()));
        void document.body.offsetHeight;
        runs.push(performance.now() - start);
      }
      return Math.round(runs.sort((a, b) => a - b)[3] * 10) / 10;
    };
    const sheets = [...document.styleSheets];
    const name = (sheet) => (sheet.href || sheet.ownerNode?.dataset?.viteDevId || 'inline').replace(/^.*\/src\//, '');
    const all = time();
    const bySheet = sheets.map((sheet) => {
      sheet.disabled = true;
      const ms = time();
      sheet.disabled = false;
      return { sheet: name(sheet), rules: sheet.cssRules.length, savedMs: Math.round((all - ms) * 10) / 10 };
    });
    bySheet.sort((a, b) => b.savedMs - a.savedMs);
    // Each style rule of the chosen sheet, also inside @media, removed in turn.
    const byRule = [];
    const target = sheets.find((sheet) => name(sheet).endsWith(rule));
    const walk = (list) => {
      for (let i = 0; i < list.cssRules.length; i += 1) {
        const item = list.cssRules[i];
        if (item.cssRules && !item.selectorText) {
          walk(item);
          continue;
        }
        const text = item.cssText;
        list.deleteRule(i);
        const ms = time();
        list.insertRule(text, i);
        byRule.push({ savedMs: Math.round((all - ms) * 10) / 10, rule: text.slice(0, 110).replace(/\s+/g, ' ') });
      }
    };
    if (target) walk(target);
    byRule.sort((a, b) => b.savedMs - a.savedMs);
    return {
      elements: document.querySelectorAll('*').length,
      all,
      byRule: byRule.slice(0, 15),
      none: (() => {
        sheets.forEach((s) => (s.disabled = true));
        const ms = time();
        sheets.forEach((s) => (s.disabled = false));
        return ms;
      })(),
      bySheet: bySheet.slice(0, 12),
    };
  }, process.env.SHEET || '');
  console.log(JSON.stringify({ engine, look, ...result }, null, 1));
} finally {
  await browser.close();
  await server.close();
}
