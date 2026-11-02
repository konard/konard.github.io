/* global document, getComputedStyle */
// Issue #49: "We also need to add configuration of borders on hover, focus,
// outline and so on". Hovers a chip, a button and a panel, focuses a button
// with the keyboard and reads their borders and outlines with the settings of
// SETTINGS (JSON, merged over a skin), and screenshots the hovered chip.
//   node experiments/issue-49-states.mjs [out.png]
// SKIN picks the skin (default glass), PAGE the page (default /repositories/,
// with the language chips) and BASE the server (default the dev server).
import { chromium } from 'playwright';
import { PANELS } from '../src/skins.frames.js';

const skin = process.env.SKIN || 'glass';
const settings = {
  'skin.name': skin,
  'motion.mode': 'off',
  ...(skin === 'futuristic' && { 'future.frame': 'custom' }),
  ...JSON.parse(process.env.SETTINGS || '{}'),
};
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
  deviceScaleFactor: 2,
});
await page.addInitScript((s) => localStorage.setItem('settings', s), JSON.stringify(settings));
await page.goto(`${process.env.BASE || 'http://localhost:3000'}${process.env.PAGE || '/repositories/'}`, {
  waitUntil: 'load',
});
await page.waitForTimeout(1500);

const read = (selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const cs = getComputedStyle(el);
    return `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}; outline ${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}; --fx-ec ${cs.getPropertyValue('--fx-ec').trim() || '-'}`;
  }, selector);

const rows = {};
const panel = await page.evaluate((all) => all.find((sel) => document.querySelector(sel)), PANELS);
for (const selector of ['.chip:not(.is-active)', '.chip.is-active', panel]) {
  if (!selector) continue;
  if (!(await page.$(selector))) continue;
  rows[`${selector} at rest`] = await read(selector);
  await page.hover(selector);
  rows[`${selector} hovered`] = await read(selector);
}
await page.mouse.move(0, 0);
await page.keyboard.press('Tab');
rows['focused (Tab)'] = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return `${el.tagName.toLowerCase()}.${el.className}: outline ${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`;
});
console.log(JSON.stringify(settings));
console.table(rows);
if (process.argv[2]) {
  await page.keyboard.press('Shift+Tab');
  await page.hover('.chip:not(.is-active)');
  const box = await page.evaluate(() => {
    const r = document.querySelector('.chips').getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
  await page.screenshot({
    path: process.argv[2],
    clip: { x: box.x - 8, y: box.y - 8, width: Math.min(box.width, 900) + 16, height: box.height + 16 },
  });
}
await browser.close();
