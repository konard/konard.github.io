// Screenshots of the CV page, the experience page with its CV buttons and the
// Russian home page (issue #11). Needs `npm run build`:
//   node experiments/cv-screenshots.mjs [outDir]
import { chromium } from 'playwright';
import { preview } from 'vite';

const out = process.argv[2] || 'docs/case-studies/issue-11/screenshots';
const server = await preview({ logLevel: 'error', preview: { port: 4181 } });
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch();

async function shoot({ name, url, theme = 'dark', colorScheme = 'dark', locale = 'en-US', element, full = false }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme, locale });
  if (theme) await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error(`${name}: ${e.message}`));
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const target = element ? page.locator(element) : page;
  await target.screenshot({ path: `${out}/${name}.png`, fullPage: full, animations: 'disabled', timeout: 60000 });
  console.log(`${out}/${name}.png`);
  await context.close();
}

for (const style of ['classic', 'compact', 'technical', 'academic']) {
  await shoot({
    name: `cv-${style}-en`,
    url: `/cv/?role=techlead&style=${style}&lang=en`,
    element: '.cv-paper',
    theme: 'light',
  });
}
await shoot({ name: 'cv-classic-ru', url: '/cv/?role=rust&lang=ru', element: '.cv-paper', theme: 'light' });
await shoot({ name: 'cv-page-dark', url: '/cv/?role=ml&lang=en' });
await shoot({ name: 'cv-page-light', url: '/cv/?role=ml&lang=en', theme: 'light' });
await shoot({ name: 'experience-cv-buttons-light', url: '/experience/?role=devops&lang=en', theme: 'light' });
await shoot({ name: 'experience-cv-buttons-ru-dark', url: '/experience/?role=rust&lang=ru' });
// No saved choice: the theme and the language come from the system.
await shoot({ name: 'home-auto-light-ru', url: '/', theme: null, colorScheme: 'light', locale: 'ru-RU' });
await browser.close();
await server.close();
