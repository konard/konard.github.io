// How does WebKit's restyle cost grow with the inherited custom properties of
// the root (issue #45)? A blank page with N plain divs; the root declares P
// custom properties of T tokens each (plain values, or values that use var()).
// A variable on <html> changes and a box is read.
//   [ENGINE=webkit] node experiments/issue-45-custom-props-micro.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';

const engine = process.env.ENGINE || 'webkit';
const browser = await { chromium, firefox, webkit }[engine].launch();
const cases = [
  { props: 0, tokens: 1, usesVar: false },
  { props: 20, tokens: 1, usesVar: false },
  { props: 300, tokens: 1, usesVar: false },
  { props: 20, tokens: 200, usesVar: false },
  { props: 20, tokens: 200, usesVar: true },
  { props: 300, tokens: 20, usesVar: true },
  { props: 20, tokens: 20, usesVar: true },
  { props: 1, tokens: 1, usesVar: true },
  { props: 300, tokens: 1, usesVar: true },
  // Registered as one typed length each: the root computes a single length.
  { props: 300, tokens: 1, usesVar: true, syntax: '<length>' },
  { props: 300, tokens: 1, usesVar: true, syntax: '*' },
  // Not inherited: the descendants do not get them.
  { props: 300, tokens: 20, usesVar: true, syntax: '*', inherits: false },
];
try {
  const page = await browser.newPage();
  for (const c of cases) {
    const value = (i) =>
      Array.from({ length: c.tokens }, (_, t) => (c.usesVar ? `calc(var(--n) * ${t + i}px)` : `${t + i}px`)).join(' ');
    const registered = c.syntax
      ? Array.from(
          { length: c.props },
          (_, i) =>
            `@property --p${i} { syntax: '${c.syntax}'; inherits: ${c.inherits ?? true};${c.syntax === '*' ? '' : ' initial-value: 0px;'} }`,
        ).join('\n')
      : '';
    const css = `${registered}\n:root { --n: 2; ${Array.from({ length: c.props }, (_, i) => `--p${i}: ${value(i)};`).join(' ')} }`;
    await page.setContent(`<style>${css}</style><body>${'<div>x</div>'.repeat(1000)}</body>`);
    const times = await page.evaluate(() => {
      void document.body.offsetHeight;
      const out = [];
      for (let round = 0; round < 6; round += 1) {
        const start = performance.now();
        document.documentElement.style.setProperty('--probe', String(round));
        void document.body.offsetHeight;
        out.push(Math.round((performance.now() - start) * 10) / 10);
      }
      return out;
    });
    console.log(JSON.stringify({ ...c, times }));
  }
} finally {
  await browser.close();
}
