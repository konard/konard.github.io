// Isolate GTK's actionability wait from actual native pointer/keyboard behavior.
/* global document, requestAnimationFrame */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { preview } from 'vite';
import { webkit } from 'playwright';
const server = await preview({ preview: { port: 4202, strictPort: true } });
let browser;
const result = {};
try {
  browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  await page.goto('http://localhost:4202/settings/?lang=en');
  result.document = await page.evaluate(() => ({ visibility: document.visibilityState, ready: document.readyState }));
  result.animationFrame = await page.evaluate(() =>
    Promise.race([
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve('two frames')))),
      new Promise((resolve) => setTimeout(() => resolve('no two frames within one second'), 1000)),
    ]),
  );
  const input = page.locator('input[type="range"]:visible').first();
  await input.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  result.box = await input.boundingBox();
  result.before = Number(await input.inputValue());
  const { x, y, width, height } = result.box;
  assert(y > 0 && y + height < 1100, 'native pointer target must be on screen');
  await page.mouse.click(x + width / 2, y + height / 2);
  result.focused = await input.evaluate((el) => document.activeElement === el);
  result.clicked = Number(await input.inputValue());
  await page.keyboard.press('ArrowRight');
  result.after = Number(await input.inputValue());
  assert(result.focused);
  assert(Math.abs(result.after - result.clicked - Number(await input.getAttribute('step'))) < 1e-8);
  console.log(result);
} finally {
  await writeFile('docs/case-studies/issue-37/data/webkit-settings-probe.json', JSON.stringify(result, null, 2) + '\n');
  await browser?.close();
  await server.close();
}
