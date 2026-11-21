// Bounded diagnosis of framework DOM work during an unchanged select's parent update.
/* global document, window, HTMLInputElement, MutationObserver */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const server = await preview({ preview: { port: 4188, strictPort: true } });
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  await page.goto('http://localhost:4188/network/?code=43434143');
  await page.locator('.network__preview[aria-busy="false"] svg').waitFor();
  const measured = await page.evaluate(async () => {
    const records = [];
    const controls = [...document.querySelectorAll('.framework-control')];
    const observer = new MutationObserver((changes) => records.push(...changes));
    controls.forEach((control) => observer.observe(control, { subtree: true, attributes: true, childList: true }));
    const input = document.querySelector('#style-targetAngle');
    const start = performance.now();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    // Eight edits are enough to expose repeated writes without stressing the host.
    for (let i = 1; i <= 8; i++) {
      setter.call(input, 50 + i);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    observer.disconnect();
    return {
      controls: controls.length,
      edits: 8,
      elapsedMs: performance.now() - start,
      unchangedSelectMutations: records.length,
      attributes: Object.fromEntries(
        [...new Set(records.map((record) => record.attributeName))].map((name) => [
          name,
          records.filter((record) => record.attributeName === name).length,
        ]),
      ),
    };
  });
  const result = { engine, ...measured };
  console.log(JSON.stringify(result, null, 2));
  if (process.env.RESULT_FILE) await writeFile(process.env.RESULT_FILE, JSON.stringify(result, null, 2) + '\n');
  if (process.env.EXPECT_STABLE === '1') assert.equal(measured.unchangedSelectMutations, 0);
} finally {
  await browser?.close();
  await server.close();
}
