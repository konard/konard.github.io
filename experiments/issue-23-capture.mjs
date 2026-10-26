// Readable mobile review evidence; the browser suites separately test 844px phones.
/* global window, document */
import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4179, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 1200 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto('http://localhost:4179/network/?code=221331&gaps=0.25+~+~+~,~+~+~+4&lang=ru');
  await page.locator('.link-gaps summary').click();
  await page.evaluate(() => {
    const gaps = document.querySelector('.link-gaps').getBoundingClientRect();
    const header = document.querySelector('.topbar').getBoundingClientRect();
    window.scrollBy(0, gaps.top - header.bottom - 16);
  });
  await page.locator('.link-gaps').screenshot({ path: 'docs/case-studies/issue-23/screenshots/mobile-gaps.png' });
  await context.close();
} finally {
  await browser?.close();
  await server.close();
}
