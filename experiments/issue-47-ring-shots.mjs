// Issue #47: the ring under the photo with several settings, side by side.
//   node experiments/issue-47-ring-shots.mjs <out.png>
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
import { chromium } from 'playwright';

const out = process.argv[2] || 'ring.png';
const VARIANTS = [
  ['Default (futuristic skin)', {}],
  [
    'Still, 45°, wider ring, round photo',
    { 'avatar.spin': 'still', 'avatar.angle': 45, 'avatar.ringWidth': 18, 'avatar.photoShape': 'circle' },
  ],
  [
    'Thin circle, no glow',
    {
      'avatar.spin': 'still',
      'avatar.ringShape': 'circle',
      'avatar.photoShape': 'circle',
      'avatar.ringWidth': 4,
      'avatar.glow': 0,
    },
  ],
  [
    'Rounded, 2 s per turn, counter',
    { 'avatar.ringShape': 'rounded', 'avatar.photoShape': 'rounded', 'avatar.spin': 'counter', 'avatar.period': 2 },
  ],
  ['Ring hidden', { 'avatar.ring': false }],
];

const browser = await chromium.launch();
const shots = [];
for (const [label, settings] of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await page.addInitScript((value) => localStorage.setItem('settings', value), JSON.stringify(settings));
  await page.goto(process.env.BASE || 'http://localhost:4173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const box = await page.locator('.hero__avatar').boundingBox();
  const pad = 52;
  const clip = { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad };
  shots.push([label, (await page.screenshot({ clip })).toString('base64')]);
  await page.close();
}
const sheet = await browser.newPage({ viewport: { width: 1400, height: 320 } });
await sheet.setContent(
  `<body style="margin:0;background:#0b0d14;color:#ccd;font:14px system-ui;display:flex;gap:12px;padding:12px">${shots
    .map(
      ([label, png]) =>
        `<figure style="margin:0;text-align:center"><img src="data:image/png;base64,${png}"><figcaption>${label}</figcaption></figure>`,
    )
    .join('')}</body>`,
);
await sheet.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out);
