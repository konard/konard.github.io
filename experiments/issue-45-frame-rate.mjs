// Probe: how many animation frames does a page render in 5 s (ENGINE, default webkit)?
// Used to find why element screenshots time out in local WebKit (issue #45).
//   ENGINE=webkit PAGES=/settings/,/experience/ LOOK='{"skin.name":"classic"}' node experiments/issue-45-frame-rate.mjs
/* global requestAnimationFrame, window */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const pages = (process.env.PAGES || '/,/settings/,/experience/').split(',');
const look = JSON.parse(process.env.LOOK || '{}');
const server = await createServer({ server: { port: 4247, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  for (const path of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
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
    const log = (step) => console.log(path, step, `${Date.now() - start} ms`);
    await page.goto(`http://localhost:4247${path}`);
    log('loaded');
    await page.locator('main').waitFor();
    await page.waitForTimeout(1000);
    page.evaluate(() => {
      window.__frames = [];
      const tick = (t) => {
        window.__frames.push(t);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    log('counting');
    await page.waitForTimeout(5000);
    const frames = await page.evaluate(() => window.__frames);
    const gaps = frames.slice(1).map((t, i) => t - frames[i]);
    console.log(path, `frames in 5 s: ${frames.length}`, `longest gap: ${Math.round(Math.max(0, ...gaps))} ms`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
