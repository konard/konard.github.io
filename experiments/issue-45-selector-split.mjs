// Does splitting `A :where(b, c, ...)` into `A :where(b), A :where(c), ...`
// make a full restyle cheaper (issue #45)? The frame rules declare the corner
// variables on the root and on every framed element; with the framed elements
// in one `:where()` list the browser cannot file the rule under a class or a
// tag and tries it on every element. This rewrites those rules in the page and
// times a full restyle of /settings/ (a variable written on <html>):
//   original - the rules as generated;
//   split    - one complex selector per framed element, each in its own :where();
//   bare     - the same without :where() (other specificity, only for comparison);
//   matching - split, and the rules whose root condition fails now are dropped;
//   rootOnly - only the root part of each rule (the cost of the framed part).
//   [ENGINE=chromium] [MODES=original,split,matching,rootOnly] [ROUNDS=6] [VERBOSE=1] [PAGE=/settings/] [PORT=4255] node experiments/issue-45-selector-split.mjs
/* global document, window */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const PORT = Number(process.env.PORT || 4255);
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
  await page.evaluate(
    (rounds) => {
      const root = document.documentElement;
      const restyle = (count = rounds) => {
        const start = performance.now();
        for (let i = 0; i < count; i += 1) {
          root.style.setProperty('--probe', String(i + Math.random()));
          void document.body.offsetHeight;
        }
        return (performance.now() - start) / count;
      };
      const measure = () => {
        restyle(1);
        return Math.round(Math.min(restyle(), restyle(), restyle()) * 10) / 10;
      };
      // Split a list at its top level commas.
      const split = (text) => {
        const parts = [];
        let depth = 0;
        let start = 0;
        for (let i = 0; i < text.length; i += 1) {
          if (text[i] === '(') depth += 1;
          else if (text[i] === ')') depth -= 1;
          else if (text[i] === ',' && depth === 0) {
            parts.push(text.slice(start, i).trim());
            start = i + 1;
          }
        }
        parts.push(text.slice(start).trim());
        return parts;
      };
      // `A :where(b, c)` -> [`A :where(b)`, `A :where(c)`] when the :where() ends the selector.
      const expand = (selector, wrap) => {
        const at = selector.lastIndexOf(':where(');
        if (at < 0 || !selector.endsWith(')')) return [selector];
        const inside = selector.slice(at + ':where('.length, -1);
        if (split(inside).length < 2 || inside.split('(').length !== inside.split(')').length) return [selector];
        return split(inside).map((part) => selector.slice(0, at) + (wrap ? `:where(${part})` : part));
      };
      const sheets = [...document.styleSheets].filter((sheet) => {
        try {
          return [...sheet.cssRules].some((rule) => rule.selectorText?.includes(':where(.card'));
        } catch {
          return false;
        }
      });
      const originals = sheets.map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText));
      let rewritten = 0;
      const rewrite = (mode) => {
        rewritten = 0;
        sheets.forEach((sheet, s) => {
          while (sheet.cssRules.length) sheet.deleteRule(0);
          originals[s].forEach((text, index) => {
            const brace = text.indexOf('{');
            const selectors = split(text.slice(0, brace));
            const framed = mode !== 'original' && selectors.some((sel) => /:where\((\.card|button:not)/.test(sel));
            let next = framed ? selectors.flatMap((sel) => expand(sel, mode !== 'bare')) : selectors;
            if (framed) rewritten += 1;
            const rootPart = selectors[0];
            // matching: only the rules whose root condition holds now (no rule fails at the root).
            if (mode === 'matching' && framed && !root.matches(rootPart)) next = [':root:not(:root)'];
            // rootOnly: the framed elements inherit the values of the root (wrong scale; only the cost).
            if (mode === 'rootOnly' && framed) next = [rootPart];
            sheet.insertRule(`${next.join(', ')} ${text.slice(brace)}`, index);
          });
        });
      };
      window.probe = { rewrite, measure, rewritten: () => rewritten, sheets: sheets.length };
    },
    Number(process.env.ROUNDS || 6),
  );
  const result = {
    elements: await page.evaluate(() => document.querySelectorAll('*').length),
    sheets: await page.evaluate(() => window.probe.sheets),
  };
  for (const mode of (process.env.MODES || 'original,split,bare,original').split(',')) {
    const [ms, rules] = await page.evaluate((m) => {
      window.probe.rewrite(m);
      return [window.probe.measure(), window.probe.rewritten()];
    }, mode);
    const key = mode === 'original' && result.original !== undefined ? 'originalAgain' : mode;
    result[key] = ms;
    if (mode !== 'original') result[`${mode}Rules`] = rules;
    if (process.env.VERBOSE) console.error(engine, mode, ms);
  }
  console.log(JSON.stringify({ engine, ...result }));
} finally {
  await browser.close();
  await server.close();
}
