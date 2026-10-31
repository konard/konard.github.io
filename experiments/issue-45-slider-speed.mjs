// Time of the eight navigation keys on the settings sliders (issue #45): the
// issue #27 audit got four times slower in WebKit on macOS with the Matrix
// universe look. Prints the mean time per slider and the slowest sliders.
//   [ENGINE=webkit] [LIMIT=20] [LOOK='{"key":value}'] [PORT=4249] node experiments/issue-45-slider-speed.mjs
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'webkit';
const limit = Number(process.env.LIMIT || 20);
const look = JSON.parse(process.env.LOOK || '{}');
const PORT = Number(process.env.PORT || 4249);
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await { chromium, firefox, webkit }[engine].launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  await page.addInitScript(
    (settings) => localStorage.setItem('settings', settings),
    JSON.stringify({ 'motion.mode': 'off', ...look }),
  );
  await page.goto(`http://localhost:${PORT}/settings/?lang=en`);
  await page.locator('main').waitFor();
  await page.waitForTimeout(1000);
  const ids = await page.locator('input[type="range"]').evaluateAll((inputs) => inputs.map((input) => input.id));
  const times = [];
  // Chromium splits the time into script, style, layout and paint work.
  const cdp = engine === 'chromium' ? await page.context().newCDPSession(page) : null;
  const metrics = async () =>
    cdp
      ? Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics
            .filter(({ name }) => /Duration$|^Nodes$|RecalcStyleCount|LayoutCount/.test(name))
            .map(({ name, value }) => [name, value]),
        )
      : {};
  await cdp?.send('Performance.enable');
  const before = await metrics();
  for (const [index, id] of ids.slice(0, limit).entries()) {
    const input = page.locator('input[type="range"]').nth(index);
    const start = Date.now();
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'PageUp', 'PageDown', 'Home', 'End']) {
      await input.press(key);
      await input.inputValue();
    }
    times.push([id, Date.now() - start]);
  }
  const total = times.reduce((sum, [, time]) => sum + time, 0);
  const after = await metrics();
  const spent = Object.fromEntries(
    Object.keys(after).map((name) => [
      name,
      /Duration$/.test(name)
        ? Math.round(((after[name] - before[name]) * 1000) / times.length)
        : Math.round(after[name] - (name === 'Nodes' ? 0 : before[name])),
    ]),
  );
  console.log(
    JSON.stringify({
      engine,
      look,
      sliders: ids.length,
      measured: times.length,
      meanMs: Math.round(total / times.length),
      perSliderMs: spent,
      slowest: times.sort((a, b) => b[1] - a[1]).slice(0, 5),
    }),
  );
} finally {
  await browser.close();
  await server.close();
}
