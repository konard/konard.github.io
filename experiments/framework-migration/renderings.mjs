/* global document, innerWidth */
// Run before and after the migration, one browser at a time to bound memory.
// PHASE=baseline|after ENGINE=chromium|firefox|webkit node experiments/framework-migration/renderings.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';

const phase = process.env.PHASE || 'baseline';
const engine = process.env.ENGINE || 'chromium';
const base = process.env.BASE || 'http://127.0.0.1:3000';
const out = `/tmp/issue54-renderings/${phase}`;
await mkdir(out, { recursive: true });
const evidence = 'docs/case-studies/issue-54/screenshots';
await mkdir(evidence, { recursive: true });
let browser;
const results = [];
try {
  // Frozen before the migration, so these also exercise old saved looks.
  const looks = JSON.parse(await readFile('docs/case-studies/issue-54/data/presets-before.json', 'utf8'));
  if (Object.values(looks).some((look) => !look)) throw new Error('Missing baseline preset');
  for (const [preset, look] of Object.entries(looks)) {
    for (const theme of ['dark', 'light']) {
      for (const [size, viewport] of [
        ['desktop', { width: 1280, height: 800 }],
        ['mobile', { width: 390, height: 844 }],
      ]) {
        for (const [name, path] of [
          ['home', '/'],
          ['settings', '/settings/'],
          ['network', '/network/?code=112212'],
          ['art', '/art/#symbols'],
        ]) {
          // A fresh browser per sample bounds GPU/canvas memory and also
          // verifies a real cold load of saved looks on every route.
          browser = await { chromium, firefox, webkit }[engine].launch();
          const page = await browser.newPage({ viewport, colorScheme: 'dark', reducedMotion: 'reduce' });
          page.setDefaultTimeout(30000);
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.route('**/*', (route) =>
            new URL(route.request().url()).origin === base ? route.continue() : route.abort(),
          );
          await page.addInitScript(
            ({ look, theme }) => {
              let seed = 54;
              Math.random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
              localStorage.setItem('lang', 'en');
              localStorage.setItem('settings', JSON.stringify({ ...look, 'motion.mode': 'off' }));
              localStorage.setItem('theme', theme);
            },
            { look, theme },
          );
          await page.goto(base + path, { waitUntil: 'load' });
          await page.locator('.footer').waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.locator('h1').first().waitFor();
          // Allow lazy background layers and the settings columns to settle.
          await page.waitForTimeout(300);
          const id = `${engine}-${preset}-${theme}-${size}-${name}`;
          const png = await page.screenshot({ path: `${out}/${id}.png`, animations: 'disabled' });
          if (engine === 'chromium' && preset === 'default' && theme === 'dark' && name !== 'art')
            await writeFile(`${evidence}/${phase}-${size}-${name}.png`, png);
          const summary = await page.evaluate(() => ({
            title: document.title,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            headings: [...document.querySelectorAll('h1,h2')].map((el) => el.textContent),
            controls: document.querySelectorAll('input,button,textarea').length,
            skin: document.documentElement.dataset.skinName,
          }));
          results.push({ id, ...summary, errors: errors.splice(0) });
          console.log(id);
          await browser.close();
        }
      }
    }
  }
  await writeFile(`${out}/${engine}.json`, JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser?.close();
}
