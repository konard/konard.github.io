// Pixels of the frames for every corner shape and line (issue #45): shoots the
// element samples of the settings page (outer panels, inner blocks, controls)
// for a set of looks, or compares two sets of shots pixel by pixel. Used to
// check that a new way of writing the frame rules draws the same frames.
//   node experiments/issue-45-frame-pixels.mjs shoot <dir> [PORT=4261]
//   node experiments/issue-45-frame-pixels.mjs compare <dir-a> <dir-b>
/* global document, Image */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const [mode, dirA, dirB] = process.argv.slice(2);
const CORNERS = ['tl', 'tr', 'br', 'bl'];
const SHAPES = ['square', 'cut', 'tall', 'wide', 'round', 'scoop', 'notch'];
const LINES = ['accent', 'bracket', 'gap', 'line'];
const look = (shape, lines, extra = {}) => ({
  'motion.mode': 'off',
  ...Object.fromEntries(
    CORNERS.flatMap((corner, i) => [
      [`corner.${corner}Shape`, shape],
      [`corner.${corner}Line`, lines[i]],
      [`corner.${corner}Size`, 12 + i * 6],
    ]),
  ),
  ...extra,
});
const LOOKS = {
  ...Object.fromEntries(SHAPES.map((shape) => [shape, look(shape, LINES)])),
  ...Object.fromEntries(
    SHAPES.map((shape) => [`${shape}-rotated`, look(shape, ['line', 'accent', 'bracket', 'none'])]),
  ),
  'widths-dashed': look('cut', LINES, {
    'corner.tlWidth': 4,
    'corner.brWidth': 0,
    'corner.topWidth': 3,
    'corner.leftWidth': 0,
    'corner.edgeStyle': 'dashed',
  }),
  'below-dotted': look('round', LINES, {
    'corner.layer': 'below',
    'corner.edgeStyle': 'dotted',
    'corner.edges': 'line',
  }),
  'blocks-line': look('notch', LINES, { 'corner.blocks': 'line', 'corner.controls': 'border', 'corner.edges': 'none' }),
};

async function shoot(dir) {
  mkdirSync(dir, { recursive: true });
  const PORT = Number(process.env.PORT || 4261);
  const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'silent' });
  await server.listen();
  const browser = await chromium.launch();
  try {
    for (const [name, settings] of Object.entries(LOOKS)) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
      await page.route('https://platform.twitter.com/**', (route) => route.abort());
      await page.addInitScript((s) => {
        localStorage.setItem('settings', s);
        localStorage.setItem('theme', 'dark');
      }, JSON.stringify(settings));
      await page.goto(`http://localhost:${PORT}/settings/?lang=en`);
      await page.locator('.ui-samples__grid').waitFor();
      await page.waitForTimeout(800);
      await page.addStyleTag({
        content: '.topbar { position: static !important; } * { caret-color: transparent !important; }',
      });
      await page.evaluate(() => document.activeElement?.blur());
      await page.locator('.ui-samples__grid').screenshot({ path: `${dir}/${name}.png`, animations: 'disabled' });
      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`${Object.keys(LOOKS).length} shots in ${dir}`);
}

async function compare(a, b) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let worst = 0;
  for (const file of readdirSync(a).filter((f) => f.endsWith('.png'))) {
    const urls = [a, b].map((dir) => `data:image/png;base64,${readFileSync(`${dir}/${file}`).toString('base64')}`);
    const result = await page.evaluate(async (sources) => {
      const images = await Promise.all(
        sources.map(
          (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.src = src;
            }),
        ),
      );
      const data = images.map((image) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      });
      if (images[0].width !== images[1].width || images[0].height !== images[1].height)
        return { size: images.map((image) => `${image.width}x${image.height}`) };
      let differ = 0;
      let strong = 0;
      const where = [];
      for (let i = 0; i < data[0].length; i += 4) {
        const delta = Math.max(...[0, 1, 2].map((c) => Math.abs(data[0][i + c] - data[1][i + c])));
        if (delta > 0) differ += 1;
        if (delta > 64) {
          strong += 1;
          // Where the strong differences are, and how large: x,y:delta.
          if (where.length < 24)
            where.push(`${(i / 4) % images[0].width},${Math.floor(i / 4 / images[0].width)}:${delta}`);
        }
      }
      return { pixels: data[0].length / 4, differ, strong, ...(where.length ? { where } : {}) };
    }, urls);
    if (result.size) worst = Infinity;
    else worst = Math.max(worst, result.strong);
    console.log(JSON.stringify({ file, ...result }));
  }
  await browser.close();
  console.log(worst === 0 ? 'same frames' : `largest number of strongly different pixels: ${worst}`);
}

if (mode === 'shoot') await shoot(dirA);
else if (mode === 'compare') await compare(dirA, dirB);
else console.log('usage: shoot <dir> | compare <dir-a> <dir-b>');
