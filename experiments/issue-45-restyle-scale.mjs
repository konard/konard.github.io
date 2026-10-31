// Does the restyle of the custom frame cost per element or once on the root
// (issue #45)? The settings page is hidden (display: none, so its elements get
// no style) and N plain panels or plain divs are added; then a variable on
// <html> changes, as a slider does, and a box is read.
//   [ENGINE=webkit] [COUNTS=0,100,1000] [ROUNDS=5] [PORT=4258] node experiments/issue-45-restyle-scale.mjs
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const PORT = Number(process.env.PORT || 4258);
const counts = (process.env.COUNTS || '0,100,1000').split(',').map(Number);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' })));
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelectorAll('input[type="range"]').length > 50, null, {
    polling: 250,
    timeout: 120000,
  });
  for (const kind of ['card', 'plain']) {
    for (const count of counts) {
      const times = await page.evaluate(
        ({ count, kind, rounds }) => {
          for (const child of document.body.children) child.style.display = 'none';
          document.querySelector('#probe-box')?.remove();
          const box = document.createElement('div');
          box.id = 'probe-box';
          for (let i = 0; i < count; i += 1) {
            const div = document.createElement('div');
            if (kind === 'card') div.className = 'card';
            div.textContent = 'x';
            box.append(div);
          }
          document.body.append(box);
          void document.body.offsetHeight;
          const out = [];
          for (let round = 0; round < rounds; round += 1) {
            const start = performance.now();
            document.documentElement.style.setProperty('--probe', String(round));
            void document.body.offsetHeight;
            out.push(Math.round((performance.now() - start) * 10) / 10);
          }
          return out;
        },
        { count, kind, rounds: Number(process.env.ROUNDS || 5) },
      );
      console.log(JSON.stringify({ kind, count, times }));
    }
  }
} finally {
  await browser.close();
  await server.close();
}
