// Bounded native-pixel investigation: one SVG, two resolutions, endpoint rows.
/* global document, Image */
import { readFile, writeFile } from 'node:fs/promises';
import { webkit } from 'playwright';
const { cases } = JSON.parse(await readFile('docs/case-studies/issue-25/data/webkit-browser.json', 'utf8'));
const browser = await webkit.launch();
const measurements = [];
try {
  const page = await browser.newPage();
  for (const size of [1000, 2000]) {
    measurements.push(
      await page.evaluate(
        async ({ svg, size }) => {
          const image = new Image();
          image.src = `data:image/svg+xml,${encodeURIComponent(svg.replace('width="2048" height="2048"', `width="${size}" height="${size}"`))}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, size, size);
          const pixels = ctx.getImageData(0, 0, size, size).data;
          const bottom = [-1, -1];
          const rows = Array.from({ length: size * 0.02 }, (_, j) => {
            const y = size * 0.63 + j;
            const maxBlue = [0, 0];
            for (let x = 0; x < size; x++) {
              const i = (y * size + x) * 4;
              if (pixels[i] < pixels[i + 2] * 0.3 && pixels[i + 1] > pixels[i + 2] * 0.7) {
                const side = x < size / 2 ? 0 : 1;
                maxBlue[side] = Math.max(maxBlue[side], pixels[i + 2]);
                if (pixels[i + 2] > 5) bottom[side] = y;
              }
            }
            return { y, maxBlue };
          });
          return { size, bottom, rows };
        },
        { svg: cases.acute.svg, size },
      ),
    );
  }
  await writeFile('docs/case-studies/issue-25/data/webkit-pixels.json', JSON.stringify(measurements, null, 2));
  console.log(JSON.stringify(measurements));
} finally {
  await browser.close();
}
