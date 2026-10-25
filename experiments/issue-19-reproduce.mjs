/* global window, document */
import { chromium } from 'playwright';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4176, strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    const original = window.history.replaceState.bind(window.history);
    let writes = 0;
    window.history.replaceState = (...args) => {
      if (++writes > 10)
        throw new DOMException('Attempt to use history.replaceState() too frequently', 'SecurityError');
      return original(...args);
    };
  });
  page.on('pageerror', (error) => console.log(error.message));
  await page.goto('http://localhost:4176/network/?code=1122&angles=fixed');
  await page.locator('.network__preview svg').waitFor();
  await page.screenshot({ path: 'docs/case-studies/issue-19/screenshots/before-loops.png' });
  await page.locator('#style-targetAngle').evaluate((node) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    let value = 0;
    return new Promise((resolve) => {
      const next = () => {
        if (++value > 15 || !document.contains(node)) return resolve();
        setter.call(node, value);
        node.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(next, 10);
      };
      next();
    });
  });
  await page.waitForTimeout(100);
  console.log('Preview present after history failure:', await page.locator('.network__preview').count());
  await page.screenshot({ path: 'docs/case-studies/issue-19/screenshots/before-history-error.png' });
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
