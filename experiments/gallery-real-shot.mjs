// Screenshots of "Every configuration of 1–4 links" with the default and with
// "Show only real references" (issue #13), on the built site served by
// `npx vite preview --port 4173` (BASE overrides the URL).
//
//   node experiments/gallery-real-shot.mjs <default.png> <real.png> [path]
import { chromium } from 'playwright';

const [before = 'gallery-default.png', after = 'gallery-real.png', path = '/research/'] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:4173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await page.goto(`${base}${path}`);
const gallery = page.locator('.symbols').first();
await gallery.getByRole('button', { name: /^2 links/ }).click();
await gallery.screenshot({ path: before });
await gallery.getByRole('button', { name: /Show only real references/ }).click();
await gallery.screenshot({ path: after });
console.log(await gallery.locator('.symbols__formula').innerText());
await browser.close();
