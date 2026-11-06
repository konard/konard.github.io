// Bounded reproduction: a loaded navigation is not proof React has mounted.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4189, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  await page.route('**/network/?*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /<script type="module" crossorigin src="([^"]+)"><\/script>/,
      (_, source) => `<script>window.addEventListener('load', () => window.setTimeout(() => {
        const script = document.createElement('script'); script.type = 'module';
        script.src = ${JSON.stringify(source)}; document.head.append(script);
      }, 400));</script>`,
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('http://localhost:4189/art/#symbols');
  await page.locator('.symbols__card').first().click();
  await page.waitForURL('**/network/**');
  const paths = page.locator('.network__preview g[stroke] > path:first-child');
  const before = await paths.count();
  assert.equal(before, 0, 'Loaded document can precede the editor mount');
  await paths.first().waitFor({ state: 'attached' });
  const after = await paths.count();
  assert.equal(after, 2, 'Waiting for actual geometry observes both link colors');
  const result = { delayedBootstrapMs: 400, pathsAfterNavigation: before, pathsAfterReadiness: after };
  console.log(JSON.stringify(result));
  if (process.env.RESULT_FILE) await writeFile(process.env.RESULT_FILE, JSON.stringify(result, null, 2) + '\n');
} finally {
  await browser?.close();
  await server.close();
}
