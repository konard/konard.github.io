// Regression of the exact reported URL and the native SVG/raster drawing.
/* global document, Image */
import { waitForNetwork } from './wait-for-network.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-35/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-35/data';
const label = process.env.CAPTURE_LABEL || 'after';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4195, strictPort: true } });
const result = { engine, date: new Date().toISOString(), checks: [], errors: [] };
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  result.version = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => result.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const go = async (extra = '') => {
    await page.goto(`http://localhost:4195/network/?code=003002&solve=true&lang=en&${extra}`);
    await waitForNetwork(page);
  };
  const picture = async () => {
    await waitForNetwork(page);
    return page.locator('.network__preview').innerHTML();
  };
  const moveCounts = () =>
    page
      .locator('.network__preview g[stroke] > path:first-child')
      .evaluateAll((lines) => lines.map((line) => (line.getAttribute('d').match(/M/g) || []).length));
  const shot = (name) =>
    page.locator('.network__preview').screenshot({ path: join(output, `${engine}-${label}-${name}.png`) });
  await go();
  await shot('reported');
  result.moves = await moveCounts();
  assert.deepEqual(result.moves, [1, 1, 1], 'zero-cut links must have one continuous SVG subpath');
  for (const name of ['Cut before the middle', 'Cut after the middle', 'Largest middle cut change'])
    assert.equal(await page.getByRole('slider', { name, exact: true }).inputValue(), '0');

  // Sample native raster paint along the incoming purple half near its middle.
  // Check the exported SVG too: its coordinates and path come from the preview.
  result.raster = await page.locator('.network__preview svg').evaluate(async (svg) => {
    const line = svg.querySelectorAll('g[stroke] > path:first-child')[1];
    const first = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    first.setAttribute('d', line.getAttribute('d').split('C').slice(0, 2).join('C'));
    const joinLength = first.getTotalLength();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1000;
    const context = canvas.getContext('2d');
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
    await image.decode();
    context.drawImage(image, 0, 0, 1000, 1000);
    // Read the exported drawing transform without CSS viewport scaling.
    // Root getCTM() includes that scaling differently across browser engines.
    const drawing = line.parentElement.parentElement.cloneNode(false);
    const matrix = drawing.transform.baseVal.consolidate().matrix;
    const samples = Array.from({ length: 12 }, (_, i) => {
      const point = first.getPointAtLength(joinLength - (i + 1) * 0.5).matrixTransform(matrix);
      const x = Math.round((point.x / svg.viewBox.baseVal.width) * 1000);
      const y = Math.round((point.y / svg.viewBox.baseVal.height) * 1000);
      return { x, y, pixel: [...context.getImageData(x, y, 1, 1).data] };
    });
    return { joinLength, matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f], samples };
  });
  result.raster.samples.forEach(({ x, y, pixel: [r, g, b, a] }) => {
    assert(x >= 0 && x < 1000 && y >= 0 && y < 1000, 'raster sample must be inside the exported image');
    assert(r > 100 && b > 150 && b > g && a > 240);
  });
  result.checks.push('reported URL: all three lines continuous, zero cut settings, purple shaft painted to its middle');

  const solved = await picture();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  assert.equal(await picture(), solved);
  const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
  await page.goto(shared);
  assert.equal(await picture(), solved);
  assert.deepEqual(await moveCounts(), [1, 1, 1]);
  // Exercise the real SVG download rather than just inspecting the preview.
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '⤓ SVG', exact: true }).click();
  const download = await downloaded;
  const path = await download.path();
  const exported = await readFile(path, 'utf8');
  const serialized = await page.evaluate((source) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = source;
    return wrapper.innerHTML;
  }, exported);
  assert.equal(serialized, solved);
  result.checks.push('Apply, share/reload and actual SVG download preserve the same continuous drawing');

  await go('solveMiddleRange=4');
  assert((await moveCounts()).some((count) => count > 1));
  const optIn = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
  assert.equal(new URL(optIn).searchParams.get('solveMiddleRange'), '4');
  const cut = await picture();
  await page.goto(optIn);
  assert.equal(await picture(), cut);
  result.checks.push('explicit automatic-cut opt-in remains effective and survives sharing');

  await go('middleGapStart=3&middleGapEnd=2&gaps=~+~+0+0,~+~+1+0,~+~+0+4');
  assert.deepEqual(await moveCounts(), [1, 2, 2]);
  const manual = await picture();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  assert.equal(await picture(), manual);
  for (const [index, values] of [
    [1, [0, 0]],
    [2, [1, 0]],
    [3, [0, 4]],
  ])
    for (const [side, value] of ['before', 'after'].map((side, i) => [side, values[i]]))
      assert.equal(
        await page.getByLabel(`Link ${index}: Cut ${side} the middle`, { exact: true }).inputValue(),
        String(value),
      );
  result.checks.push('intentional global cuts, per-link cuts and zero overrides survive automatic spacing and Apply');
  assert.deepEqual(result.errors, []);
} catch (error) {
  result.failure = error.stack;
  throw error;
} finally {
  await browser?.close();
  await server.close();
  await writeFile(join(data, `${engine}-${label}.json`), JSON.stringify(result, null, 2) + '\n');
}
