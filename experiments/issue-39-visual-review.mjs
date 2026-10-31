/* global document, getComputedStyle, Image */
// Deterministic render regressions for PR #40's theme and frame feedback.
// --before records the broken state and reports every defect before failing.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';
import { DEFAULTS, PREVIOUS_DEFAULTS } from '../src/settings/schema.js';

const engine = process.env.ENGINE || 'chromium';
const before = process.argv.includes('--before');
const directory = process.env.CAPTURE_DIR || 'browser-results/visual-review';
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { port: 4197, strictPort: true } });
await server.listen();
let browser;
const results = [];
const failures = [];
// Written for the defaults of issue #39, before issue #45 made the Matrix universe the default: the check starts
// from that look, the "Glass universe" preset, saved as its difference from the defaults.
const GLASS_UNIVERSE = Object.fromEntries(
  Object.entries(PREVIOUS_DEFAULTS).filter(([key, value]) => value !== DEFAULTS[key]),
);
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  await page.addInitScript((look) => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ ...look, 'motion.mode': 'off', 'sound.on': false }));
  }, GLASS_UNIVERSE);
  await page.route('https://platform.twitter.com/widgets.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.twttr={widgets:{createTweet:async(id,host,options)=>{
        const frame=document.createElement('iframe'); frame.title='X post fixture';
        frame.style.cssText='display:block;width:100%;height:230px;border:0';
        // Like the live provider: light document scheme, transparent canvas,
        // rounded dark/light content. A mismatched embedding scheme paints white.
        frame.srcdoc='<html style="color-scheme:light"><body style="margin:0;background:transparent"><article style="box-sizing:border-box;height:230px;border-radius:14px;padding:24px;background:'+(options.theme==='dark'?'#15202b':'#fff')+';color:'+(options.theme==='dark'?'#e7e9ea':'#15202b')+';font:16px system-ui"><b>Social post fixture</b><p>Provider-owned '+options.theme+' theme</p><p>Transparent canvas at rounded edges</p></article></body></html>';
        host.append(frame);return frame;}}};`,
    }),
  );
  await page.goto('http://localhost:4197/blog/?lang=en&network=x');
  const post = page.locator('.post').first();
  await post.locator('[data-loaded="true"]').waitFor();
  for (const theme of ['dark', 'light']) {
    await page.evaluate(async (theme) => (await import('/src/i18n/prefs.js')).setTheme(theme), theme);
    await post.locator('[data-loaded="true"]').waitFor();
    const frame = post.locator('iframe');
    await frame.contentFrame().getByText('Transparent canvas at rounded edges').waitFor();
    await post.scrollIntoViewIfNeeded();
    const postBounds = await post.boundingBox();
    const frameBounds = await frame.boundingBox();
    const buffer = await post.screenshot({ path: `${directory}/${before ? 'before' : 'after'}-embed-${theme}.png` });
    const pixel = await page.evaluate(
      async ({ data, x, y }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return [...context.getImageData(x, y, 1, 1).data];
      },
      {
        data: buffer.toString('base64'),
        x: Math.round(frameBounds.x - postBounds.x),
        y: Math.round(frameBounds.y - postBounds.y),
      },
    );
    const scheme = await frame.evaluate((node) => getComputedStyle(node).colorScheme);
    check(scheme === 'normal', `${theme}: iframe must preserve the provider's transparent canvas`);
    if (theme === 'dark') check(Math.max(...pixel.slice(0, 3)) < 80, 'Dark iframe corner must not paint white');
    results.push({ theme, scheme, cornerPixel: pixel });
  }
  await page.goto('http://localhost:4197/settings/?lang=en#interface');
  await page.evaluate(async () => (await import('/src/settings/store.js')).setSettings({ 'skin.name': 'futuristic' }));
  const preview = page.locator('.ui-preview__panel');
  await preview.scrollIntoViewIfNeeded();
  const geometry = await preview.evaluate((node) => {
    const style = getComputedStyle(node);
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;width:var(--future-corner);height:var(--ui-accent-size)';
    node.append(probe);
    const measure = getComputedStyle(probe);
    const result = {
      corner: parseFloat(measure.width),
      accentThickness: parseFloat(measure.height),
      backgroundOrigin: style.backgroundOrigin,
      positions: style.backgroundPosition,
      sizes: style.backgroundSize,
      border: style.borderTopWidth,
      edge: style.borderTopColor,
    };
    probe.remove();
    return result;
  });
  // The preview omits the optional hover layer, so its first layer is the accent.
  const accentX = Number(geometry.positions.match(/(?:left )?([\d.]+)px/)[1]);
  const frameThickness = Number(geometry.sizes.match(/(?:^|, )([\d.]+)px ([\d.]+)px/)[2]);
  check(accentX === geometry.corner, 'Default accent must join the corner stroke without a gap');
  check(geometry.accentThickness === frameThickness, 'Default accent and corner stroke must have equal thickness');
  check(
    geometry.backgroundOrigin.split(',').every((value) => value.trim() === 'border-box'),
    'Frame layers must share the border coordinates',
  );
  results.push({ geometry, accentX, frameThickness });
  await preview.screenshot({ path: `${directory}/${before ? 'before' : 'after'}-frame.png` });
  // Full-page context for defaults, with no experimental styles or settings.
  await page.locator('#interface').evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${directory}/${before ? 'before' : 'after'}-defaults.png` });
  if (!before) {
    const patch = (values) =>
      page.evaluate(async (values) => (await import('/src/settings/store.js')).setSettings(values), values);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(async (theme) => (await import('/src/i18n/prefs.js')).setTheme(theme), theme);
      const edges = await page.locator('#interface, .ui-preview__panel').evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return { edge: style.borderTopColor, width: style.borderTopWidth, origin: style.backgroundOrigin };
        }),
      );
      check(edges.length === 2 && edges[0].edge === edges[1].edge, `${theme}: nested panels must share edge colors`);
      check(
        edges.every((edge) => edge.width === '1px'),
        `${theme}: panels must share the default border width`,
      );
      check(
        edges.every((edge) => !edge.origin.includes('padding-box')),
        `${theme}: all frames use border coordinates`,
      );
      results.push({ theme, edges });
      await page.screenshot({ path: `${directory}/after-defaults-${theme}.png` });
    }
    await patch({ 'future.corner': 32, 'future.cut': 20, 'future.accentOffset': 7, 'ui.accentSize': 5 });
    for (const [frame, start] of [
      ['corners', 32],
      ['bracket', 32],
      ['chamfer', 20],
      ['octagon', 20],
      ['kranox', 40],
      ['lines', 0],
      ['underline', 0],
      ['plain', 0],
      ['custom', 46],
    ]) {
      await patch({ 'future.frame': frame });
      const style = await preview.evaluate((node) => {
        const style = getComputedStyle(node);
        return { positions: style.backgroundPosition, sizes: style.backgroundSize, width: style.borderTopWidth };
      });
      const x = Number(style.positions.match(/(?:left )?([\d.]+)px/)[1]);
      check(x === start + 7, `${frame}: configured geometry and manual accent offset must remain effective`);
      check(style.sizes.startsWith('min(80%, 112px) 5px'), `${frame}: manual accent thickness must remain effective`);
      if (frame === 'custom') {
        const widths = await page
          .locator('#interface, .ui-preview__panel, .preset')
          .evaluateAll((nodes) =>
            nodes.map((node) => ({ name: node.className, width: getComputedStyle(node).borderTopWidth })),
          );
        results.push({ customWidths: widths });
        check(
          widths.every(({ width }) => width === '0px'),
          'Custom frames must not regain an extra CSS border',
        );
      }
      results.push({ frame, x, ...style });
    }
  }
  await writeFile(
    `${directory}/${engine}-${before ? 'before' : 'after'}.json`,
    JSON.stringify({ engine, results, failures }, null, 2) + '\n',
  );
  assert.deepEqual(failures, []);
  console.log(`${engine}: transparent iframe corners and continuous default frame passed.`);
} finally {
  await browser?.close();
  await server.close();
}
