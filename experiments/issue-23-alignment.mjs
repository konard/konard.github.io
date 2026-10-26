// Finite site-wide alignment audit: every HTML entry, both languages/themes,
// all skins, desktop and phone. Scrolling navigation/tables remain intentional.
/* global window, document, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
const phase = process.env.PHASE || 'after';
const output = 'docs/case-studies/issue-23';
const paths = [
  '/',
  '/experience/',
  '/repositories/',
  '/research/',
  '/associative/',
  '/art/',
  '/blog/',
  '/cv/',
  '/settings/',
  '/network/?code=112212',
];
const server = await preview({ preview: { port: 4179, strictPort: true } });
let browser;
const results = [];
const errors = [];
try {
  browser = await chromium.launch();
  await mkdir(`${output}/screenshots`, { recursive: true });
  for (const skin of ['glass', 'liquid', 'futuristic'])
    for (const theme of ['dark', 'light'])
      for (const lang of ['en', 'ru'])
        for (const width of [360, 1440]) {
          const context = await browser.newContext({
            viewport: { width, height: width === 360 ? 844 : 1000 },
            reducedMotion: 'reduce',
          });
          await context.addInitScript(
            ({ skin, theme, lang }) => {
              localStorage.setItem('theme', theme);
              localStorage.setItem('lang', lang);
              localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'skin.name': skin }));
            },
            { skin, theme, lang },
          );
          const page = await context.newPage();
          page.setDefaultTimeout(15000);
          page.on('pageerror', (error) => errors.push(error.message));
          for (const path of paths) {
            await page.goto(`http://localhost:4179${path}`);
            await page.locator('main').waitFor();
            await page.evaluate(() => document.fonts.ready);
            const issues = await page.evaluate(() => {
              const viewport = document.documentElement.clientWidth;
              const issues = [];
              if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push('document overflow');
              for (const node of document.querySelectorAll(
                'main input, main select, main button, main textarea, main summary, .topbar__row > *',
              )) {
                if (node.closest('details:not([open])') && node.tagName !== 'SUMMARY') continue;
                const box = node.getBoundingClientRect();
                if (!box.width || !box.height) continue;
                let parent = node.parentElement;
                let scrolling = false;
                while (parent && parent !== document.body) {
                  const overflow = getComputedStyle(parent).overflowX;
                  if (['auto', 'scroll', 'hidden', 'clip'].includes(overflow)) {
                    scrolling = true;
                    break;
                  }
                  parent = parent.parentElement;
                }
                if (!scrolling && (box.left < -1 || box.right > viewport + 1))
                  issues.push(
                    `${node.tagName} ${node.id || node.className}: ${Math.round(box.left)}..${Math.round(box.right)}`,
                  );
                const container = node.closest('.link-gaps fieldset, .setting, .network__panel');
                if (container && !node.closest('.links-table__scroll')) {
                  const outer = container.getBoundingClientRect();
                  if (box.right > outer.right + 1 || box.left < outer.left - 1)
                    issues.push(`control outside ${container.className}: ${node.id || node.type}`);
                }
              }
              const row = document.querySelector('.topbar__row');
              if (row) {
                const boxes = [...row.children].map((n) => n.getBoundingClientRect());
                for (let i = 0; i < boxes.length; i++)
                  for (let j = i + 1; j < boxes.length; j++) {
                    const x = Math.min(boxes[i].right, boxes[j].right) - Math.max(boxes[i].left, boxes[j].left);
                    const y = Math.min(boxes[i].bottom, boxes[j].bottom) - Math.max(boxes[i].top, boxes[j].top);
                    if (x > 1 && y > 1) issues.push('overlapping header controls');
                  }
              }
              return issues;
            });
            results.push({ skin, theme, lang, width, path, issues });
            if (issues.length) {
              console.log(JSON.stringify(results.at(-1)));
              await page.screenshot({ path: `${output}/screenshots/${phase}-alignment-failure-${results.length}.png` });
            }
            if (theme === 'dark' && lang === 'ru' && width === 360 && path.startsWith('/network/'))
              await page.screenshot({ path: `${output}/screenshots/${phase}-mobile-${skin}.png`, fullPage: true });
          }
          console.log(`audited ${skin} ${theme} ${lang} ${width}`);
          await context.close();
        }
  assert.deepEqual(errors, []);
  assert.deepEqual(
    results.filter((result) => result.issues.length),
    [],
  );
} finally {
  await writeFile(`${output}/data/alignment-${phase}.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
  await browser?.close();
  await server.close();
}
