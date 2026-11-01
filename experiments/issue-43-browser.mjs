/* global document, window */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { randomNetworks } from './issue-41-cases.mjs';
import { waitForNetwork } from './wait-for-network.mjs';

const engine = process.env.ENGINE || 'chromium';
const phase = process.env.PHASE || 'after';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-43/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-43/data';
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const result = { engine, phase, date: new Date().toISOString(), networks: [], errors: [] };
const server = await preview({ preview: { port: 4143, strictPort: true } });
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
    await page.goto(`http://localhost:4143/network/?code=${code}&lang=en&${options}`);
    await waitForNetwork(page);
  };
  const picture = () => page.locator('.network__preview').innerHTML();
  for (const code of ['0211', '2011', '2210', '2221', '0222', '0112', '0001', '2002', ...randomNetworks()]) {
    await go(code);
    const svg = await picture();
    const turns = await page
      .locator('.link-cards input[type=range]')
      .evaluateAll((inputs) =>
        inputs.filter(({ id }) => id.includes('-turn-')).map(({ id, value }) => ({ id, value })),
      );
    await page.locator('.network__preview').screenshot({ path: join(output, `${engine}-${phase}-${code}.png`) });
    const sample = { code, turns, svg };
    result.networks.push(sample);
    await go(code, 'turns=0+0');
    sample.explicitZeroMatches = svg === (await picture());
    if (phase !== 'before') {
      assert(
        turns.every(({ value }) => value === '0'),
        `${code}: a default turn is nonzero`,
      );
      assert(sample.explicitZeroMatches, `${code}: explicit zero differs from neutral geometry`);
    }
    const explicit = await picture();
    await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
    await waitForNetwork(page);
    assert.equal(await picture(), explicit, `${code}: shared explicit zero geometry changed`);
    await go(code);
    await page.goto(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
    await waitForNetwork(page);
    assert.equal(await picture(), svg, `${code}: shared default geometry changed`);
    console.log(`${engine} ${phase}: ${code}, zero controls=${turns.every(({ value }) => value === '0')}`);
  }
  result.navigation = [];
  for (const [code, expected] of [
    ['11', '0000'],
    ['2222', '000000'],
    ['333333', '00000000'],
  ]) {
    await go(code);
    await page.getByRole('button', { name: /Next network/ }).click();
    const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
    result.navigation.push({ code, shared });
    if (phase !== 'before') {
      assert.equal(new URL(shared).searchParams.get('code'), expected);
      await page.getByRole('button', { name: /Previous network/ }).click();
      assert.equal(new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('code'), code);
    }
  }
  await go('0000');
  const real = page.getByRole('button', { name: 'Random real network', exact: true });
  result.randomRealButton = await real.count();
  if (phase !== 'before') {
    result.randomReal = [];
    for (const [code, n] of [
      ['00', 1],
      ['0000', 2],
      ['000000', 3],
      ['0000000000', 5],
      [Array.from({ length: 10 }, () => '0,0').join(';'), 10],
    ]) {
      await go(code);
      for (let i = 0; i < 5; i++) {
        await real.click();
        const next = new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('code');
        const refs = next.includes(',')
          ? next.split(';').flatMap((row) => row.split(',').map(Number))
          : next.split('').map(Number);
        assert(
          refs.every((ref) => ref >= 1 && ref <= n),
          `invalid real reference: ${next}`,
        );
        assert.equal(refs.length, 2 * n);
        result.randomReal.push({ n, code: next });
      }
    }
    await go('0211');
    const original = await picture();
    const numeric = page.locator('#link-1-turn-1-value');
    await numeric.fill('12');
    await numeric.press('Tab');
    assert.equal(await page.locator('#link-1-turn-1').inputValue(), '12');
    assert.notEqual(await picture(), original);
    const edited = await picture();
    await page.goto(await page.getByLabel('Link to this picture').inputValue());
    await waitForNetwork(page);
    assert.equal(await picture(), edited);
    await page.getByRole('button', { name: 'Back to the default: Link 1: turn of the target, °', exact: true }).click();
    assert.equal(await page.locator('#link-1-turn-1').inputValue(), '0');
    assert.equal(await picture(), original);
    await go('0211', 'solve=true');
    const solved = await picture();
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    await waitForNetwork(page);
    assert.equal(await picture(), solved, 'Apply changed the drawing');
    await page.goto(await page.getByLabel('Link to this picture').inputValue());
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
    await go('0211');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: join(output, `${engine}-${phase}-mobile.png`), fullPage: true });
    result.interactions =
      'zero defaults, sharing, size transitions, random real, edit/reset, worker, Apply, SVG, mobile';
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
