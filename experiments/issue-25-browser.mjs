// Real-browser regressions for issue #25; finite fixtures, one engine at a time.
/* global document, Image, getComputedStyle, innerWidth */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-25/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-25/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4185, strictPort: true } });
let browser;
const results = { engine, date: new Date().toISOString(), checks: [], errors: [], cases: {} };
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  results.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => results.errors.push(error.message));
  const go = async (query) => {
    await page.goto(`http://localhost:4185/network/?code=2222&lang=en&rotation=90&${query}`);
    await page.locator('.network__preview svg').waitFor();
  };
  const shot = async (name, element = page.locator('.network__preview')) =>
    element.screenshot({ path: join(output, `${engine}-after-${name}.png`) });
  const manual = 'turns=15+-15&gaps=0.18+0.18+%7E+%7E';
  for (const [name, query] of Object.entries({
    manual,
    auto: 'solve=true',
    'auto-gaps': 'solve=true&gaps=0.18+0.18+%7E+%7E',
    acute: `${manual}&endAngle=5`,
    rounded: `${manual}&arrowJoin=round`,
    legacy: `${manual}&balanceArrows=false&arrowJoin=inherit`,
  })) {
    await go(query);
    await shot(name);
    results.cases[name] = {
      svg: await page.locator('.network__preview').innerHTML(),
      caption: await page.locator('figcaption').innerText(),
    };
    if (name.startsWith('auto')) {
      const preview = await page.locator('.network__preview').innerHTML();
      await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
      assert.equal(await page.locator('.network__preview').innerHTML(), preview);
      const url = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
      assert(new URL(url).searchParams.has('gaps'));
      assert(Number(await page.getByLabel('Link 1: Gap at the source reference', { exact: true }).inputValue()) > 0.08);
      assert(Number(await page.getByLabel('Link 1: Gap at the target reference', { exact: true }).inputValue()) > 0.08);
      await page.goto(url);
      assert.equal(await page.locator('.network__preview').innerHTML(), preview);
      results.checks.push(`${name}: apply/share/reload preserves exact drawing and discovered gaps`);
    }
  }
  // Inspect actual rasterized SVG paint, independently of the geometry helper.
  // Equally gapped lens endpoints must have the same horizontal pixel boundary.
  results.pixels = [];
  for (const angle of [5, 15, 45]) {
    await go(`${manual}&endAngle=${angle}&linejoin=round`);
    const measurement = await page.locator('.network__preview svg').evaluate(async (svg) => {
      // Supersample narrow tips to avoid OS-specific antialias quantization;
      // two pixels here keep the original one-pixel-per-1000 tolerance.
      const size = 2000;
      const copy = svg.cloneNode(true);
      copy.setAttribute('width', size);
      copy.setAttribute('height', size);
      const image = new Image();
      const url = URL.createObjectURL(new Blob([copy.outerHTML], { type: 'image/svg+xml' }));
      try {
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        const bottom = [-1, -1];
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // Include antialias coverage: an acute tip occupies only part of
            // its last pixel, so exact full-color matching truncates it.
            if (pixels[i + 2] > 5 && pixels[i] < pixels[i + 2] * 0.3 && pixels[i + 1] > pixels[i + 2] * 0.7)
              bottom[x < size / 2 ? 0 : 1] = y;
          }
        const arrow = svg.querySelectorAll('g[stroke]')[0].querySelectorAll('path')[2];
        return {
          size,
          bottom,
          join: getComputedStyle(arrow).strokeLinejoin,
          limit: Number(getComputedStyle(arrow).strokeMiterlimit),
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    assert(measurement.bottom.every((y) => y > 0));
    assert(
      Math.abs(measurement.bottom[0] - measurement.bottom[1]) <= measurement.size / 1000,
      JSON.stringify({ angle, measurement }),
    );
    assert.equal(measurement.join, 'miter');
    assert(measurement.limit >= 1 / Math.sin((angle * Math.PI) / 180));
    results.pixels.push({ angle, ...measurement });
  }
  results.checks.push('native SVG rasterization: sharp acute tips and aligned painted boundaries at 5°, 15°, 45°');
  await go(manual);
  const cards = page.getByRole('list', { name: 'Link configurations' });
  assert.equal(await cards.getByRole('listitem').count(), 2);
  assert.equal(await cards.locator('details').count(), 0);
  await shot('editor', cards);
  await page.locator('#links').scrollIntoViewIfNeeded();
  await shot('desktop', page);
  await page.getByLabel('Link 1: Gap at the source reference', { exact: true }).fill('0.21');
  await page.getByLabel('Link 2: Cut after the middle', { exact: true }).fill('3');
  const changed = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
  const drawing = await page.locator('.network__preview').innerHTML();
  await page.goto(changed);
  assert.equal(await page.locator('.network__preview').innerHTML(), drawing);
  await page.getByRole('button', { name: 'Remove: Link 1', exact: true }).click();
  assert.equal(await page.getByLabel('Link 1: Cut after the middle', { exact: true }).inputValue(), '3');
  results.checks.push('visible card fields, editing, inheritance, sharing and removal/renumbering');
  for (const lang of ['en', 'ru']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:4185/network/?code=2222&rotation=90&${manual}&lang=${lang}`);
    await page.locator('#links').scrollIntoViewIfNeeded();
    const bounds = await page.evaluate(() => {
      const overflow = [...document.querySelectorAll('.link-card input, .link-card select')].filter((node) => {
        const a = node.getBoundingClientRect();
        const b = node.closest('.link-card').getBoundingClientRect();
        return a.left < b.left || a.right > b.right || a.width < 40;
      }).length;
      return { width: document.documentElement.scrollWidth, viewport: innerWidth, overflow };
    });
    assert.equal(bounds.width, bounds.viewport);
    assert.equal(bounds.overflow, 0);
    await shot(`mobile-${lang}`, page);
  }
  results.checks.push('English/Russian mobile card controls fit without horizontal scrolling');
  assert.deepEqual(results.errors, []);
  console.log(JSON.stringify(results.checks, null, 2));
} finally {
  await writeFile(join(data, `${engine}-browser.json`), JSON.stringify(results, null, 2));
  await browser?.close();
  await server.httpServer.close();
}
