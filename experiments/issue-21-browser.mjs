// Editor-only geometry, colors, controls, exports and navigation evidence for #21.
/* global window, document, getComputedStyle, HTMLInputElement */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { networkExampleUrls } from './network-example-urls.mjs';

const engine = process.env.ENGINE || 'chromium';
const before = process.env.BEFORE === '1';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-21/screenshots';
const resultDir = process.env.RESULT_DIR || 'docs/case-studies/issue-21/data';
await mkdir(output, { recursive: true });
await mkdir(resultDir, { recursive: true });
const server = process.env.BASE ? null : await preview({ preview: { port: 4179, strictPort: true } });
const base = process.env.BASE || 'http://localhost:4179';
const results = { engine, before, date: new Date().toISOString(), checks: [], errors: [] };
const passed = (name) => {
  results.checks.push(name);
  console.log(`${engine}: ${name}`);
};
const shot = (page, name, element = null) =>
  (element || page).screenshot({ path: join(output, `${engine}-${before ? 'before' : 'after'}-${name}.png`) });
const drawing = (page) => page.locator('.network__preview').innerHTML();
const change = (page, key, value) =>
  page.locator(`#style-${key}`).evaluate((node, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, next);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  results.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'en');
    // Keep screenshots deterministic and memory use low; this changes no glyphs or editor controls.
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => results.errors.push(error.message));

  const issue = JSON.parse(await readFile('docs/case-studies/issue-21/data/issue-21.json', 'utf8'));
  const urls = networkExampleUrls(issue.body);
  for (const [i, url] of urls.entries()) {
    await page.goto(base + url.pathname + url.search);
    await page.locator('.network__preview svg').waitFor();
    // Inspect every explicit setting through its actual control (defaults can be omitted in canonical URLs).
    for (const [key, value] of url.searchParams) {
      if (key !== 'code') assert.equal(await page.locator(`#style-${key}`).inputValue(), value, key);
    }
    await page.locator('#style-bulge').scrollIntoViewIfNeeded();
    await shot(page, `supplied-${i + 1}`);
    await shot(page, `supplied-${i + 1}-symbol`, page.locator('.network__preview'));
    const svg = await drawing(page);
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    await page.goto(shared);
    assert.equal(await drawing(page), svg);
    if (!before) {
      for (const [key, value] of [
        ['bulge', 37],
        ['startOffset', 3.1],
        ['padding', 12],
      ]) {
        await change(page, key, value);
      }
      const edited = await drawing(page);
      await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
      assert.equal(await drawing(page), edited, 'edited controls must recreate exact SVG');
      assert.equal(await page.locator('#style-bulge').inputValue(), '37');
    }
  }
  passed('both supplied URLs: explicit settings, controls, share and reload');

  for (const code of ['1122', '00000000', '112212', '221331', '1221']) {
    await page.goto(`${base}/network/?code=${code}`);
    await page.locator('.network__preview svg').waitFor();
    assert(!/NaN|Infinity|undefined/.test(await drawing(page)));
    await shot(page, `default-${code}`, page.locator('.network__preview'));
  }
  passed('five representative default editor configurations');

  for (const theme of ['dark', 'light']) {
    await page.goto(`${base}/art/#symbols`);
    // Select via persistent preference and reload, so this also covers direct entry with saved themes.
    await page.evaluate((value) => localStorage.setItem('theme', value), theme);
    await page.reload();
    const card = page.locator('.symbols__card').first();
    await card.hover();
    const decoration = await card.evaluate((node) => getComputedStyle(node).textDecorationLine);
    await shot(page, `gallery-${theme}`, page.locator('.symbols__grid li').first());
    const colors = await card
      .locator('[data-link]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).stroke));
    if (!before) assert.equal(decoration, 'none');
    await card.click();
    await page.waitForURL('**/network/**');
    const actual = await page
      .locator('.network__preview g[stroke] > path:first-child')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).stroke));
    if (!before) assert.deepEqual(actual, colors, `${theme} gallery colors must match editor`);
    results[`${theme}Colors`] = { gallery: colors, editor: actual, decoration };
  }
  passed('gallery hover and navigation preserve dark/light link colors');

  if (!before) {
    await page.goto(`${base}/research/`);
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();
    const example = page.locator('.theory__example').first();
    const expected = await example
      .locator('[data-link]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).stroke));
    await example.locator('.theory__edit').click();
    await page.waitForURL('**/network/**');
    const actual = await page
      .locator('.network__preview g[stroke] > path:first-child')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).stroke));
    assert.deepEqual(actual, expected);
    passed('theory example navigation also preserves light-theme colors');

    await page.goto(`${base}/network/?code=1122`);
    const svg = await drawing(page);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '⤓ SVG', exact: true }).click();
    const file = await download;
    assert.equal(await file.failure(), null);
    const exported = await readFile(await file.path(), 'utf8');
    const parsed = await page.evaluate((text) => {
      const container = document.createElement('div');
      container.innerHTML = text;
      return container.innerHTML;
    }, exported);
    assert.equal(parsed, svg);
    passed('exported SVG equals preview');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/network/?code=1122`);
    await shot(page, 'mobile', page.locator('.network__preview'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    passed('mobile preview fits viewport');
  }
  assert.deepEqual(results.errors, []);
  await context.close();
} finally {
  await writeFile(
    join(resultDir, `${engine}-${before ? 'before' : 'after'}.json`),
    JSON.stringify(results, null, 2) + '\n',
  );
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
