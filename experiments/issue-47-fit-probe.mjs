// Issue #47: counts the elements src/frameFit.js marks as outside the limits of their level.
//   SETTINGS='{"corner.buttonFitMinHeight":40}' node experiments/issue-47-fit-probe.mjs [path]
// Needs `npm run build` and `npx vite preview --port 4173`.
/* global document, getComputedStyle */
import { chromium } from 'playwright';

const [path = '/'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript((value) => {
  localStorage.setItem('settings', value);
  localStorage.setItem('debugFrameFit', '1');
}, process.env.SETTINGS || '{}');
let logged = 0;
page.on('console', (m) => m.text().startsWith('[frame-fit]') && logged++);
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${process.env.BASE || 'http://localhost:4173'}${path}`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const marks = await page.evaluate(() =>
  [...document.querySelectorAll('[data-fx-fit]')].map((e) => {
    const r = e.getBoundingClientRect();
    return `${e.getAttribute('data-fx-fit')} ${e.tagName.toLowerCase()}.${[...e.classList].join('.')} ${Math.round(r.width)}×${Math.round(r.height)} clip=${[...new Set(getComputedStyle(e).clipPath.match(/[\d.]+(px|%)( [\d.]+(px|%))?/g) ?? [])].join(', ').slice(0, 160)}`;
  }),
);
console.log(`${marks.length} marked, ${logged} debug lines`);
marks.slice(0, 15).forEach((m) => console.log(' ', m));
await browser.close();
