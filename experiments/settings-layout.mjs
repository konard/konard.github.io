// Measures the layout of /settings/ (issue #15): where every section starts,
// whether the two columns start at the same height, and which sections move
// to another column when the skin changes (the "Skin block glitches" of the
// issue). Also checks the page never scrolls sideways.
//
//   [ENGINE=chromium|webkit|firefox] node experiments/settings-layout.mjs [width] [out-prefix]
//
// Needs `npm run build` and `npx vite preview --port 4173` (BASE overrides the URL).
/* global document, window */
import { chromium, webkit, firefox } from 'playwright';

const [width = '1440', prefix = ''] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:4173';
const engines = { chromium, webkit, firefox };
const browser = await engines[process.env.ENGINE || 'chromium'].launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } });

const measure = () =>
  page.evaluate(() => {
    const groups = [...document.querySelectorAll('.settings__group')].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.id, x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width) };
    });
    const columns = {};
    groups.forEach((g) => (columns[g.x] = columns[g.x] || []).push(g.id));
    const tops = Object.keys(columns).map((x) => Math.min(...groups.filter((g) => g.x === Number(x)).map((g) => g.y)));
    return {
      groups,
      columns,
      tops,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

await page.goto(`${base}/settings/`);
await page.waitForTimeout(1500);
const result = {};
for (const skin of ['glass', 'liquid', 'futuristic']) {
  await page.selectOption('#setting-skin-name', skin);
  await page.waitForTimeout(400);
  result[skin] = await measure();
  if (prefix) await page.screenshot({ path: `${prefix}-${skin}.png`, fullPage: false });
}
const where = (skin, id) => Object.entries(result[skin].columns).find(([, ids]) => ids.includes(id))?.[0];
const moved = result.glass.groups
  .map((g) => g.id)
  .filter((id) => where('liquid', id) && where('glass', id) !== where('liquid', id));
for (const [skin, r] of Object.entries(result)) {
  console.log(`${skin}: columns ${JSON.stringify(r.columns)}`);
  console.log(
    `  column tops ${r.tops.join(', ')} (difference ${Math.max(...r.tops) - Math.min(...r.tops)} px), sideways overflow ${r.overflow} px`,
  );
}
console.log(`sections that change their column between glass and liquid: ${moved.join(', ') || 'none'}`);
await browser.close();
