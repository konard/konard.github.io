/* global document */
// Issue 43 / PR 44 review: automatic spacing of 2211 and similar networks in a
// real browser. PHASE=before|after, DIST=<built site> (default: Vite's outDir). Records the solver's
// reported overlaps, the applied turns and gaps, and the drawing.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { waitForNetwork } from './wait-for-network.mjs';

const engine = process.env.ENGINE || 'chromium';
const phase = process.env.PHASE || 'after';
// Without DIST, preview serves Vite's configured outDir (`build/`), as CI builds it.
const dist = process.env.DIST;
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-43/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-43/data';
export const SOLVER_CODES = ['2211', '1221', '1210', '2010', '2011', '0210', '2001', '111212'];
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const result = { engine, phase, date: new Date().toISOString(), networks: [], errors: [] };
const server = await preview({ ...(dist && { build: { outDir: dist } }), preview: { port: 4144, strictPort: true } });
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  result.version = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(30000);
  page.on('pageerror', (error) => result.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  for (const code of SOLVER_CODES) {
    const started = Date.now();
    await page.goto(`http://localhost:4144/network/?code=${code}&lang=en&solve=true`);
    await waitForNetwork(page);
    const solvedMs = Date.now() - started;
    const overlaps = await page
      .locator('.network__view')
      .getByText(/overlaps/)
      .first()
      .textContent();
    await page.locator('.network__preview').screenshot({ path: join(output, `solver-${phase}-${code}.png`) });
    await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
    await waitForNetwork(page);
    const applied = new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams;
    const entry = {
      code,
      overlaps: overlaps.trim(),
      turns: applied.get('turns'),
      gaps: applied.get('gaps'),
      svgBytes: (await page.locator('.network__preview').innerHTML()).length,
      solvedMs,
    };
    result.networks.push(entry);
    console.log(JSON.stringify(entry));
    assert.match(entry.overlaps, /→ 0\.0$/, `${code}: automatic spacing leaves overlaps`);
    if (phase === 'after' && code === '2211') {
      // The PR 44 review case: turns alone clear it, references keep touching their targets.
      assert.equal(entry.gaps, null, '2211 must not widen gaps');
      const [source, target] = entry.turns.split(' ').map(Number);
      assert.ok(Math.sign(source) === -Math.sign(target) && Math.max(Math.abs(source), Math.abs(target)) > 30);
    }
  }
  assert.deepEqual(await page.evaluate(() => document.querySelectorAll('.network__view [role="alert"]').length), 0);
  assert.deepEqual(result.errors, []);
} catch (error) {
  result.failure = error.stack;
  throw error;
} finally {
  await browser?.close();
  await server.close();
  await writeFile(join(data, `solver-${engine}-${phase}.json`), JSON.stringify(result, null, 2) + '\n');
}
