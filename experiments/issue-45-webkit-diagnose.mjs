// Why does a key press on a settings slider take about 2 s in WebKit on the
// macOS runner with the Matrix universe look (issue #45), against about 0.1 s
// with the Glass universe look of main? For each variant of the look this
// prints, on /settings/:
//   restyleMs - a variable written on <html> and a box read (style and layout);
//   frameMs   - the same, then two animation frames (style, layout and paint);
//   keyMs     - one navigation key on a slider, as the issue #27 audit presses it.
// Runs in the checkout it is started in, so the same file times main as well.
// The Matrix look is read from DEFAULTS_FROM (default ./src/settings/schema.defaults.js).
//   [ENGINE=webkit] [VARIANTS=matrix,glass,...] [DEFAULTS_FROM=path] [PORT=4265] node experiments/issue-45-webkit-diagnose.mjs
/* global document, requestAnimationFrame */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const PORT = Number(process.env.PORT || 4265);
const from = resolve(process.env.DEFAULTS_FROM || 'src/settings/schema.defaults.js');
const { DEFAULT_LOOK } = await import(pathToFileURL(from).href);
const off = { 'motion.mode': 'off' };
const matrix = { ...DEFAULT_LOOK, ...off };
const VARIANTS = {
  // Main's own defaults: the Glass universe there, the Matrix universe on the branch.
  defaults: off,
  matrix,
  glass: { ...off, 'skin.name': 'glass' },
  noRainGlow: { ...matrix, 'rain.glow': 0 },
  noRain: { ...matrix, 'rain.level': 0 },
  noNebula: { ...matrix, 'nebula.on': false },
  gridLines: { ...matrix, 'grid.style': 'lines' },
  noScanlines: { ...matrix, 'future.scanlines': 0 },
  solidSurface: { ...matrix, 'future.surface': 'gradient' },
  cornerBrackets: { ...matrix, 'future.frame': 'corners' },
  controlBorders: { ...matrix, 'corner.controls': 'border' },
  layerBelow: { ...matrix, 'corner.layer': 'below' },
  quiet: { ...matrix, 'rain.level': 0, 'nebula.on': false, 'grid.level': 0, 'future.scanlines': 0 },
};
const names = (process.env.VARIANTS || Object.keys(VARIANTS).join(',')).split(',');
const SLIDERS = ['setting-grid-size', 'setting-stars-level', 'setting-sound-volume'];
const KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'];

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
const deadline = Date.now() + Number(process.env.BUDGET_MS || 8 * 60 * 1000);
try {
  for (const name of names) {
    if (Date.now() > deadline) {
      console.log(JSON.stringify({ engine, name, skipped: 'time budget' }));
      continue;
    }
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
      await page.route('https://platform.twitter.com/**', (route) => route.abort());
      await page.addInitScript((settings) => {
        localStorage.setItem('lang', 'en');
        localStorage.setItem('settings', settings);
      }, JSON.stringify(VARIANTS[name]));
      await page.goto(`http://localhost:${PORT}/settings/?lang=en`, { waitUntil: 'commit' });
      await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
        polling: 250,
        timeout: 60000,
      });
      await page.waitForTimeout(1500);
      const timing = await page.evaluate(async () => {
        const root = document.documentElement;
        const frame = () => new Promise((done) => requestAnimationFrame(() => done()));
        const restyle = [];
        const painted = [];
        for (let i = 0; i < 4; i += 1) {
          let start = performance.now();
          root.style.setProperty('--probe', String(Math.random()));
          void document.body.offsetHeight;
          restyle.push(performance.now() - start);
          start = performance.now();
          root.style.setProperty('--probe', String(Math.random()));
          await frame();
          await frame();
          painted.push(performance.now() - start);
        }
        const median = (list) => Math.round(list.sort((a, b) => a - b)[list.length >> 1]);
        return {
          elements: document.querySelectorAll('*').length,
          restyleMs: median(restyle.slice(1)),
          frameMs: median(painted.slice(1)),
        };
      });
      const keys = [];
      for (const id of SLIDERS) {
        const input = page.locator(`#${id}`);
        if (!(await input.count())) continue;
        for (const key of KEYS) {
          const start = Date.now();
          await input.press(key);
          await input.inputValue();
          keys.push(Date.now() - start);
        }
      }
      keys.sort((a, b) => a - b);
      console.log(
        JSON.stringify({
          engine,
          name,
          ...timing,
          keyMs: keys[keys.length >> 1],
          keyMaxMs: keys[keys.length - 1],
          presses: keys.length,
        }),
      );
    } catch (error) {
      console.log(JSON.stringify({ engine, name, error: String(error.message).split('\n')[0] }));
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
