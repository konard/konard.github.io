// Issue #47: screenshot of the fit fields of a level in the corners section of /settings/.
//   node experiments/issue-47-fit-settings-shot.mjs <out.png> [en|ru]
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { chromium } from 'playwright';

const [out = 'fit-settings.png', lang = 'en'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await page.addInitScript(
  ([settings, language]) => {
    localStorage.setItem('settings', settings);
    localStorage.setItem('lang', language);
  },
  [JSON.stringify({ 'corner.fitMinHeight': 90, 'corner.fitScale': 0 }), lang],
);
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${process.env.BASE || 'http://localhost:4173'}/settings/`, { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.addStyleTag({ content: 'header, nav, .topbar, .subnav { position: static !important; }' });
const label = lang === 'ru' ? 'Полные углы' : 'Full corners';
const scale = lang === 'ru' ? 'Углы вне ограничений' : 'Corners outside the limits';
// The fields of the panel level: the four limits and the scale of the corners outside them.
const items = page.locator('li.setting', { hasText: new RegExp(`^(${label}|${scale})`) }).filter({ visible: true });
console.log('fields', await items.count());
await items.first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const boxes = await items.evaluateAll((list) => list.slice(0, 5).map((el) => el.getBoundingClientRect().toJSON()));
const top = Math.min(...boxes.map((b) => b.top));
const bottom = Math.max(...boxes.map((b) => b.bottom));
const left = Math.min(...boxes.map((b) => b.left));
const right = Math.max(...boxes.map((b) => b.right));
await page.screenshot({
  path: out,
  clip: { x: left - 8, y: top - 8, width: right - left + 16, height: bottom - top + 16 },
});
await browser.close();
