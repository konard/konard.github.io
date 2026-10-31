// Does the number of inherited custom properties of the root cost WebKit on
// every element that declares a custom property of its own (issue #45)? 1800
// elements, like the settings page. The root carries R registered <length>
// properties (plain values, no var()); a share of the elements declares one
// custom property, inherited or not. Prints the median restyle after a
// variable on <html> changes.
//   [ENGINE=webkit] node experiments/issue-45-inherited-count-micro.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';

const engine = process.env.ENGINE || 'webkit';
const browser = await { chromium, firefox, webkit }[engine].launch();
const reg = (name, syntax, inherits, initial) =>
  `@property ${name} { syntax: '${syntax}'; inherits: ${inherits};${initial ? ` initial-value: ${initial};` : ''} }`;
const root = (count, registered, inherits = true) =>
  Array.from({ length: count }, (_, i) => (registered ? reg(`--r${i}`, '<length>', inherits, '0px') : '')).join('\n') +
  `\n:root { ${Array.from({ length: count }, (_, i) => `--r${i}: ${i}px;`).join(' ')} }`;
const own = {
  none: '',
  inherited: '.o { --mine: 1px; }',
  notInherited: `${reg('--mine', '*', false)} .o { --mine: 1px; }`,
};
const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
try {
  const page = await browser.newPage();
  for (const count of [0, 100, 500]) {
    for (const registered of count ? [true, false] : [true]) {
      for (const [ownName, ownCss] of Object.entries(own)) {
        const css = `${root(count, registered)}\n${ownCss}`;
        // 600 elements declare their own property, 1200 do not.
        const body =
          Array.from({ length: 300 }, () => '<div class="o"><span>x</span><i class="o">y</i></div>').join('') +
          '<p><b>z</b></p>'.repeat(450);
        await page.setContent(`<style>${css}</style><body>${body}</body>`);
        const out = await page.evaluate(() => {
          void document.body.offsetHeight;
          const times = [];
          for (let round = 0; round < 9; round += 1) {
            const start = performance.now();
            document.documentElement.style.setProperty('--probe', String(round));
            void document.body.offsetHeight;
            times.push(performance.now() - start);
          }
          return times.slice(1);
        });
        console.log(JSON.stringify({ count, registered, own: ownName, medianMs: Math.round(median(out) * 10) / 10 }));
      }
    }
  }
} finally {
  await browser.close();
}
