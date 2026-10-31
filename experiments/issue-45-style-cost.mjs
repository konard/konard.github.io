// Which stylesheet makes a change on <html> expensive (issue #45)? A setting
// writes a variable or an attribute on <html>, so every element computes its
// style again. This times that full restyle on /settings/ with every sheet on,
// then with one sheet off at a time (the Vite dev server serves every CSS file
// as its own <style>), and prints the sheets that cost the most.
// RULES=skins.future.css times every rule of that sheet in the same way.
//   [ENGINE=chromium] [LOOK='{"key":value}'] [PAGE=/settings/] [RULES=sheet] [PORT=4251] node experiments/issue-45-style-cost.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4251);
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
  await page.goto(`http://localhost:${PORT}${process.env.PAGE || '/settings/'}?lang=en`);
  await page.locator('main').waitFor();
  await page.waitForTimeout(1500);
  const result = await page.evaluate((only) => {
    const root = document.documentElement;
    const restyle = (rounds = 15) => {
      const start = performance.now();
      for (let i = 0; i < rounds; i += 1) {
        root.style.setProperty('--probe', String(i));
        // Reading a box makes the browser compute every style now.
        void document.body.offsetHeight;
      }
      return (performance.now() - start) / rounds;
    };
    restyle(5);
    const all = Math.min(restyle(), restyle());
    const sheets = [...document.styleSheets].map((sheet) => {
      const owner = sheet.ownerNode;
      const name = owner?.dataset?.viteDevId?.replace(/^.*\/src\//, '') || owner?.href || owner?.nodeName;
      sheet.disabled = true;
      const without = Math.min(restyle(), restyle());
      sheet.disabled = false;
      return { name, rules: sheet.cssRules.length, savedMs: Math.round((all - without) * 10) / 10 };
    });
    const deep = [...document.styleSheets].find((sheet) => only && sheet.ownerNode?.dataset?.viteDevId?.endsWith(only));
    const rules = deep
      ? [...deep.cssRules]
          .map((rule, index) => {
            const text = rule.cssText;
            deep.deleteRule(index);
            const without = Math.min(restyle(8), restyle(8));
            deep.insertRule(text, index);
            return { index, savedMs: Math.round((all - without) * 10) / 10, rule: text.slice(0, 160) };
          })
          .sort((a, b) => b.savedMs - a.savedMs)
          .slice(0, 10)
      : undefined;
    const none = (() => {
      for (const sheet of document.styleSheets) sheet.disabled = true;
      const time = restyle();
      for (const sheet of document.styleSheets) sheet.disabled = false;
      return time;
    })();
    return {
      elements: document.querySelectorAll('*').length,
      restyleMs: Math.round(all * 10) / 10,
      withoutCssMs: Math.round(none * 10) / 10,
      sheets: sheets.sort((a, b) => b.savedMs - a.savedMs).slice(0, 8),
      rules,
    };
  }, process.env.RULES || '');
  console.log(JSON.stringify({ engine, look, ...result }, null, 1));
} finally {
  await browser.close();
  await server.close();
}
