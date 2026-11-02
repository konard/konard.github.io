/* global document, scrollY */
// Issue #49: "in settings we have big gap to the left, so we may need to
// rearrange blocks of settings". Prints the sections of /settings/ with their
// column, top and height, and the empty height at the bottom of each column.
//   node experiments/issue-49-settings-columns.mjs [width] [out.png]
// SETTINGS='<json>' stores settings first; BASE overrides the URL.
import { chromium } from 'playwright';

const [width = '1824', out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width), height: 1112 },
  deviceScaleFactor: Number(process.env.SCALE || 1),
  colorScheme: 'dark',
});
if (process.env.SETTINGS)
  await page.addInitScript((value) => localStorage.setItem('settings', value), process.env.SETTINGS);
await page.goto(`${process.env.BASE || 'http://localhost:3000'}/settings/`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const report = await page.evaluate(async () => {
  // The estimates of src/pages/settingsColumns.js, from the dev server.
  const { estimateHeight } = await import('/src/pages/settingsColumns.js');
  const { SECTIONS } = await import('/src/settings/schema.js');
  const estimate = (id) => {
    const section = SECTIONS.find((s) => s.id === id);
    return section ? estimateHeight(section) : null;
  };
  const groups = document.querySelector('.settings__groups');
  const top = groups.getBoundingClientRect().top + scrollY;
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      top: Math.round(r.top + scrollY - top),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };
  const columns = [...groups.children].map((col) => ({
    class: col.className,
    ...box(col),
    sections: [...col.querySelectorAll(':scope > section')].map((s) => ({
      id: s.id,
      ...box(s),
      estimate: estimate(s.id),
    })),
  }));
  return { groups: box(groups), columns };
});
for (const col of report.columns) {
  console.log(`${col.class} left ${col.left} top ${col.top} width ${col.width} height ${col.height}`);
  for (const s of col.sections)
    console.log(
      `   ${s.id.padEnd(14)} top ${String(s.top).padStart(6)} height ${String(s.height).padStart(5)} estimate ${s.estimate}`,
    );
}
const heights = report.columns.filter((c) => c.class === 'settings__column').map((c) => c.height);
console.log(
  `column heights ${heights.join(' / ')}; empty under the shorter one: ${Math.max(...heights) - Math.min(...heights)}px`,
);
if (out) await page.screenshot({ path: out, fullPage: true });
await browser.close();
