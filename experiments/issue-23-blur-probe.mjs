// Standalone compositor/snapshot diagnostic: no app, frameworks or gallery.
// Run with XWD_FILE=... xvfb-run ...; see the case study for the complete command.
/* global document, Image */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { displayScreenshot } from './issue-23-display-capture.mjs';
const engine = process.env.ENGINE || 'firefox';
const output = 'docs/case-studies/issue-23';
await mkdir(`${output}/screenshots`, { recursive: true });
const browser = await { chromium, firefox, webkit }[engine].launch({
  headless: false,
  args: process.env.PROBE_ACCELERATED ? ['--hardware-acceleration-policy=always'] : [],
});
const results = { engine, version: browser.version(), pixels: {} };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 480 } });
  await page.setContent(`<style>
    body { margin:0; }
    #pattern { position:fixed; inset:0; background:repeating-linear-gradient(90deg,#000 0 4px,#fff 4px 8px); }
    header { position:fixed; inset:0 0 auto; height:100px; background:#10203066; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); }
  </style><div id="pattern"></div><header></header>`);
  const images = {};
  for (const state of ['blurred', 'sharp']) {
    if (state === 'sharp')
      await page.evaluate(() => {
        document.querySelector('header').style.backdropFilter = 'none';
        document.querySelector('header').style.webkitBackdropFilter = 'none';
      });
    // RAFs precede the compositor's display update. Allow that finite update
    // before reading the live framebuffer; unlike screenshot(), XWD has no fence.
    await page.waitForTimeout(500);
    images[`${state}Api`] = await page.screenshot({ path: `${output}/screenshots/${engine}-minimal-${state}-api.png` });
    images[`${state}Display`] = await displayScreenshot(`${output}/screenshots/${engine}-minimal-${state}-display.png`);
  }
  for (const mode of ['Api', 'Display']) {
    results.pixels[mode] = await page.evaluate(
      async ([a, b]) => {
        const read = async (source) => {
          const img = new Image();
          img.src = `data:image/png;base64,${source}`;
          await img.decode();
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, img.width, img.height).data;
        };
        const [x, y] = await Promise.all([read(a), read(b)]);
        let count = 0;
        for (let i = 0; i < x.length; i += 4)
          if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 30) count++;
        return count;
      },
      [images[`blurred${mode}`].toString('base64'), images[`sharp${mode}`].toString('base64')],
    );
  }
  console.log(JSON.stringify(results));
  assert(results.pixels.Display > 5000, 'the actual display must distinguish blurred and sharp headers');
} finally {
  await writeFile(`${output}/data/${engine}-minimal-blur.json`, JSON.stringify(results, null, 2) + '\n');
  await browser.close();
}
