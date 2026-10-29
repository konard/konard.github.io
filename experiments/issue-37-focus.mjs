// Click with the mouse, then use the real keyboard: locator.press() would
// silently focus the control and hide the Safari regression.
/* global document */
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const engine = process.env.ENGINE || 'webkit';
const phase = process.env.PHASE || 'after';
const server = await createServer({ server: { port: 4197, strictPort: true } });
await server.listen();
let browser;
const result = { engine, phase, checks: [] };
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  for (const code of ['2222', '34442132']) {
    await page.goto(`http://localhost:4197/network/?code=${code}&solve=true&lang=en`);
    await page.locator('.network__preview svg').waitFor();
    await page
      .locator('.network__preview')
      .screenshot({ path: `docs/case-studies/issue-37/screenshots/${engine}-${phase}-${code}.png` });
  }
  for (const [url, selector] of [
    ['/network/?code=2222&lang=en', '#style-strokeWidth'],
    ['/network/?code=2222&lang=en', '#link-1-turn-0'],
    ['/settings/?lang=en', 'input[type="range"]:visible'],
  ]) {
    await page.goto(`http://localhost:4197${url}`);
    const input = page.locator(selector).first();
    if (!(await input.count())) continue;
    await input.click();
    const before = Number(await input.inputValue());
    const step = Number(await input.getAttribute('step'));
    const focused = await input.evaluate((el) => document.activeElement === el);
    await page.keyboard.press('ArrowRight');
    const after = Number(await input.inputValue());
    result.checks.push({
      url,
      selector,
      before,
      step,
      after,
      focused,
      passed: focused && Math.abs(after - before - step) < 1e-8,
    });
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  await writeFile(
    `docs/case-studies/issue-37/data/${engine}-focus-${phase}.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
  await browser?.close();
  await server.close();
}
