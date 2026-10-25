// A finite, isolated gallery probe. Run under issue-19-memory-guard.py on Linux.
/* global document, window, getComputedStyle */
import { webkit } from 'playwright';
import { preview } from 'vite';

const mode = process.env.PROBE || 'baseline';
const overrides = {
  baseline: '',
  noBackdrop: '* { backdrop-filter: none !important; }',
  contain: '.symbols__grid li, .repo { contain: paint; }',
  noBlur: ':root { --glass-blur: 0px !important; }',
  noGalleryBackdrop: '.symbols__grid li { backdrop-filter: none !important; }',
  noRepoBackdrop: '.repo { backdrop-filter: none !important; }',
  visible: '.symbols__grid li, .repo { content-visibility: auto; contain-intrinsic-size: auto 100px; }',
  isolate: '.symbols__grid, .repos { isolation: isolate; }',
  noBarBackdrop: '.topbar { backdrop-filter: none !important; }',
  clipBar: '.topbar { overflow: clip; }',
  shortPage: '.repo { display: none !important; }',
  noCanvas: '.cosmos { display: none !important; }',
  clipPanels: '.symbols__grid li, .repo { overflow: hidden; }',
};
if (!(mode in overrides)) throw new Error(`Unknown mode ${mode}`);
const server = await preview({ preview: { port: 4179, strictPort: true } });
let browser;
try {
  browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('theme', 'dark');
    window.localStorage.setItem('lang', 'en');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  if (overrides[mode]) {
    await page.route('**/*.css', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()) + overrides[mode] });
    });
  }
  console.log(JSON.stringify({ mode, stage: 'navigate' }));
  await page.goto('http://localhost:4179/art/#symbols', { waitUntil: 'domcontentloaded' });
  console.log(JSON.stringify({ mode, stage: 'loaded' }));
  const card = page.locator('.symbols__grid li').first();
  await card.hover();
  const result = await page.evaluate(() => ({
    cards: document.querySelectorAll('.symbols__grid li').length,
    filter: getComputedStyle(document.querySelector('.symbols__grid li')).backdropFilter,
    opacity: getComputedStyle(document.querySelector('.symbols__share')).opacity,
  }));
  await page.screenshot({ path: `/tmp/issue-19-gallery-${mode}.png` });
  console.log(JSON.stringify({ mode, stage: 'passed', ...result }));
} finally {
  await browser?.close();
  await server.close();
}
