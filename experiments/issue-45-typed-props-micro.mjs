// Which kinds of root custom properties stay cheap in WebKit when the root
// restyles (issue #45)? 1000 divs, 300 of them "framed": they declare their
// own non-inherited polygon from typed lengths of the root. Prints the restyle
// times after a variable on <html> changes.
//   [ENGINE=webkit] node experiments/issue-45-typed-props-micro.mjs
/* global document, getComputedStyle */
import { chromium, firefox, webkit } from 'playwright';

const engine = process.env.ENGINE || 'webkit';
const browser = await { chromium, firefox, webkit }[engine].launch();
const reg = (name, syntax, inherits, initial) =>
  `@property ${name} { syntax: '${syntax}'; inherits: ${inherits};${initial ? ` initial-value: ${initial};` : ''} }`;
const N = 60;
const lengths = (syntax) =>
  Array.from({ length: N }, (_, i) => reg(`--l${i}`, syntax, true, syntax === '*' ? '' : '0px')).join('\n') +
  `\n:root { --n: 2; ${Array.from({ length: N }, (_, i) => `--l${i}: calc(var(--n) * ${i}px);`).join(' ')} }`;
const polygon = `polygon(${Array.from({ length: N / 2 }, (_, i) => `calc(100% - var(--l${2 * i})) var(--l${2 * i + 1})`).join(', ')})`;
const cases = {
  typedLengths: lengths('<length>'),
  untypedLengths: lengths('*'),
  typedColor: `${reg('--c', '<color>', true, 'black')} :root { --a: 255 0 0; --c: rgb(var(--a) / 0.5); }`,
  typedImage: `${reg('--g', '<image>', true, 'linear-gradient(red, red)')} :root { --a: 255 0 0; --w: 2px; ${Array.from({ length: 1 }, () => '').join('')} --g: linear-gradient(to bottom right, transparent 50%, rgb(var(--a)) 50% calc(50% + var(--w)), transparent 0); }`,
  ownPolygonNonInherited: `${lengths('<length>')}\n${reg('--own', '*', false)}\n.f { --own: ${polygon}; clip-path: var(--own); }`,
  ownPolygonInherited: `${lengths('<length>')}\n.f { --own: ${polygon}; clip-path: var(--own); }`,
  directPolygon: `${lengths('<length>')}\n.f { clip-path: ${polygon}; }`,
};
try {
  const page = await browser.newPage();
  for (const [name, css] of Object.entries(cases)) {
    const body =
      Array.from({ length: 300 }, () => '<div class="f"><div>x</div><div>y</div></div>').join('') +
      '<div>z</div>'.repeat(100);
    await page.setContent(`<style>${css}</style><body>${body}</body>`);
    const result = await page.evaluate(() => {
      void document.body.offsetHeight;
      const out = [];
      for (let round = 0; round < 6; round += 1) {
        const start = performance.now();
        document.documentElement.style.setProperty('--probe', String(round));
        void document.body.offsetHeight;
        out.push(Math.round((performance.now() - start) * 10) / 10);
      }
      const f = document.querySelector('.f');
      const root = getComputedStyle(document.documentElement);
      return {
        out,
        clip: getComputedStyle(f).clipPath.slice(0, 60),
        color: root.getPropertyValue('--c'),
        image: root.getPropertyValue('--g').slice(0, 60),
        childOwn: getComputedStyle(f.firstElementChild).getPropertyValue('--own').slice(0, 30),
      };
    });
    console.log(JSON.stringify({ name, ...result }));
  }
} finally {
  await browser.close();
}
