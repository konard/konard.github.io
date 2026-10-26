import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const dir = 'docs/case-studies/issue-25';
await mkdir(`${dir}/screenshots`, { recursive: true });
const server = await preview({ preview: { port: 4185, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const cases = {
    manual: 'rotation=90&turns=15+-15&gaps=0.18+0.18+%7E+%7E',
    auto: 'rotation=90&solve=true',
    'auto-gaps': 'rotation=90&solve=true&gaps=0.18+0.18+%7E+%7E',
    acute: 'rotation=90&turns=15+-15&gaps=0.18+0.18+%7E+%7E&endAngle=5',
  };
  const results = {};
  for (const [name, query] of Object.entries(cases)) {
    await page.goto(`http://localhost:4185/network/?code=2222&lang=en&${query}`);
    await page.locator('.network__preview svg').waitFor();
    await page.locator('.network__preview').screenshot({ path: `${dir}/screenshots/before-${name}.png` });
    results[name] = {
      svg: await page.locator('.network__preview').innerHTML(),
      score: await page.locator('figcaption').innerText(),
    };
  }
  await page.locator('#links').screenshot({ path: `${dir}/screenshots/before-editor.png` });
  await writeFile(`${dir}/data/baseline.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  await server.httpServer.close();
}
