/* global document, window */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { reported, randomNetworks } from './issue-41-cases.mjs';
import { waitForNetwork } from './wait-for-network.mjs';

const engine = process.env.ENGINE || 'chromium';
const phase = process.env.PHASE || 'after';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-41/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-41/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const result = { engine, phase, date: new Date().toISOString(), networks: [], errors: [] };
const server = await preview({ preview: { port: 4141, strictPort: true } });
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  result.version = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => result.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const go = async (code, options = '') => {
    await page.goto(`http://localhost:4141/network/?code=${code}&lang=en&${options}`);
    await waitForNetwork(page);
  };
  const picture = () => page.locator('.network__preview').innerHTML();
  const entries = [...reported, ...randomNetworks().map((code) => ({ code }))];
  for (const { code, turns } of entries) {
    await go(code);
    const original = await picture();
    const controls = await page
      .locator('.link-cards input[type=range]')
      .evaluateAll((inputs) => inputs.map(({ id, value }) => ({ id, value })));
    await page.locator('.network__preview').screenshot({ path: join(output, `${engine}-${phase}-${code}.png`) });
    const paths = await page
      .locator('.network__preview g[stroke] > path:first-child')
      .evaluateAll((lines) => lines.map((line) => line.getAttribute('d')));
    const sample = { code, controls, paths, svg: original };
    result.networks.push(sample);
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    await page.goto(shared);
    await waitForNetwork(page);
    assert.equal(await picture(), original, `${code}: default share changed the picture`);
    if (turns) {
      await go(code, `turns=${encodeURIComponent(phase === 'before' ? turns : '0 0')}`);
      const manual = await picture();
      sample.manual = manual;
      if (phase !== 'before') assert.equal(original, manual, `${code}: default differs from supplied arrangement`);
    }
    console.log(`${engine} ${phase}: ${code} default/share${turns ? '/supplied turns' : ''}`);
  }
  if (phase !== 'before') {
    // Issue 43: the corrected geometry is neutral, and editing starts at zero.
    await go('0222');
    assert.equal(await page.locator('#link-1-turn-1').inputValue(), '0');
    const numeric = page.locator('#link-1-turn-1-value');
    await numeric.fill('1');
    await numeric.press('Tab');
    assert.equal(await page.locator('#link-1-turn-1').inputValue(), '1');
    const edited = await picture();
    await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
    await waitForNetwork(page);
    assert.equal(await picture(), edited);
    await go('0222', 'solve=true');
    const solved = await picture();
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    await waitForNetwork(page);
    assert.equal(await picture(), solved, 'Apply changed the drawing');
    await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
    await waitForNetwork(page);
    assert.equal(await picture(), solved, 'applied share changed the drawing');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'SVG', exact: true }).click();
    const exported = await readFile(await (await pending).path(), 'utf8');
    assert.equal(
      await page.evaluate((svg) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = svg;
        return wrapper.innerHTML;
      }, exported),
      solved,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await go('0112');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: join(output, `${engine}-${phase}-mobile.png`), fullPage: true });
    result.interactions = 'native turn edit, default/manual share, worker, Apply, SVG download, mobile';
  }
  assert.deepEqual(result.errors, []);
} catch (error) {
  result.failure = error.stack;
  throw error;
} finally {
  await browser?.close();
  await server.close();
  await writeFile(join(data, `${engine}-${phase}.json`), JSON.stringify(result, null, 2) + '\n');
}
