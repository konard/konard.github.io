// Probe: what a page holds after a while in an engine, with errors and console (issue #45 CI check).
//   ENGINE=webkit PAGE_PATH=/settings/ LOOK='{"corner.blocks":"line"}' REPEAT=3 node experiments/issue-45-webkit-load.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const path = process.env.PAGE_PATH || '/settings/';
const look = JSON.parse(process.env.LOOK || '{}');
const server = await createServer({ server: { port: 4248, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  for (let round = 0; round < Number(process.env.REPEAT || 1); round++) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', (error) => console.log('pageerror', error.message));
    page.on('console', (message) => message.type() === 'error' && console.log('console', message.text()));
    page.on('requestfailed', (request) => console.log('failed', request.url(), request.failure()?.errorText));
    await page.addInitScript(
      (settings) => {
        localStorage.setItem('lang', 'en');
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('settings', settings);
      },
      JSON.stringify({ 'motion.mode': 'off', 'sound.on': false, ...look }),
    );
    await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
    const start = Date.now();
    await page.goto(`http://localhost:4248${path}`, { waitUntil: 'commit' });
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(3000);
      const state = await page.evaluate(() => ({
        ready: document.readyState,
        main: document.querySelector('main')?.innerHTML.length ?? -1,
        samples: Boolean(document.querySelector('.ui-samples')),
      }));
      console.log(round, `${Date.now() - start} ms`, JSON.stringify(state));
      if (state.samples || (path !== '/settings/' && state.main > 0)) break;
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
