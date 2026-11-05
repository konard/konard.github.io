/* global document, innerWidth, matchMedia, getComputedStyle */
// Production integration checks, one browser at a time. BASE reuses a running
// static server; CI starts preview over the already-built application.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const directory = process.env.CAPTURE_DIR || 'browser-results/screenshots/migration';
const server = process.env.BASE ? null : await preview({ preview: { port: 4254, strictPort: true } });
const base = process.env.BASE || 'http://localhost:4254';
const results = [];
const errors = [];
await mkdir(directory, { recursive: true });
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
    hasTouch: true,
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === base ? route.continue() : route.abort(),
  );
  await context.addInitScript(() => {
    if (localStorage.getItem('migration-seeded')) return;
    localStorage.setItem('migration-seeded', '1');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    // A real pre-migration saved JSON value, including menu customizations.
    localStorage.setItem(
      'settings',
      JSON.stringify({ 'motion.mode': 'off', 'sound.on': false, 'ui.menuHeight': 120, 'ui.menuWidth': 240 }),
    );
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/settings/');
  const select = page.locator('#setting-motion-mode');
  assert.equal(await select.and(page.getByRole('combobox', { name: 'Motion', exact: true })).count(), 1);
  if (engine === 'chromium') {
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ forcedColors: 'active', colorScheme });
      const indicator = await select.locator('[data-part="indicator"]').evaluate((node) => ({
        color: getComputedStyle(node.closest('button')).color,
        background: getComputedStyle(node, '::after').backgroundColor,
      }));
      assert.equal(indicator.background, indicator.color, 'The SVG mask retains the forced-color button text');
    }
    await page.emulateMedia({ forcedColors: 'none', colorScheme: 'no-preference' });
    results.push('SVG select indicator retains text contrast in light/dark Windows forced colors');
  }
  assert.equal(await select.getAttribute('data-value'), 'off');
  await select.click({ force: true });
  const box = await page.getByRole('listbox').boundingBox();
  assert.ok(box && box.height <= 121 && box.x >= 0 && box.x + box.width <= 1281);
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) {
    const option = await page.getByRole('option').first().boundingBox();
    assert.ok(option.height >= 44, 'Framework options preserve the existing 44px touch targets');
  }
  await select.press('Home');
  await select.press('Tab');
  assert.equal(await select.getAttribute('data-value'), 'auto');
  assert.equal(await select.getAttribute('aria-expanded'), 'false');
  assert.ok(await page.evaluate(() => localStorage.getItem('settings').startsWith('settings:')));
  await page.reload();
  assert.equal(await select.getAttribute('data-value'), 'auto');
  results.push(
    'Legacy JSON loads; framework select commits with Tab, respects menu bounds and persists as historical LiNo',
  );

  await page.locator('#setting-ui-menuHeight').fill('320');
  await page.setViewportSize({ width: 390, height: 320 });
  const palette = page.locator('#setting-future-palette');
  await palette.scrollIntoViewIfNeeded();
  await palette.click({ force: true });
  const landscapeMenu = await page.getByRole('listbox').boundingBox();
  await page.screenshot({ path: `${directory}/${engine}-landscape-menu.png` });
  assert.ok(landscapeMenu.y >= 0 && landscapeMenu.y + landscapeMenu.height <= 320);
  await page.setViewportSize({ width: 390, height: 600 });
  await page.waitForFunction(() => {
    const menu = [...document.querySelectorAll('[role="listbox"]')].find((node) => node.getClientRects().length);
    const bounds = menu?.getBoundingClientRect();
    return bounds && bounds.top >= 0 && bounds.bottom <= 600 && bounds.height > 200;
  });
  await palette.press('Escape');
  await page.setViewportSize({ width: 1280, height: 800 });
  results.push('Long select menus fit a short landscape viewport and resize while open');

  await page.getByRole('button', { name: 'RU', exact: true }).click({ force: true });
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
  assert.equal(await page.locator('h1').textContent(), 'Фон, оформление, звук и нотация');
  assert.equal(await select.and(page.getByRole('combobox', { name: 'Движение', exact: true })).count(), 1);
  await page.getByRole('button', { name: 'EN', exact: true }).click({ force: true });
  assert.equal(await page.locator('h1').textContent(), 'Background, skin, sound and notation');
  results.push('Framework catalogs resolve English and Russian through the existing language switch');

  await page.goto(base + '/network/?code=112212');
  const notation = page.getByLabel('Links notation', { exact: true });
  await notation.fill('1: 0 1\n2: 2 0');
  await page.waitForURL((url) => url.searchParams.get('code') === '0120');
  await notation.fill('((1: 0 1))');
  assert.equal(await notation.getAttribute('aria-invalid'), 'true');
  await notation.fill('(1: 1 1) (2: 2 2) (3: 1 2)');
  await page.waitForURL((url) => url.searchParams.get('code') === '112212');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${directory}/${engine}-mobile-network.png` });
  results.push(
    'Official parser accepts indented and historical notation, rejects malformed nested records; mobile layout fits',
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + '/?ui-dev');
  await page.getByRole('button', { name: 'Pick element', exact: true }).waitFor();
  assert.ok(await page.locator('ui-foreign-devmode').count());
  await page.screenshot({ path: `${directory}/${engine}-inspector.png` });
  await page.getByRole('button', { name: 'Close', exact: true }).click({ force: true });
  assert.equal(await page.locator('ui-foreign-devmode').count(), 0);
  await page.keyboard.press('Alt+Shift+KeyD');
  await page.getByRole('button', { name: 'Pick element', exact: true }).waitFor();
  results.push('Lazy framework inspector loads production assets, closes and reopens with Alt+Shift+D');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ engine, results, errors }, null, 2));
  await writeFile(`${directory}/${engine}.json`, JSON.stringify({ engine, results, errors }, null, 2) + '\n');
} finally {
  await browser?.close();
  await server?.close();
}
