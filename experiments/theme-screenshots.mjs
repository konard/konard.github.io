// Screenshots every page of the site in the light and the dark theme (issue #11).
//
// Usage (with a dev or preview server on port 4173):
//   npx vite --port 4173 --strictPort &
//   NODE_PATH=$(npm root -g) node experiments/theme-screenshots.mjs [baseUrl] [outDir] [page...]
//
// Screens are 1280x900 (top of the page only) and are saved as
// theme-<page>-<light|dark>.png. Set FULL=1 for full-page shots and
// SCROLL=<px> to scroll before the shot (both are for local checks only).
// DUMP=<file.json> skips the screenshots and writes the computed colours of
// every element instead, to prove that a refactoring keeps a theme unchanged:
// dump before and after, then compare the two files.
/* global document, window, getComputedStyle -- page.evaluate callbacks run in the browser. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] || 'http://localhost:4173';
const out = process.argv[3] || 'docs/case-studies/issue-11/screenshots';
const PAGES = { home: '/', experience: '/experience/', repositories: '/repositories/', research: '/research/' };
Object.assign(PAGES, { associative: '/associative/', art: '/art/', blog: '/blog/' });
const only = process.argv.slice(4);
const names = only.length ? only : Object.keys(PAGES);
const scroll = Number(process.env.SCROLL || 0);
const suffix = process.env.SUFFIX || '';
const dump = process.env.DUMP;
const themes = (process.env.THEMES || 'light,dark').split(',');
const colours = {};
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-left-color'];
PROPS.push('box-shadow', 'filter', 'fill', 'stroke', 'mask-image', 'opacity', 'outline-color');

/** The computed colours of every element of the page, as 'selector-path prop: value' lines. */
const collect = (props) =>
  [...document.querySelectorAll('body *')].flatMap((el, i) => {
    const style = getComputedStyle(el);
    const id = `${i}:${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).replace(/ /g, '.')}`;
    return props.map((p) => `${id} ${p}: ${style.getPropertyValue(p)}`);
  });

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const theme of themes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error(`[${theme}] page error:`, e.message));
  for (const name of names) {
    await page.goto(base + PAGES[name], { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    if (dump) {
      colours[`${name}-${theme}`] = await page.evaluate(collect, PROPS);
      continue;
    }
    if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
    if (scroll) await page.waitForTimeout(300);
    const file = join(out, `theme-${name}-${theme}${suffix}.png`);
    // The animated canvases are slow under swiftshader: retry a timed-out shot once.
    const shoot = () => page.screenshot({ path: file, fullPage: Boolean(process.env.FULL), timeout: 90000 });
    await shoot().catch(shoot);
    const actual = await page.evaluate(() => document.documentElement.dataset.theme);
    console.log(file, actual);
  }
  await context.close();
}
await browser.close();
if (dump) writeFileSync(dump, JSON.stringify(colours, null, 1));
