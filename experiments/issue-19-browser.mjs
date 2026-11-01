import { chooseSelect } from './support/select.mjs';
// Focused real-browser regressions for #19. ENGINE selects one browser at a time.
/* global window, document, HTMLInputElement */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { networkExampleUrls } from './network-example-urls.mjs';
import { verifyWebpFallback } from './network-export-support.mjs';

const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-19/screenshots';
const resultDir = process.env.RESULT_DIR || 'docs/case-studies/issue-19/data';
await mkdir(output, { recursive: true });
await mkdir(resultDir, { recursive: true });
const server = process.env.BASE ? null : await preview({ preview: { port: 4177, strictPort: true } });
const base = process.env.BASE || 'http://localhost:4177';
let browser;
const errors = [];
const results = { engine, date: new Date().toISOString(), checks: [] };
const passed = (name) => {
  results.checks.push(name);
  console.log(`${engine}: ${name}`);
};
const svgOf = (page) => page.locator('.network__preview').innerHTML();
const shot = (page, name, element = null) =>
  (element || page).screenshot({ path: join(output, `${engine}-${name}.png`) });
const init = () => {
  localStorage.setItem('lang', 'en');
  localStorage.setItem('theme', 'dark');
  const original = window.history.replaceState.bind(window.history);
  window.__historyWrites = [];
  window.history.replaceState = (...args) => {
    window.__historyWrites.push(args[2]);
    if (window.__rejectHistory) throw new DOMException('injected Safari history quota', 'SecurityError');
    return original(...args);
  };
};
const change = async (page, key, value) => {
  const field = page.locator(`#style-${key}`);
  await field.evaluate((node, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, next);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  await context.addInitScript(init);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/network/?code=1122`);
  await page.locator('.network__preview svg').waitFor();
  await shot(page, 'after-loops');
  for (const [key, value] of [
    ['sourceAngle', 55],
    ['targetAngle', 65],
    ['tension', 0.7],
    ['bulge', 65],
  ]) {
    const before = await svgOf(page);
    await change(page, key, value);
    assert.notEqual(await svgOf(page), before, `${key} must affect self loops`);
  }
  passed('self-loop leaving/entering angles, curvature and bend');

  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__historyWrites = [];
  });
  const slider = page.locator('#style-targetAngle');
  await slider.dispatchEvent('pointerdown');
  for (let i = 1; i <= 120; i++) {
    await change(page, 'targetAngle', i % 80);
  }
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.__historyWrites.length), 0, 'no URL writes during a held slider');
  await slider.dispatchEvent('pointerup');
  await page.waitForTimeout(100);
  await slider.dispatchEvent('pointerdown');
  await change(page, 'targetAngle', 67);
  await slider.dispatchEvent('pointerup');
  await page.waitForURL((url) => url.searchParams.get('targetAngle') === '67');
  assert.equal(await page.evaluate(() => window.__historyWrites.length), 1, 'short releases coalesce');
  await page.evaluate(() => {
    window.__rejectHistory = true;
  });
  await change(page, 'targetAngle', 68);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.network__preview svg').count(), 1, 'history failure must leave editor alive');
  await shot(page, 'after-history-error');
  await page.evaluate(() => {
    window.__rejectHistory = false;
  });
  await page.waitForURL((url) => url.searchParams.get('targetAngle') === '68');
  passed('120-event drag, repeated releases, history SecurityError and retry');

  await chooseSelect(page.getByLabel('Middle of a link', { exact: true }), 'circle');
  await change(page, 'middleSize', 10);
  await change(page, 'middleGapStart', 5);
  await change(page, 'middleGapEnd', 5);
  await change(page, 'startOffset', 3);
  await change(page, 'endOffset', 4);
  await shot(page, 'ring-and-offsets', page.locator('.network__preview'));
  const paths = await page
    .locator('.network__preview svg g[stroke] > path:first-child')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d')));
  assert(paths.every((d) => (d.match(/M/g) || []).length === 2));
  const shared = await page.getByLabel('Link to this picture').inputValue();
  const drawing = await svgOf(page);
  await page.goto(shared);
  assert.equal(await svgOf(page), drawing, 'new settings survive sharing and reload');
  passed('independent marker offsets and ring cuts survive URL round trip');

  const links = Array.from({ length: 17 }, (_, i) => `(${i + 1}: ${i + 1} ${((i + 1) % 17) + 1})`).join(' ');
  await page.getByLabel('Links notation', { exact: true }).fill(links);
  await page.waitForURL((url) => url.searchParams.get('code')?.includes(';'));
  const layouts = {};
  for (const placement of ['circle', 'square', 'hex', 'dice', 'cards', 'spiral', 'force']) {
    await chooseSelect(page.getByLabel('Placement', { exact: true }), placement);
    const svg = await svgOf(page);
    assert(!/NaN|Infinity|undefined/.test(svg));
    layouts[placement] = svg;
    await shot(page, `layout-${placement}`, page.locator('.network__preview'));
  }
  assert.equal(new Set(Object.values(layouts)).size, 7);
  await page.reload();
  assert.equal(await page.getByLabel('Links notation', { exact: true }).inputValue(), links);
  passed('17 links, seven distinct placements and large-notation reload');

  // Both complete example URLs from the issue, including the rotated one.
  const issue = JSON.parse(await readFile('docs/case-studies/issue-19/data/issue.json', 'utf8'));
  for (const [i, url] of networkExampleUrls(issue.body).entries()) {
    await page.goto(base + new URL(url).pathname + new URL(url).search);
    assert(!/NaN|Infinity|undefined/.test(await svgOf(page)));
    await shot(page, `supplied-${i + 1}`, page.locator('.network__preview'));
  }
  passed('both complete issue example URLs');

  // Real trusted clipboard click; success requires the native write to resolve.
  await page.goto(`${base}/network/?code=11&width=512&height=512`);
  if (await page.getByRole('button', { name: 'Copy the image', exact: true }).isEnabled()) {
    if (engine === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy the image', exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector('.network-share__status').textContent.includes('Image copied.'),
    );
    passed('actual PNG clipboard write completed from a trusted click');
  } else {
    assert.match(await page.getByRole('button', { name: 'Copy the image', exact: true }).getAttribute('title'), /PNG/);
    passed('unsupported image clipboard exposes PNG download alternative');
  }

  for (const format of ['PNG', 'JPEG', 'WebP']) {
    if (format === 'WebP' && (await verifyWebpFallback(page))) {
      passed('unsupported WebP encoder exposes PNG fallback');
      continue;
    }
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: format, exact: true }).click();
    const downloaded = await pending;
    assert.equal(await downloaded.failure(), null);
  }
  passed('PNG/JPEG downloads and WebP download or explicit PNG fallback');
  await context.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    ...(engine === 'firefox' ? {} : { isMobile: true }),
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  await mobile.addInitScript(init);
  const touch = await mobile.newPage();
  touch.setDefaultTimeout(15000);
  touch.on('pageerror', (error) => errors.push(error.message));
  await touch.goto(`${base}/network/?code=112212`);
  await touch.locator('#style-targetAngle').dispatchEvent('touchstart');
  await change(touch, 'targetAngle', 66);
  await touch.waitForTimeout(600);
  assert.equal(await touch.evaluate(() => window.__historyWrites.length), 0);
  await touch.locator('#style-targetAngle').dispatchEvent('touchend');
  await touch.waitForURL((url) => url.searchParams.get('targetAngle') === '66');
  await touch
    .getByLabel('Links notation', { exact: true })
    .fill(Array.from({ length: 100 }, (_, i) => `(${i + 1}: ${i + 1} ${((i + 1) % 100) + 1})`).join(' '));
  await chooseSelect(touch.getByLabel('Placement', { exact: true }), 'hex');
  const overflow = await touch.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `mobile overflows by ${overflow}px`);
  const clipped = await touch
    .locator('.notations input, .notations textarea')
    .evaluateAll((nodes) => nodes.some((node) => node.getBoundingClientRect().right > window.innerWidth));
  assert.equal(clipped, false, 'large notation fields must fit the mobile panel, even when the body hides overflow');
  assert.equal(await touch.getByLabel('Link 100: target', { exact: true }).inputValue(), '1');
  await touch.getByLabel('Links notation', { exact: true }).scrollIntoViewIfNeeded();
  await shot(touch, 'mobile-100-links');
  await mobile.close();
  passed('touch gesture debounce, 100-link mobile editor and no horizontal overflow');
  assert.deepEqual(errors, [], 'no uncaught browser errors');
  results.errors = errors;
} finally {
  await writeFile(join(resultDir, `${engine}-browser.json`), JSON.stringify(results, null, 2) + '\n');
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
