// Real-browser geometry, keyboard and old bookmark regressions; finite fixtures.
/* global document, Image */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-27/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-27/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4187, strictPort: true } });
const result = { engine, date: new Date().toISOString(), checks: [], errors: [] };
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  result.version = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => result.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const go = async (query = '') => {
    await page.goto(`http://localhost:4187/network/?code=1111&lang=en&rotation=-90&${query}`);
    await page.locator('.network__preview svg').waitFor();
  };
  const shot = async (name, element = page.locator('.network__preview')) =>
    element.screenshot({ path: join(output, `${engine}-after-${name}.png`) });
  const manual = 'turns=0+0%2C-15+15&gaps=0.08+0.08+%7E+%7E%2C0.18+0.18+%7E+%7E';
  await go(manual);
  const initial = await page.locator('.network__preview').innerHTML();
  await page.waitForURL((url) => url.searchParams.get('turns') === ',-15 15');
  assert.equal(new URL(page.url()).searchParams.get('gaps'), '0.08 0.08,0.18 0.18');
  assert.equal(await page.locator('.network__preview').innerHTML(), initial);
  await page.reload();
  assert.equal(await page.locator('.network__preview').innerHTML(), initial);
  await shot('equal');
  await page.locator('#links').scrollIntoViewIfNeeded();
  await shot('editor', page);
  result.checks.push('historical URL upgrades through history, compacts default rows, and reloads the exact SVG');

  // Independent paint check: find nearest cyan pixels in narrow sectors around
  // the opposite closed ends, excluding the central dot and crossing shaft.
  result.paint = [];
  for (const angle of [5, 15, 45, 85]) {
    await go(`${manual}&endAngle=${angle}`);
    const measurement = await page.locator('.network__preview svg').evaluate(async (svg) => {
      const size = 2000;
      const copy = svg.cloneNode(true);
      copy.setAttribute('width', size);
      copy.setAttribute('height', size);
      const line = svg.querySelector('g[stroke] path');
      const numbers = line
        .getAttribute('d')
        .match(/-?\d+(?:\.\d+)?/g)
        .map(Number);
      const middle = numbers.slice(6, 8).map((v) => (v * size) / 100);
      const starts = numbers.slice(0, 2).map((v) => (v * size) / 100);
      const dir = starts.map((v, i) => v - middle[i]);
      const length = Math.hypot(...dir);
      const axis = dir.map((v) => v / length);
      const image = new Image();
      const url = URL.createObjectURL(new Blob([copy.outerHTML], { type: 'image/svg+xml' }));
      try {
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        const nearest = [Infinity, Infinity];
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const p = (y * size + x) * 4;
            if (!(pixels[p + 2] > 40 && pixels[p] < pixels[p + 2] * 0.3 && pixels[p + 1] > pixels[p + 2] * 0.7))
              continue;
            const dx = x + 0.5 - middle[0];
            const dy = y + 0.5 - middle[1];
            const radius = Math.hypot(dx, dy);
            const projection = dx * axis[0] + dy * axis[1];
            if (radius > (2.5 * size) / 100 && Math.abs(projection) / radius > 0.99)
              nearest[projection > 0 ? 0 : 1] = Math.min(nearest[projection > 0 ? 0 : 1], (radius * 100) / size);
          }
        return { nearest, size };
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    assert(measurement.nearest.every(Number.isFinite));
    assert(Math.abs(measurement.nearest[0] - measurement.nearest[1]) < 0.12, JSON.stringify({ angle, measurement }));
    result.paint.push({ angle, ...measurement });
  }
  result.checks.push('native rasterized closed gaps agree within 0.12 image units at 5°, 15°, 45°, 85°');
  await go('solve=true');
  await shot('auto');
  const preview = await page.locator('.network__preview').innerHTML();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  for (const name of ['Gap at the source reference', 'Gap at the target reference']) {
    assert.equal(await page.getByLabel(`Link 1: ${name} (value)`, { exact: true }).inputValue(), '');
    assert(Number(await page.getByLabel(`Link 2: ${name}`, { exact: true }).inputValue()) > 0.08);
  }
  assert.equal(await page.locator('.network__preview').innerHTML(), preview);
  await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
  assert.equal(await page.locator('.network__preview').innerHTML(), preview);
  result.checks.push(
    'automatic spacing preserves the closed link, changes open references, and applies/shares/reloads exactly',
  );

  await go(manual);
  const gap = page.getByLabel('Link 1: Gap at the target reference (value)', { exact: true });
  await gap.fill('0.07');
  await gap.press('ArrowUp');
  assert.equal(await gap.inputValue(), '0.08');
  await gap.press('ArrowDown');
  assert.equal(await gap.inputValue(), '0.07');
  // Native stepUp/Down use the same HTML constraints as the spinner buttons.
  for (const [method, expected] of [
    ['stepUp', '0.08'],
    ['stepDown', '0.07'],
  ]) {
    await gap.evaluate((input, method) => {
      input[method]();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, method);
    assert.equal(await gap.inputValue(), expected);
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    assert.equal(new URL(shared).searchParams.get('gaps').split(',')[0].split(' ')[1], expected);
  }
  await gap.fill('0.075');
  await gap.press('ArrowUp');
  assert.equal(await gap.inputValue(), '0.08');
  // Pointer events precede the browser's native spinner action. Inheritance
  // must be available to that action without changing the saved override.
  for (const [method, expected] of [
    ['stepDown', '0.07'],
    ['stepUp', '0.09'],
  ]) {
    await gap.fill('');
    const inherited = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    await gap.dispatchEvent('pointerdown');
    assert.equal(await page.getByLabel('Link to this picture', { exact: true }).inputValue(), inherited);
    await gap.evaluate((input, method) => {
      input[method]();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, method);
    assert.equal(await gap.inputValue(), expected);
  }
  await gap.fill('');
  await gap.dispatchEvent('pointerdown');
  await gap.press('Tab');
  assert.equal(await gap.inputValue(), '');
  await gap.fill('');
  await gap.press('ArrowUp');
  assert.equal(await gap.inputValue(), '0.09');
  const turn = page.getByLabel('Link 2: turn of the source, ° (value)', { exact: true });
  await turn.fill('');
  await turn.pressSequentially('-25');
  assert.equal(await turn.inputValue(), '-25');
  await turn.press('ControlOrMeta+A');
  await turn.press('Backspace');
  assert.equal(await turn.inputValue(), '');
  await turn.pressSequentially('-15');
  await turn.press('Tab');
  assert.equal(await turn.inputValue(), '-15');
  await gap.fill('0.07');
  await gap.press('Home');
  assert.equal(await gap.inputValue(), '0.07');
  result.checks.push(
    '0.07↔0.08 arrows/native stepping, inherited native/keyboard steps, negative typing, select-all, delete, Home and Tab',
  );

  console.log('Geometry, URL and number editing checks passed. Auditing sliders.');
  const audit = async (selector) => {
    const controls = await page.locator(selector).evaluateAll((inputs) =>
      inputs.map((input) => ({
        id: input.id,
        min: +input.min,
        max: +input.max,
        step: +input.step,
        value: +input.value,
      })),
    );
    for (const control of controls) {
      console.log(`Keyboard: ${control.id}`);
      const input = page.locator(`[id="${control.id}"]`);
      let current = control.value;
      for (const [key, count] of [
        ['ArrowUp', 1],
        ['ArrowDown', -1],
        ['ArrowRight', 1],
        ['ArrowLeft', -1],
        ['PageUp', 10],
        ['PageDown', -10],
        ['Home', 0],
        ['End', 0],
      ]) {
        const expected =
          key === 'Home'
            ? control.min
            : key === 'End'
              ? control.max
              : Math.min(control.max, Math.max(control.min, current + count * control.step));
        await input.press(key);
        current = Number(await input.inputValue());
        assert(Math.abs(current - expected) < 1e-8, JSON.stringify({ control, key, current, expected }));
      }
    }
    return controls.map((control) => control.id);
  };
  await go('');
  result.networkRanges = await audit('input[type="range"]');
  await page.goto('http://localhost:4187/settings/?lang=en');
  result.settingsRanges = await audit('input[type="range"]');
  result.checks.push(
    `all ${result.networkRanges.length} rendered network and ${result.settingsRanges.length} settings sliders support all eight navigation keys`,
  );
  assert.deepEqual(result.errors, []);
  console.log(JSON.stringify(result.checks, null, 2));
} finally {
  await writeFile(join(data, `${engine}-browser.json`), JSON.stringify(result, null, 2));
  await browser?.close();
  await server.httpServer.close();
}
