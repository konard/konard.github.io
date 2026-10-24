// A contact sheet of screenshots, to look at many of them at once (issue #15).
//   node experiments/screenshot-sheet.mjs out.png <width of one> img1 img2 ...
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [out, w, ...files] = process.argv.slice(2);
const html = `<body style="margin:0;background:#888;display:flex;flex-wrap:wrap;gap:6px">${files
  .map(
    (f) =>
      `<figure style="margin:0;width:${w}px"><img style="width:100%" src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption style="font:12px sans-serif">${f.split('/').pop()}</figcaption></figure>`,
  )
  .join('')}</body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
