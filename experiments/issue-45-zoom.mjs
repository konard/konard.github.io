// Close looks at bordered elements with a look (issue #45): opens each page once
// at 2× device pixels and saves the first element of each selector.
//   node experiments/issue-45-zoom.mjs <out-dir> [look.json] [light|dark]
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [dir = 'zoom', lookFile, theme = 'dark'] = process.argv.slice(2);
const look = lookFile ? readFileSync(lookFile, 'utf8') : '{}';
const TARGETS = {
  '/settings/': [
    ['settings-group', '.settings__group'],
    ['preset', '.preset'],
    ['ui-preview', '.ui-preview__panel'],
    ['button', '.settings .button'],
    ['input', '.setting__input input:not([type=range]):not([type=checkbox])'],
    ['select', '.setting__input .ui-select'],
    ['json', '.settings__json'],
    ['palette-chip', '.palettes__chip'],
    ['samples', '.ui-samples'],
  ],
  '/experience/': [['position', '.position']],
  '/': [
    ['stat', '.stat'],
    ['card', '.card'],
  ],
};
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
for (const [path, targets] of Object.entries(TARGETS)) {
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
  await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`);
  await page.waitForTimeout(1500);
  for (const [name, selector] of targets) {
    const element = page.locator(selector).first();
    if (!(await element.count())) {
      console.log('missing', name);
      continue;
    }
    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await element.screenshot({ path: `${dir}/${name}.png` });
    console.log(`${dir}/${name}.png`);
  }
  await page.close();
}
await browser.close();
