// Crops a screenshot, to look at a detail (issue #15).
//   node experiments/crop.mjs in.png out.png x y width height
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [input, out, x, y, width, height] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.setContent(
  `<body style="margin:0;overflow:hidden"><img style="display:block;margin:-${y}px 0 0 -${x}px" src="data:image/png;base64,${readFileSync(input).toString('base64')}"></body>`,
);
await page.screenshot({ path: out });
await browser.close();
