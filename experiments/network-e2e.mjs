// Browser regression checks for issue #17. Uses the built site; starts Vite
// preview unless BASE is set. ENGINE=chromium|firefox|webkit, CAPTURE_DIR=...
/* global document, window, getComputedStyle, Image */
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { verifyWebpFallback } from './network-export-support.mjs';

const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR;
const downloads = process.env.DOWNLOAD_DIR || '/tmp/network-downloads';
await mkdir(downloads, { recursive: true });
if (output) await mkdir(output, { recursive: true });
const server = process.env.BASE ? null : await preview({ preview: { port: 4175, strictPort: true } });
const base = process.env.BASE || 'http://localhost:4175';
let browser;
const errors = [];
const shot = async (page, name, locator = null) => {
  if (output) await (locator || page).screenshot({ path: join(output, `${name}.png`) });
};
const codeOf = (page) => new URL(page.url()).searchParams.get('code');
const codeIs = async (page, code) => {
  await page.waitForURL((url) => url.searchParams.get('code') === code);
  assert.equal(codeOf(page), code);
};
const svgOf = (page) => page.locator('.network__preview').innerHTML();
const noOverflow = async (page) => {
  const excess = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(excess <= 1, `page overflows by ${excess}px at ${JSON.stringify(page.viewportSize())}`);
};

