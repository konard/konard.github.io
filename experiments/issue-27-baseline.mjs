import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const dir = 'docs/case-studies/issue-27';
await mkdir(`${dir}/screenshots`, { recursive: true });
const server = await preview({ preview: { port: 4187, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const cases = {
    equal: 'rotation=-90&turns=0+0%2C-15+15&gaps=0.08+0.08+%7E+%7E%2C0.18+0.18+%7E+%7E',
    unequal: 'rotation=-90&turns=0+0%2C-15+15&gaps=0.08+0.07+%7E+%7E%2C0.18+0.18+%7E+%7E',
    auto: 'rotation=-90&solve=true',
  };
  const results = {};
  for (const [name, query] of Object.entries(cases)) {
    await page.goto(`http://localhost:4187/network/?code=1111&lang=en&${query}`);
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
