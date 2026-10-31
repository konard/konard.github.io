// Does every engine accept the `<image> | none` syntax of a registered custom
// property, and does `inherit` on a non-inherited one copy the value of the
// parent to ::after (issue #45)?
//   node experiments/issue-45-image-none-syntax.mjs
/* global document, getComputedStyle, CSS */
import { chromium, firefox, webkit } from 'playwright';

const css = `
@property --img { syntax: '<image> | none'; inherits: true; initial-value: none; }
@property --own { syntax: '*'; inherits: false; }
:root { --w: 2px; --c: red; --img: linear-gradient(to bottom right, transparent 50%, var(--c) 50% calc(50% + var(--w)), transparent 0); }
.none { --img: none; }
.f { --own: var(--img), linear-gradient(var(--c), var(--c)); position: relative; }
.f::after { content: ''; --own: inherit; background-image: var(--own); position: absolute; inset: 0; }
`;
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div class="f">a</div><div class="none"><span>b</span></div>`);
    const result = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        registered: CSS.registerProperty ? 'yes' : 'no',
        rootImg: root.getPropertyValue('--img'),
        noneImg: getComputedStyle(document.querySelector('.none span')).getPropertyValue('--img'),
        child: getComputedStyle(document.querySelector('.f')).getPropertyValue('--own'),
        after: getComputedStyle(document.querySelector('.f'), '::after').backgroundImage,
      };
    });
    console.log(name, JSON.stringify(result));
  } finally {
    await browser.close();
  }
}
