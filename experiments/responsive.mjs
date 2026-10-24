// Every page on every screen size (issue #15: "perfect look on all screen sizes"),
// against `npx vite preview --port 4173` (or BASE=...). For each page and width,
// in the dark and the light theme, it checks that nothing scrolls sideways, lists
// the elements that stick out of the screen, checks that the current page is seen
// in the top bar with at least three pages, and saves the first screen of every page.
// main fails 7 of these checks (the top bar of phones), this branch none.
//   node experiments/responsive.mjs <screenshot dir> [paths...]
/* global window, document, getComputedStyle */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [dir = '/tmp/responsive', ...rest] = process.argv.slice(2);
const paths = rest.length
  ? rest
  : ['/', '/art/', '/associative/', '/blog/', '/cv/', '/experience/', '/repositories/', '/research/', '/settings/'];
const widths = [
  [360, 780],
  [768, 1024],
  [1280, 800],
  [1920, 1080],
];
const base = process.env.BASE || 'http://localhost:4173';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const failures = [];

for (const theme of ['dark', 'light']) {
  for (const [width, height] of widths) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: theme,
      isMobile: width < 800,
      hasTouch: width < 800,
      deviceScaleFactor: width < 800 ? 2 : 1,
    });
    await context.addInitScript((theme) => window.localStorage.setItem('theme', theme), theme);
    for (const path of paths) {
      const page = await context.newPage();
      page.on('pageerror', (error) => failures.push(`${path} ${width}: ${error.message}`));
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(600);
      const result = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const out = [];
        for (const element of document.body.querySelectorAll('*')) {
          if (element.closest('.cosmos, [aria-hidden="true"], .sr-only, svg')) continue;
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') continue;
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height) continue;
          // An element inside a scrolling box (a table, a carousel) may be wider than the screen.
          let scroller = element.parentElement;
          let scrolled = false;
          while (scroller && scroller !== document.body) {
            const overflow = getComputedStyle(scroller).overflowX;
            if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden' || overflow === 'clip') {
              scrolled = true;
              break;
            }
            scroller = scroller.parentElement;
          }
          if (scrolled) continue;
          if (box.right > viewport + 1 || box.left < -1) {
            const name = `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? `.${element.className.trim().split(/\s+/).join('.')}` : ''}`;
            out.push(`${name} ${Math.round(box.left)}…${Math.round(box.right)}`);
          }
        }
        // The link of the current page is seen in the top bar, and at least three pages are at
        // least half seen (the cut ones at the edges show that the list scrolls).
        const list = document.querySelector('.pages ul');
        const strip = list?.getBoundingClientRect();
        const seen = (link, share = 1) => {
          const box = link.getBoundingClientRect();
          const visible = Math.min(box.right, strip.right) - Math.max(box.left, strip.left);
          return visible >= box.width * share - 1;
        };
        const links = list ? [...list.querySelectorAll('a')] : [];
        const current = links.find((link) => link.getAttribute('aria-current') === 'page');
        if (current && !seen(current)) out.push('the current page is hidden in the top bar');
        const half = links.filter((link) => seen(link, 0.5)).length;
        if (links.length && half < 3) out.push(`${half} pages seen in the top bar`);
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          out: out.slice(0, 8),
        };
      });
      const label = `${theme} ${String(width).padStart(4)} ${path}`;
      if (result.overflow > 0 || result.out.length) {
        failures.push(`${label}: scrolls ${result.overflow}px; ${result.out.join(', ')}`);
        console.log('FAIL', label, result.overflow, result.out.join(', '));
      } else console.log('ok  ', label);
      if (theme === 'dark' || width === 360) {
        const name = path === '/' ? 'home' : path.replaceAll('/', '');
        await page.screenshot({ path: `${dir}/${name}-${width}-${theme}.png` });
      }
      await page.close();
    }
    await context.close();
  }
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} problems:\n${failures.join('\n')}`);
  process.exit(1);
}
