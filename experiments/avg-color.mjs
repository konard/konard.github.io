// Average colour of PNG screenshots (issue #15), to compare them without
// looking: node experiments/avg-color.mjs a.png b.png ...
/* global document, Image */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage();
for (const file of process.argv.slice(2)) {
  const url = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  const rgb = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    const sum = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += data[i + c];
    return sum.map((s) => Math.round(s / (data.length / 4)));
  }, url);
  console.log(`${file}: rgb(${rgb.join(', ')})`);
}
await browser.close();