try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => {
    if (!window.localStorage.getItem('theme')) window.localStorage.setItem('theme', 'dark');
    if (!window.localStorage.getItem('lang')) window.localStorage.setItem('lang', 'en');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${base}/art/#symbols`);
  const card = page.locator('.symbols__grid li').first();
  const galleryCode = new URL(await card.locator('.symbols__card').getAttribute('href'), base).searchParams.get('code');
  assert.equal(await card.locator('a').count(), 1, 'one full-card editor link');
  await card.hover();
  assert.equal(await card.locator('a').evaluate((node) => getComputedStyle(node).textDecorationLine), 'none');
  await shot(page, 'gallery-hover');
  await card.locator('a').click();
  await page.waitForURL('**/network/**');
  await codeIs(page, galleryCode);
  // Existing direct share-section URLs still work after removing the redundant icon.
  await page.goto(`${base}/network/?code=${galleryCode}#share`);
  await page.waitForFunction(() => document.getElementById('share').getBoundingClientRect().top < window.innerHeight);
  await page.goto(`${base}/art/#symbols`);
  await page.locator('.symbols__card').first().focus();
  assert.equal(
    await page
      .locator('.symbols__card')
      .first()
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await page.locator('.symbols__card').first().click();
  await page.waitForURL('**/network/**');
  await codeIs(page, galleryCode);

  console.log(`${engine}: gallery hover, focus and navigation passed`);

  await page.goto(`${base}/network/?code=221331`);
  assert.equal(await page.getByLabel('N-ary number', { exact: true }).inputValue(), '221331₄');
  await page.getByLabel('N-ary number', { exact: true }).fill('0120₃');
  assert.equal(await page.getByLabel('Links notation', { exact: true }).inputValue(), '(1: 0 1) (2: 2 0)');
  await page.getByLabel('Links notation', { exact: true }).fill('(1: 1 1) (2: 2)');
  assert.equal(await page.getByLabel('Links notation', { exact: true }).getAttribute('aria-invalid'), 'true');
  await codeIs(page, '0120');
  await page.getByLabel('Math notation (the links theory)').fill('λ = {1 ↦ (1, 1), 2 ↦ (2, 2), 3 ↦ (1, 2)}');
  await codeIs(page, '112212');
  await page.getByLabel('The same number in decimal').fill('0');
  await codeIs(page, '000000');
  console.log(`${engine}: notation editing and invalid input passed`);

  await page.goto(`${base}/network/?code=221331`);
  await shot(page, 'network-desktop');
  await page.locator('#style-angles').scrollIntoViewIfNeeded();
  const box = await page.locator('.network__preview').boundingBox();
  assert(box.y >= 0 && box.y + box.height <= 1001, 'preview must stay visible beside style controls');
  await shot(page, 'after-style-preview');
  const before = await svgOf(page);
  await page.getByLabel('Angles of the ends', { exact: true }).selectOption('fixed');
  await page.getByLabel('Leaving angle', { exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await svgOf(page), before);
  await page.getByLabel('Start of a link', { exact: true }).selectOption('circle');
  await page.getByLabel('End of a link', { exact: true }).selectOption('triangle');
  await page.getByLabel('Link 1: turn of the target, °').fill('30');
  await page.waitForURL((url) => url.searchParams.get('turns')?.includes('30'));
  assert(new URL(page.url()).searchParams.get('turns').includes('30'));
  await page.getByRole('button', { name: 'Plain black', exact: true }).click();
  assert((await svgOf(page)).includes('fill="#000000"'));
  await shot(page, 'plain-black', page.locator('.network__preview'));
  await page.getByRole('button', { name: 'Transparent', exact: true }).click();
  assert(!(await svgOf(page)).includes('<rect'));
  await shot(page, 'transparent', page.locator('.network__preview'));
  await page.getByRole('button', { name: 'Card (as in the gallery)', exact: true }).click();
  await page.getByRole('combobox', { name: 'Border', exact: true }).selectOption('double');
  assert((await svgOf(page)).includes('stroke-width="0.6"'));
  await page.getByRole('combobox', { name: 'Background', exact: true }).selectOption('linear');
  assert((await svgOf(page)).includes('<linearGradient'));
  console.log(`${engine}: live preview and SVG styling passed`);

  await page.goto(`${base}/network/?code=221331`);
  await shot(page, 'collisions-before', page.locator('.network__preview'));
  await page.getByLabel('Reduce overlaps automatically', { exact: true }).check();
  const score = await page.locator('.network__score').textContent();
  const [from, to] = score.match(/[\d.]+/g).map(Number);
  assert(to < from, `solver should improve the tangled example: ${score}`);
  await shot(page, 'collisions-after', page.locator('.network__preview'));
  const solvedSvg = await svgOf(page);
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  assert.equal(await svgOf(page), solvedSvg, 'applying turns and gaps must preserve the preview');
  console.log(`${engine}: overlap reduction and applied turns/gaps passed`);

  await page.getByRole('button', { name: 'Social card 1200 × 630', exact: true }).click();
  await page.getByLabel('Theory notation', { exact: true }).selectOption('R');
  const shared = await page.getByLabel('Link to this picture').inputValue();
  const sharedSvg = await svgOf(page);
  const fresh = await browser.newContext({ reducedMotion: 'reduce' });
  const receiving = await fresh.newPage();
  await receiving.goto(shared);
  assert.equal(await svgOf(receiving), sharedSvg, 'a fresh browser must render exactly the shared SVG');
  await fresh.close();
  console.log(`${engine}: shared URL renders the same SVG in a fresh browser`);

  // Test actual downloaded files: MIME signatures, dimensions, alpha and contents.
  await page.getByRole('button', { name: 'Transparent', exact: true }).click();
  await page.locator('#share').scrollIntoViewIfNeeded();
  await shot(page, 'sharing');
  for (const [label, ext] of [
    ['SVG', 'svg'],
    ['PNG', 'png'],
    ['JPEG', 'jpg'],
    ['WebP', 'webp'],
    ['.lino', 'lino'],
  ]) {
    if (ext === 'webp' && (await verifyWebpFallback(page))) {
      console.log(`${engine}: unsupported WebP encoder exposes PNG fallback`);
      continue;
    }
    const waiting = page.waitForEvent('download');
    await page.getByRole('button', { name: `⤓ ${label}`, exact: true }).click();
    const download = await waiting;
    assert.equal(await download.failure(), null);
    assert.equal(download.suggestedFilename(), `links-network-22-13-31.${ext}`);
    const path = join(downloads, `${engine}-${download.suggestedFilename()}`);
    await download.saveAs(path);
    const bytes = await readFile(path);
    if (ext === 'svg') {
      const serialized = await page.evaluate((svg) => {
        const container = document.createElement('div');
        container.innerHTML = svg;
        return container.innerHTML;
      }, bytes.toString());
      assert.equal(serialized, await svgOf(page));
    } else if (ext === 'lino') assert.equal(bytes.toString(), '(1: 2 2)\n(2: 1 3)\n(3: 3 1)\n');
    else {
      if (ext === 'png') assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      if (ext === 'jpg') assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
      if (ext === 'webp') assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
      const pixel = await page.evaluate(
        async ({ data, type }) => {
          const image = new Image();
          image.src = `data:${type};base64,${data}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          return { width: image.width, height: image.height, alpha: context.getImageData(0, 0, 1, 1).data[3] };
        },
        { data: bytes.toString('base64'), type: `image/${ext === 'jpg' ? 'jpeg' : ext}` },
      );
      assert.deepEqual([pixel.width, pixel.height], [1200, 630]);
      assert.equal(pixel.alpha, ext === 'jpg' ? 255 : 0, 'transparent exports keep alpha; JPEG has a solid fill');
    }
    console.log(`${engine}: verified ${ext} download (${bytes.length} bytes)`);
  }
  for (const name of ['telegram', 'x', 'vk', 'facebook']) {
    const href = await page.locator(`[data-share="${name}"]`).getAttribute('href');
    assert(decodeURIComponent(href).includes(await page.getByLabel('Link to this picture').inputValue()));
  }

  for (const width of [360, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const lang of ['en', 'ru']) {
      await page.goto(`${base}/network/?code=112233445566778899&lang=${lang}`);
      assert.equal(new URL(page.url()).searchParams.get('lang'), lang, 'editing must preserve explicit language');
      await noOverflow(page);
      if (width === 390 && lang === 'ru') {
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('lang'), lang, 'reloading keeps the shared language');
        await shot(page, 'network-mobile-ru');
      }
      await page.locator('#style').scrollIntoViewIfNeeded();
      await noOverflow(page);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => window.localStorage.setItem('theme', 'light'));
  await page.goto(`${base}/network/?code=221331`);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await shot(page, 'network-light');
  await noOverflow(page);
  assert.deepEqual(errors, [], 'no uncaught browser errors');
  console.log(`${engine}: network editor browser checks passed`);
} finally {
  await browser?.close();
  if (server)
    await new Promise((resolve, reject) => server.httpServer.close((error) => (error ? reject(error) : resolve())));
}
