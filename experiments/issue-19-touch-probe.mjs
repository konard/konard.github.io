/* global window, HTMLInputElement */
import { webkit } from 'playwright';
import { preview } from 'vite';
const server = await preview({ preview: { port: 4177, strictPort: true } });
const browser = await webkit.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('network.debug', 'true');
    const replace = window.history.replaceState.bind(window.history);
    window.history.replaceState = (...args) => {
      console.log('HISTORY', args[2]);
      return replace(...args);
    };
    for (const type of [
      'touchstart',
      'touchend',
      'touchcancel',
      'pointerdown',
      'pointerup',
      'pointercancel',
      'focusout',
      'keyup',
      'blur',
    ])
      window.addEventListener(type, (event) => console.log('EVENT', type, event.target?.id, event.target?.type), true);
  });
  const page = await context.newPage();
  page.on('console', (event) => console.log(event.text()));
  await page.goto('http://localhost:4177/network/?code=112212');
  const slider = page.locator('#style-targetAngle');
  await slider.dispatchEvent('touchstart');
  await slider.evaluate((node) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, 66);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(800);
  await slider.dispatchEvent('touchend');
  await page.waitForTimeout(500);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
