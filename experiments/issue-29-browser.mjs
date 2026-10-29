// Finite issue fixtures: manual preservation, paired controls and shared output.
/* global document, innerWidth */
import { waitForNetwork } from './wait-for-network.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-29/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-29/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4189, strictPort: true } });
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
  const go = async (query = '') => {
    await page.goto(`http://localhost:4189/network/?code=1111&rotation=-90&lang=en&${query}`);
    await waitForNetwork(page);
  };
  const picture = async () => {
    await waitForNetwork(page);
    return page.locator('.network__preview').innerHTML();
  };
  const shot = async (name, element = page.locator('.network__preview')) =>
    element.screenshot({ path: join(output, `${engine}-after-${name}.png`) });
  const slider = (name) => page.getByRole('slider', { name, exact: true });
  const manual = (angle) => `turns=0+5%2C-${angle}+${angle}&gaps=0.08+%7E+0%2C0.18+0.18+0`;
  for (const query of ['turns=%2C-15+15&gaps=%2C0.18+0.18', ...[5, 10, 15].map(manual)]) {
    await go(query);
    const before = await picture();
    await page.getByLabel('Reduce overlaps automatically', { exact: true }).check();
    await waitForNetwork(page);
    assert.equal(await picture(), before);
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    assert.equal(await picture(), before);
    await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
    assert.equal(await picture(), before);
  }
  result.checks.push('all four reported manual URLs are unchanged by automatic spacing, Apply and shared-link reload');
  await go(manual(15));
  await shot('manual');
  await page.locator('#links').scrollIntoViewIfNeeded();
  await shot('manual-editor', page);
  await shot('controls', page.locator('.link-card').nth(1));
  const source = slider('Link 2: turn of the source, °');
  const target = slider('Link 2: turn of the target, °');
  const a = await source.boundingBox();
  const b = await target.boundingBox();
  assert(Math.abs(a.y - b.y) < 1);
  assert(a.x + a.width <= b.x);
  const separator = await page.locator('.link-card__geometry').nth(1).boundingBox();
  assert(a.y > separator.y);
  for (const [key, value] of [
    ['ArrowRight', '-14'],
    ['ArrowLeft', '-15'],
    ['PageUp', '-5'],
    ['PageDown', '-15'],
    ['Home', '-180'],
    ['End', '180'],
  ]) {
    await source.press(key);
    assert.equal(await source.inputValue(), value);
    assert.equal(await target.inputValue(), '15');
  }
  await page.getByRole('button', { name: 'Back to the default: Link 2: turn of the source, °', exact: true }).click();
  assert.equal(await source.inputValue(), '0');
  assert.equal(await target.inputValue(), '15');
  const gap = slider('Link 1: Gap at the target reference');
  assert.equal(await gap.inputValue(), '0.08');
  assert.equal(await gap.getAttribute('max'), '1');
  await gap.press('ArrowRight');
  assert.equal(await gap.inputValue(), '0.09');
  await page
    .getByRole('button', { name: 'Back to the default: Link 1: Gap at the target reference', exact: true })
    .click();
  const global = slider('Gap at the target reference');
  await global.press('ArrowRight');
  assert.equal(await gap.inputValue(), '0.09');
  assert.equal(await page.getByLabel('Link 1: Gap at the target reference (value)', { exact: true }).inputValue(), '');
  result.checks.push(
    'source/target sliders share a row below the separator; one-degree keys, bounds, independent resets and inherited gaps work',
  );

  await go('solve=true');
  await shot('auto');
  const solved = await picture();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  assert.equal(await picture(), solved);
  const turns = [source, target];
  const values = await Promise.all(turns.map((input) => input.inputValue().then(Number)));
  assert.equal(values[0] + values[1], 0);
  const gaps = await Promise.all(
    ['source', 'target'].map((end) => slider(`Link 2: Gap at the ${end} reference`).inputValue().then(Number)),
  );
  assert.equal(gaps[0], gaps[1]);
  assert(gaps[0] > 0.08 && gaps[0] < 0.2);
  // Recover the painted arrow apex from the exported marker's two arms.
  // Its forward projection must match the round-capped source shaft.
  result.alignment = await page
    .locator('.network__preview svg g[stroke]')
    .nth(1)
    .evaluate((group) => {
      const numbers = (path) =>
        path
          .getAttribute('d')
          .match(/-?\d+(?:\.\d+)?/g)
          .map(Number);
      const shaft = numbers(group.children[0]);
      const arrow = numbers(group.children[2]);
      const direction = [arrow[2] - (arrow[0] + arrow[4]) / 2, arrow[3] - (arrow[1] + arrow[5]) / 2];
      const length = Math.hypot(...direction);
      const extension = 1.3 / 2 / Math.sin(Math.PI / 4);
      return { sourceY: shaft[1] + 1.3 / 2, targetY: arrow[3] + (extension * direction[1]) / length };
    });
  assert(Math.abs(result.alignment.sourceY - result.alignment.targetY) < 0.03, JSON.stringify(result.alignment));
  await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
  assert.equal(await picture(), solved);
  await page.locator('#links').scrollIntoViewIfNeeded();
  await shot('auto-editor', page);
  result.solution = { turns: values, gaps };
  result.checks.push(
    'default auto solution mirrors ends, uses equal close reference gaps, aligns painted tips within 0.03 SVG units, and applies/shares exactly',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:4189/network/?code=1111&rotation=-90&lang=ru');
  await page.getByRole('slider', { name: 'Связь 2: поворот начало, °', exact: true }).press('ArrowLeft');
  await page.locator('#links').scrollIntoViewIfNeeded();
  await shot('mobile-ru', page);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  result.checks.push('Russian controls work at 390px without horizontal overflow');
  assert.deepEqual(result.errors, []);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await writeFile(join(data, `${engine}-browser.json`), JSON.stringify(result, null, 2) + '\n');
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
