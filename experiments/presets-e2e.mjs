// The presets in a real browser (issue #15), against `npx vite preview --port 4173`:
//  1. other pages do not download the preset code;
//  2. a preset changes the look of the page and is marked; the motion stays;
//  3. a saved look survives a reload;
//  4. a #settings= link applies its look on another page and leaves the address clean;
//  5. no horizontal overflow at 360, 768 and 1280 px.
// Saves screenshots of the presets section.
//   node experiments/presets-e2e.mjs <screenshot dir>
/* global window, document */
import { chromium } from 'playwright';

const dir = process.argv[2] || '/tmp';
const base = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch();
const failures = [];
const check = (ok, message) => {
  console.log(ok ? 'ok  ' : 'FAIL', message);
  if (!ok) failures.push(message);
};

async function open(path, { width = 1280, theme = 'dark', settings, context } = {}) {
  const ctx = context || (await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme }));
  const page = await ctx.newPage();
  const scripts = [];
  page.on('request', (request) => request.resourceType() === 'script' && scripts.push(request.url()));
  page.on('pageerror', (error) => failures.push(error.message));
  if (!context) {
    await page.addInitScript(
      ([settings, theme]) => {
        if (!sessionStorage.getItem('seeded')) {
          if (settings) localStorage.setItem('settings', settings);
          localStorage.setItem('theme', theme);
          sessionStorage.setItem('seeded', '1');
        }
      },
      [settings && JSON.stringify(settings), theme],
    );
  }
  await page.goto(`${base}${path}`);
  await page.waitForTimeout(1000);
  return { page, scripts, ctx };
}

const hideBars = (page) => page.addStyleTag({ content: '.topbar, .subnav { visibility: hidden !important; }' });

{
  const { scripts, ctx } = await open('/');
  check(!scripts.some((url) => url.includes('presets')), 'the home page does not download the preset code');
  await ctx.close();
}

{
  const { page, ctx } = await open('/settings/', { settings: { 'motion.mode': 'off' } });
  const section = page.locator('#presets');
  await hideBars(page);
  await page.waitForTimeout(300);
  await section.screenshot({ path: `${dir}/presets-dark.png` });
  await section.getByRole('button', { name: /^Matrix/ }).click();
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => ({
    skin: document.documentElement.dataset.skinName,
    palette: document.documentElement.dataset.futurePalette,
    motion: JSON.parse(localStorage.getItem('settings'))['motion.mode'],
  }));
  check(
    state.skin === 'futuristic' && state.palette === 'matrix',
    `Matrix changes the skin (${JSON.stringify(state)})`,
  );
  check(state.motion === 'off', 'a preset keeps the motion setting');
  check(
    (await section.getByRole('button', { name: /^Matrix/ }).getAttribute('aria-pressed')) === 'true',
    'the chosen preset is marked',
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await section.screenshot({ path: `${dir}/presets-matrix.png` });

  await section.getByRole('textbox', { name: 'Name of the look' }).fill('My matrix');
  await section.getByRole('button', { name: 'Save the current look' }).click();
  await page.reload();
  await page.waitForTimeout(1000);
  check(
    (await page.locator('#presets').getByRole('list', { name: 'Saved looks' }).getByText('My matrix').count()) === 1,
    'a saved look survives a reload',
  );
  await hideBars(page);
  await page.waitForTimeout(300);
  await page.locator('#presets').screenshot({ path: `${dir}/presets-saved.png` });
  await ctx.close();
}

{
  const look = encodeURIComponent(JSON.stringify({ 'skin.name': 'liquid', 'grid.on': false }));
  const { page, ctx } = await open(`/#settings=${look}`);
  const state = await page.evaluate(() => ({
    skin: document.documentElement.dataset.skinName,
    grid: document.documentElement.dataset.gridOn,
    hash: window.location.hash,
  }));
  check(state.skin === 'liquid' && state.grid === 'false', `a link applies its look (${JSON.stringify(state)})`);
  check(state.hash === '', 'the link is removed from the address');
  await ctx.close();
}

for (const [width, theme] of [
  [1280, 'light'],
  [768, 'dark'],
  [360, 'dark'],
]) {
  const { page, ctx } = await open('/settings/', { width, theme });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, `no horizontal overflow at ${width} px (${overflow})`);
  await hideBars(page);
  await page.waitForTimeout(300);
  if (width !== 768)
    await page.locator('#presets').screenshot({ path: `${dir}/presets-${width === 360 ? '360-' : ''}${theme}.png` });
  await ctx.close();
}

await browser.close();
if (failures.length) {
  console.error(failures);
  process.exit(1);
}
