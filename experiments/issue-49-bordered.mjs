/* global document, getComputedStyle */
// Issue #49: "Any bordered UI element should be configurable". Lists the
// elements of every page that have a visible border or outline of their own
// and whether the settings change that border: every page is loaded with the
// skin as it is and again with every border setting changed (PROBE below), and
// an element whose border looks the same both times is not configurable.
//   node experiments/issue-49-bordered.mjs [out.json]
// SKIN picks the skin (default: glass, where the frame does not hide the
// borders); BASE overrides the URL (default: the dev server at
// http://localhost:3000).
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { EXCLUDED } from '../src/ui.borders.js';

const PAGES = [
  '/',
  '/cv/',
  '/experience/',
  '/repositories/',
  '/research/',
  '/blog/',
  '/art/',
  '/network/',
  '/associative/',
  '/settings/',
];
const skin = process.env.SKIN || 'glass';
const BASE_SETTINGS = {
  'skin.name': skin,
  'motion.mode': 'off',
  ...(skin === 'futuristic' && { 'future.frame': 'custom' }),
};
/** Every setting of borders and lines, far from its default. */
const PROBE = {
  ...BASE_SETTINGS,
  'ui.controlBorder': 5,
  'ui.panelBorder': 5,
  'ui.borderStyle': 'dotted',
  'ui.borderOpacity': 0.9,
  'ui.tableBorder': 3.5,
  'ui.lines': 'own',
  'ui.lineWidth': 5,
  'ui.lineStyle': 'dotted',
  'ui.lineColor': 'accent2',
  'ui.lineOpacity': 0.9,
  'ui.chosenWidth': 5,
  'avatar.photoBorder': 5,
  'future.border': 5,
  'future.frame': 'custom',
  'corner.edgeStyle': 'dashed',
  'corner.leftWidth': 5,
  'corner.topWidth': 5,
  'corner.rightWidth': 5,
  'corner.bottomWidth': 5,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });

/** The bordered elements of `path` with `settings`: a name and the look of their border, by kind. */
async function survey(path, settings) {
  await page.addInitScript((s) => localStorage.setItem('settings', s), JSON.stringify(settings));
  await page.goto(`${process.env.BASE || 'http://localhost:3000'}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const visible = (width, style, color) =>
      parseFloat(width) > 0 && style !== 'none' && style !== 'hidden' && !/rgba\(.*, 0\)$|transparent/.test(color);
    const out = {};
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.cosmos, svg')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((side) =>
        visible(cs[`border${side}Width`], cs[`border${side}Style`], cs[`border${side}Color`]),
      );
      const outline = visible(cs.outlineWidth, cs.outlineStyle, cs.outlineColor);
      if (!sides.length && !outline) continue;
      const name =
        el.tagName.toLowerCase() +
        [...el.classList]
          .filter((c) => !c.startsWith('is-'))
          .map((c) => `.${c}`)
          .join('');
      const look = [
        ...sides.map((s) => `${cs[`border${s}Width`]} ${cs[`border${s}Style`]} ${cs[`border${s}Color`]}`),
        ...(outline ? [`outline ${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`] : []),
      ].join(' | ');
      out[`${name} [${sides.join(' ')}${outline ? ' outline' : ''}]`] ??= {
        look,
        parent: el.parentElement?.className || el.parentElement?.tagName,
      };
    }
    return out;
  });
}

const found = {};
for (const path of PAGES) {
  const before = await survey(path, BASE_SETTINGS);
  const after = await survey(path, PROBE);
  for (const [key, row] of Object.entries(before)) {
    found[key] ??= { key, parent: row.parent, pages: [], configurable: true };
    found[key].pages.push(path);
    // Gone or changed with the probe: the settings reach it.
    if (after[key]?.look === row.look) found[key].configurable = false;
  }
}
await browser.close();
const list = Object.values(found);
const fixed = list.filter((row) => !row.configurable);
// Kept on purpose (EXCLUDED in src/ui.borders.js): the mini panels of the presets show another look.
const excluded = (row) => EXCLUDED.some((selector) => row.key.includes(selector));
console.log(
  `${list.length} kinds of bordered elements with the ${skin} skin, ${fixed.length} that no setting changes:`,
);
fixed.forEach((row) =>
  console.log(
    `  ${row.key}  in ${row.parent}  on ${row.pages.join(' ')}${excluded(row) ? '  (excluded on purpose)' : ''}`,
  ),
);
if (process.argv[2]) writeFileSync(process.argv[2], `${JSON.stringify(list, null, 2)}\n`);
process.exitCode = fixed.some((row) => !excluded(row)) ? 1 : 0;
