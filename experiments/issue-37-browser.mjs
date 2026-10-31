import { chooseSelect } from './support/select.mjs';
// Native clicks, worker responsiveness, exact preview/Apply/export equivalence.
/* global document, window, requestAnimationFrame */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { randomNetworks } from './issue-37-networks.mjs';
import { waitForNetwork } from './wait-for-network.mjs';
const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-37/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-37/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4199, strictPort: true } });
const results = { engine, date: new Date().toISOString(), checks: [], networks: [], errors: [] };
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  results.version = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(30000);
  page.on('pageerror', (error) => results.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const go = async (query) => {
    await page.goto(`http://localhost:4199/network/?lang=en&${query}`);
    await waitForNetwork(page);
  };
  const picture = async () => {
    await waitForNetwork(page);
    return page.locator('.network__preview').innerHTML();
  };
  for (const [url, selector] of [
    ['/network/?code=2222&lang=en', '#style-strokeWidth'],
    ['/network/?code=2222&lang=en', '#link-1-turn-0'],
    ['/network/?code=2222&lang=en', '#link-1-startGap'],
    ['/settings/?lang=en', 'input[type="range"]:visible'],
  ]) {
    for (const suppressNativeFocus of [false, true]) {
      await page.goto(`http://localhost:4199${url}`);
      if (suppressNativeFocus)
        await page.evaluate(() =>
          document.addEventListener('mousedown', (event) => {
            if (event.target.matches('input[type="range"]')) {
              event.preventDefault();
              event.target.blur();
            }
          }),
        );
      const input = page.locator(selector).first();
      await input.click();
      assert(
        await input.evaluate((el) => document.activeElement === el),
        `${engine}: ${url} ${selector}, suppressNativeFocus=${suppressNativeFocus}: click lost focus`,
      );
      const before = Number(await input.inputValue());
      const step = Number(await input.getAttribute('step'));
      await page.keyboard.press('ArrowRight');
      assert(Math.abs(Number(await input.inputValue()) - before - step) < 1e-8);
      await page.keyboard.press('ArrowLeft');
      assert(Math.abs(Number(await input.inputValue()) - before) < 1e-8);
      assert(await input.evaluate((el) => document.activeElement === el));
      results.checks.push({ url, selector, suppressNativeFocus, before, step });
    }
  }
  console.log(`${engine}: native click-then-key focus passed in all four control contexts`);
  // Native dragging still works: explicit pointer focus must not cancel it.
  await go('code=2222');
  const slider = page.locator('#link-1-turn-0');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  assert(Number(await slider.inputValue()) > 30);
  await page.keyboard.press('ArrowLeft');
  assert(await slider.evaluate((el) => document.activeElement === el));
  // A slow fixture searches in a worker while the main page continues painting.
  await go('code=43434143');
  await page.evaluate(() => {
    window.issue37Frames = [];
    let previous = performance.now();
    const frame = (now) => {
      window.issue37Frames.push(now - previous);
      previous = now;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.locator('#style-solve').check();
  await page.waitForFunction(() => window.issue37Frames.length >= 10);
  const frames = await page.evaluate(() => window.issue37Frames.slice(1));
  assert(Math.max(...frames) < 500, `worker must keep the page responsive: ${frames}`);
  await waitForNetwork(page);
  results.frames = frames;
  results.checks.push(
    'worker paints while solving; native drag and click-then-key work with and without platform focus',
  );

  const identity = () =>
    page.locator('.network__preview g[stroke]').evaluateAll((groups) =>
      groups.map((group) => {
        const points = group
          .querySelector('path')
          .getAttribute('d')
          .match(/-?\d+(?:\.\d+)?/g)
          .map(Number);
        return { color: group.getAttribute('stroke'), middle: points.slice(6, 8) };
      }),
    );
  for (const code of ['2222', '34442132', ...randomNetworks()]) {
    await go(`code=${code}`);
    const original = await identity();
    if (['2222', '34442132'].includes(code))
      await page.locator('.network__preview').screenshot({ path: join(output, `${engine}-before-${code}.png`) });
    await page.locator('#style-solve').check();
    await waitForNetwork(page);
    assert.deepEqual(await identity(), original, `${code}: moved or recolored a link`);
    assert(!new URL(page.url()).searchParams.has('order'));
    assert(!new URL(page.url()).searchParams.has('spread'));
    const score = await page.locator('.network__score').textContent();
    const [before, after] = score.match(/[\d.]+/g).map(Number);
    assert(after <= before, `${code}: worsened score ${score}`);
    if (code === '2222') assert.equal(after, 0, `${code}: ${score}`);
    const solved = await picture();
    assert(solved.includes('<svg'));
    const counts = await page
      .locator('.network__preview g[stroke] > path:first-child')
      .evaluateAll((paths) => paths.map((path) => (path.getAttribute('d').match(/M/g) || []).length));
    assert(
      counts.every((count) => count === 1),
      `${code}: unexpected middle cut`,
    );
    if (['2222', '34442132'].includes(code))
      await page.locator('.network__preview').screenshot({ path: join(output, `${engine}-after-${code}.png`) });
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    assert.equal(await picture(), solved, `${code}: Apply changed picture`);
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    assert(new URL(shared).searchParams.has('frame'), `${code}: Apply lost the fixed rendering frame`);
    await page.goto(shared);
    assert.equal(await picture(), solved, `${code}: shared URL changed picture`);
    const bounds = await page.locator('.network__preview g[stroke]').evaluateAll((groups) =>
      groups.map((group) => {
        const { x, y, width, height } = group.getBBox();
        return { x, y, width, height };
      }),
    );
    assert(
      bounds.every(({ x, y, width, height }) => x >= 0 && y >= 0 && x + width <= 100 && y + height <= 100),
      `${code}: local adjustments clipped a path`,
    );
    results.networks.push({ code, score, shared, continuous: counts, bounds });
    console.log(`${engine}: ${code} preserves centers/colors and exact Apply/share output (${score})`);
  }
  // Explicit settings also keep the drawing's order, positions and colors.
  for (const options of [
    'solveGapRange=0.05&solveRange=180&solveStep=13',
    'palette=pastel&order=1+3+2+4&spread=0.7&rotation=39&placement=circle',
  ]) {
    await go(`code=34442132&${options}`);
    const original = await identity();
    await page.locator('#style-solve').check();
    await waitForNetwork(page);
    assert.deepEqual(await identity(), original, `${options}: moved or recolored a link`);
    const solved = await picture();
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    assert.equal(await picture(), solved);
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    await page.goto(shared);
    assert.equal(await picture(), solved);
    results.checks.push({ fixedPlacement: options, shared });
  }
  // Download the actual four-link image at its original positions.
  await go('code=34442132&solve=true');
  const solved = await picture();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '⤓ SVG', exact: true }).click();
  const exported = await readFile(await (await pending).path(), 'utf8');
  const serialized = await page.evaluate((source) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = source;
    return wrapper.innerHTML;
  }, exported);
  assert.equal(serialized, solved);
  // Cancellation: a new topology must never receive the old worker's result.
  await go('code=43434143');
  await page.locator('#style-solve').check();
  await page.locator('#style-solve').uncheck();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  await chooseSelect(page.locator('#style-palette'), 'pastel');
  await waitForNetwork(page);
  assert(!new URL(page.url()).searchParams.has('solve'));
  assert.equal(await page.locator('#style-palette').getAttribute('data-value'), 'pastel');
  const applied = new URL(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
  assert.equal(applied.searchParams.get('palette'), 'pastel');
  // Small screen and both translations remain usable.
  await page.setViewportSize({ width: 390, height: 844 });
  await go('code=2222&solve=true');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: join(output, `${engine}-after-mobile.png`), fullPage: true });
  await page.goto('http://localhost:4199/network/?code=2222&solve=true&lang=ru');
  await waitForNetwork(page);
  assert(await page.getByRole('button', { name: 'Применить повороты и зазоры связей', exact: true }).isEnabled());
  assert.deepEqual(results.errors, []);
  results.checks.push(
    '22 networks: fixed centers/colors, continuous, nonincreasing scores, exact Apply/share; SVG download; cancellation, concurrent style edits, mobile and Russian',
  );
} catch (error) {
  results.failure = error.stack;
  throw error;
} finally {
  await browser?.close();
  await server.close();
  await writeFile(join(data, `${engine}-browser.json`), JSON.stringify(results, null, 2) + '\n');
}
