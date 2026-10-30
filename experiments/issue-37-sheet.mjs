/* global document */
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const phase = process.env.PHASE || 'preserved';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  for (const part of [0, 1]) {
    await page.goto(`file://${resolve(`docs/case-studies/issue-37/data/random-${phase}.html`)}`);
    await page.evaluate((part) => {
      [...document.querySelectorAll('article')].forEach((el, i) => {
        if (Math.floor(i / 10) !== part) el.remove();
      });
    }, part);
    await page.screenshot({
      path: `docs/case-studies/issue-37/screenshots/random-${phase}-${part + 1}.png`,
      fullPage: true,
    });
  }
} finally {
  await browser.close();
}
