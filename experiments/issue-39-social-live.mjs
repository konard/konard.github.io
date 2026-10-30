// Bounded availability probe. External refusals are evidence, not a CI failure.
/* global window */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';

const server = await createServer({ server: { port: 4198, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'sound.on': false }));
  });
  const requests = [];
  page.on('response', (response) => {
    if (/twitter|x\.com/.test(response.url())) requests.push({ url: response.url(), status: response.status() });
  });
  page.on('requestfailed', (request) => {
    if (/twitter|x\.com/.test(request.url()))
      requests.push({ url: request.url(), error: request.failure()?.errorText });
  });
  await page.goto('http://localhost:4198/blog/?lang=en&network=x&debugEmbeds=1');
  const post = page.locator('.post').first();
  await post.scrollIntoViewIfNeeded();
  await post.locator('[data-loaded="true"], .post__body:visible').first().waitFor({ timeout: 16000 });
  const frame = post.locator('iframe').first();
  const loaded = (await post.locator('[data-loaded="true"]').count()) > 0;
  const result = {
    accessed: new Date().toISOString(),
    loaded,
    requests,
    iframe: loaded ? await frame.boundingBox() : null,
  };
  await post.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -90));
  await page.screenshot({ path: 'docs/case-studies/issue-39/screenshots/live-blog.png' });
  await writeFile('docs/case-studies/issue-39/data/live-social.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  await server.close();
}
