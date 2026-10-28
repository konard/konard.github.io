/* global document, window */
// Finite diagnostic for the CI-only Chromium/Xvfb startup timeout.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const output = process.env.RESULT_DIR || 'experiments/out/issue23-startup';
await mkdir(output, { recursive: true });
const server = await preview({ preview: { port: 4195, strictPort: true } });
const results = [];
let browser;
try {
  browser = await chromium.launch({ headless: !process.env.DISPLAY });
  for (let attempt = 0; attempt < 10; attempt++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('lang', 'en');
      localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
    });
    const page = await context.newPage();
    const result = { attempt, errors: [], requests: [], console: [] };
    results.push(result);
    page.on('pageerror', (error) => result.errors.push(error.message));
    page.on('requestfailed', (request) => result.requests.push([request.url(), request.failure()]));
    page.on('console', (message) => result.console.push([message.type(), message.text()]));
    const start = Date.now();
    try {
      const response = await page.goto('http://localhost:4195/network/?code=00000000');
      result.status = response.status();
      assert.equal(await page.locator('#style-bulge').inputValue({ timeout: 15000 }), '0');
      result.readyAfterMs = Date.now() - start;
      console.log(JSON.stringify(result));
    } catch (error) {
      result.failure = error.message;
      result.dom = await page.evaluate(() => ({
        readyState: document.readyState,
        visibility: document.visibilityState,
        url: window.location.href,
        text: document.body.innerText.slice(0, 5000),
        scripts: [...document.scripts].map((script) => script.src),
      }));
      await page.screenshot({ path: `${output}/failure-${attempt}.png`, timeout: 10000 });
      throw error;
    } finally {
      await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
