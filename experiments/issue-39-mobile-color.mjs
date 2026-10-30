/* global getComputedStyle, document */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { port: 4197, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'sound.on': false }));
  });
  await page.goto('http://localhost:4197/settings/?lang=en');
  const color = page.locator('#setting-ui-accent');
  await color.waitFor();
  const measurement = await color.evaluate((input) => {
    const style = getComputedStyle(input);
    const context = document.createElement('canvas').getContext('2d');
    context.font = style.font;
    return {
      available: input.clientWidth,
      required: context.measureText(input.value).width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
    };
  });
  assert.ok(measurement.available >= measurement.required, JSON.stringify(measurement));
  console.log('The complete hex color fits the mobile input.', measurement);
} finally {
  await browser?.close();
  await server.close();
}
