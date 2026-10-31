// Screenshots of the open colour chooser with its palettes and of an open menu (issue #45).
//   [THEME=light] node experiments/issue-45-picker.mjs <out-dir> [name=json ...]
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [dir = 'picker', ...pairs] = process.argv.slice(2);
const looks = pairs.length
  ? pairs.map((pair) => [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)])
  : [['default', '{}']];
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
for (const [name, look] of looks) {
  const theme = process.env.THEME || 'dark';
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.addInitScript(
    ([s, t]) => {
      localStorage.setItem('settings', s);
      localStorage.setItem('theme', t);
    },
    [look, theme],
  );
  await page.goto(`${process.env.BASE || 'http://localhost:4173'}/settings/`);
  await page.waitForTimeout(1200);
  const trigger = page.locator('.ui-samples .ui-color__swatch');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.locator('.ui-color__picker');
  await dialog.waitFor();
  await page.waitForTimeout(300);
  const box = await dialog.boundingBox();
  const inView = box.y >= 0 && box.y + box.height <= 900;
  console.log(name, 'chooser', JSON.stringify(box), inView ? 'in view' : 'OUT OF VIEW');
  await page.screenshot({
    path: `${dir}/${name}-chooser.png`,
    clip: { x: box.x - 12, y: box.y - 12, width: box.width + 24, height: box.height + 24 },
  });
  await dialog.getByRole('button', { name: /Neon pink/ }).click();
  await page.waitForTimeout(200);
  console.log(name, 'value after a click', await page.locator('.ui-samples .ui-color input').inputValue());
  await page.keyboard.press('Escape');
  const select = page.locator('.ui-samples .ui-select').first();
  await select.click();
  const list = page.locator('.ui-select__list').first();
  await list.waitFor();
  const lbox = await list.boundingBox();
  await page.screenshot({
    path: `${dir}/${name}-menu.png`,
    clip: { x: lbox.x - 12, y: lbox.y - 60, width: lbox.width + 24, height: lbox.height + 72 },
  });
  console.log(`${dir}/${name}-chooser.png ${dir}/${name}-menu.png`);
  await page.close();
}
await browser.close();
