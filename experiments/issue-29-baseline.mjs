import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir } from 'node:fs/promises';
const dir = 'docs/case-studies/issue-29/screenshots';
await mkdir(dir, { recursive: true });
const server = await preview({ preview: { port: 4189, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  for (const [name, query] of [
    ['manual', 'turns=0+5%2C-15+15&gaps=0.08+%7E+0%2C0.18+0.18+0&solve=true'],
    ['auto', 'solve=true'],
  ]) {
    await page.goto(`http://localhost:4189/network/?code=1111&rotation=-90&lang=en&${query}`);
    await page.locator('#links').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/before-${name}-editor.png` });
    await page.locator('.network__preview').screenshot({ path: `${dir}/before-${name}.png` });
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.httpServer.close(r));
}
