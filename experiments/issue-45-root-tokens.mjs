// Which inherited custom properties does every element of /settings/ get from
// the root, and how many of them keep var() (issue #45)? WebKit compares the
// inherited custom properties of every element it restyles, and an unregistered
// value with var() costs as much as its tokens. Lists the root properties that
// are not registered and whose specified value uses var(), longest first, and
// times a restyle with those values frozen to their computed tokens (FREEZE=1;
// FREEZE=<regex> freezes only the names it matches).
//   [ENGINE=webkit] [FREEZE=1|regex] [SHOW=25] [LOOK='{"key":value}'] node experiments/issue-45-root-tokens.mjs
/* global document, getComputedStyle, CSSStyleRule, CSSMediaRule, CSSSupportsRule, CSSLayerBlockRule, matchMedia */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4258);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(
    (settings) => localStorage.setItem('settings', settings),
    JSON.stringify({ 'motion.mode': 'off', ...look }),
  );
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
    polling: 250,
    timeout: 120000,
  });
  const time = () =>
    page.evaluate(() => {
      const out = [];
      for (let round = 0; round < 7; round += 1) {
        const start = performance.now();
        document.documentElement.style.setProperty('--probe', String(Math.random()));
        void document.body.offsetHeight;
        out.push(performance.now() - start);
      }
      return out.slice(1);
    });
  const found = await page.evaluate(() => {
    const registered = new Set();
    const specified = new Map();
    const root = document.documentElement;
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.constructor.name === 'CSSPropertyRule') registered.add(rule.name);
        else if (rule instanceof CSSStyleRule) {
          let matches;
          try {
            matches = root.matches(rule.selectorText);
          } catch {
            matches = false; // A selector this engine does not parse.
          }
          if (!matches) continue;
          for (const name of rule.style) {
            if (name.startsWith('--')) specified.set(name, rule.style.getPropertyValue(name));
          }
        } else if (
          rule instanceof CSSMediaRule ||
          rule instanceof CSSSupportsRule ||
          (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule)
        ) {
          if (!(rule instanceof CSSMediaRule) || matchMedia(rule.conditionText || rule.media.mediaText).matches)
            walk(rule.cssRules);
        }
      }
    };
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules);
      } catch {
        // A sheet of another origin.
      }
    }
    for (const name of root.style) if (name.startsWith('--')) specified.set(name, root.style.getPropertyValue(name));
    const computed = getComputedStyle(root);
    const list = [...specified]
      .filter(([name, value]) => !registered.has(name) && value.includes('var('))
      .map(([name, value]) => ({ name, length: value.length, computed: computed.getPropertyValue(name).trim() }))
      .sort((a, b) => b.length - a.length);
    return {
      elements: document.querySelectorAll('*').length,
      rootCustom: specified.size,
      registered: registered.size,
      withVar: list.length,
      withVarChars: list.reduce((sum, item) => sum + item.length, 0),
      list,
    };
  });
  const before = await time();
  console.log(
    JSON.stringify({
      engine,
      elements: found.elements,
      rootCustom: found.rootCustom,
      registered: found.registered,
      withVar: found.withVar,
      withVarChars: found.withVarChars,
      restyleMs: Math.round(median(before)),
    }),
  );
  for (const item of found.list.slice(0, Number(process.env.SHOW || 25)))
    console.log(`  ${item.name} (${item.length} chars)`);
  if (process.env.FREEZE) {
    // The same values as plain tokens: what the var() costs, not the values.
    const only = process.env.FREEZE === '1' ? null : new RegExp(process.env.FREEZE);
    const chosen = found.list.filter((item) => !only || only.test(item.name));
    await page.evaluate((list) => {
      for (const item of list)
        if (item.computed) document.documentElement.style.setProperty(item.name, item.computed, 'important');
    }, chosen);
    const after = await time();
    console.log(JSON.stringify({ frozen: chosen.length, restyleMs: Math.round(median(after)) }));
  }
} finally {
  await browser.close();
  await server.close();
}
