// Browser check of issue #45 in Chromium, Firefox or WebKit (ENGINE):
// - every bordered element (outer panel, inner block, button, field) gets the custom frame,
//   inner blocks and controls in their smaller corner scale, also inside the settings panel;
// - corner.blocks = line and corner.controls = border bring the plain edges back;
// - the corner layer draws the frame over the colour bar of a position and moves nothing;
// - content that does not fit is clipped at the frame;
// - a palette colour of the colour chooser sets the colour.
//   [ENGINE=firefox] [CAPTURE_DIR=dir] node experiments/issue-45-browser.mjs
/* global document, getComputedStyle, innerHeight, scrollTo, scrollX, scrollY */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';

const engine = process.env.ENGINE || 'chromium';
const directory = process.env.CAPTURE_DIR || 'browser-results/screenshots/issue45';
const PORT = 4245;
const results = [];
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { port: PORT, strictPort: true } });
await server.listen();
const browsers = [];
try {
  const errors = [];
  const open = async (path, look = {}) => {
    // A browser for every page: local headless WebKit stalls on the third page of one browser.
    const browser = await { chromium, firefox, webkit }[engine].launch();
    browsers.push(browser);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(45000);
    page.on('pageerror', (error) => errors.push(`${path}: ${error.message}`));
    await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
    await page.route('https://platform.twitter.com/**', (route) => route.abort());
    await page.addInitScript(
      (settings) => {
        localStorage.setItem('lang', 'en');
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('settings', settings);
      },
      JSON.stringify({ 'motion.mode': 'off', 'sound.on': false, ...look }),
    );
    await page.goto(`http://localhost:${PORT}${path}`);
    await page.locator('main').waitFor();
    await page.waitForTimeout(500);
    return page;
  };
  const style = (page, selector, props, pseudo = null) =>
    page
      .locator(selector)
      .first()
      .evaluate(
        (node, [names, after]) => {
          const s = getComputedStyle(node, after);
          return Object.fromEntries(names.map((name) => [name, s.getPropertyValue(name).trim()]));
        },
        [props, pseudo],
      );
  // Headless WebKit on Linux runs no animation frames on the site (main too, see
  // experiments/issue-45-frame-rate.mjs), and the element screenshots and clicks of
  // Playwright wait for frames to see that an element is stable; these do not.
  const shoot = async (page, selector, name) => {
    const box = await page
      .locator(selector)
      .first()
      .evaluate((node) => {
        // At the top the sticky header stays out of the shot of the full page.
        scrollTo(0, 0);
        const r = node.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 4000) };
      });
    await page.screenshot({ path: `${directory}/${engine}-${name}.png`, clip: box, fullPage: true });
  };
  const press = (locator) => locator.click({ force: true });
  const check = (name, condition, details) => {
    results.push({ name, ok: Boolean(condition), details });
    assert.ok(condition, `${name}: ${JSON.stringify(details)}`);
  };

  // 1. The frame on every bordered element of the samples (default look: the custom frame).
  {
    const page = await open('/settings/');
    await page.locator('.ui-samples').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    const scale = async (selector) => Number((await style(page, selector, ['--fx-scale']))['--fx-scale'] || 'NaN');
    const outer = await scale('.ui-samples .card.ui-samples__panel');
    const inner = await scale('.ui-samples .card .repo');
    const control = await scale('.ui-samples .button');
    check('scales: outer 1, inner block 0.6, control 0.35', outer === 1 && inner === 0.6 && control === 0.35, {
      outer,
      inner,
      control,
    });
    for (const selector of [
      '.ui-samples .card.ui-samples__panel',
      '.ui-samples .card .repo',
      '.ui-samples .button',
      '.ui-samples input[type=text]',
    ]) {
      const clip = (await style(page, selector, ['clip-path']))['clip-path'];
      check(`${selector} is cut by the frame`, clip.startsWith('polygon('), clip);
    }
    // A panel cuts what does not fit; the overflow sample scrolls inside the frame that cuts it.
    const overflow = {
      panel: await style(page, '.ui-samples .ui-samples__panel', ['overflow-x', 'overflow-y']),
      scroller: await style(page, '.ui-samples .ui-samples__overflow', ['overflow-y', 'clip-path']),
    };
    check(
      'content that does not fit is cut at the frame',
      overflow.panel['overflow-x'] === 'clip' &&
        overflow.panel['overflow-y'] === 'clip' &&
        overflow.scroller['clip-path'].startsWith('polygon('),
      overflow,
    );
    await shoot(page, '.ui-samples', 'samples');

    // 2. A palette colour sets the colour, and the chooser stays in view.
    await press(page.locator('.ui-samples .ui-color__swatch'));
    const dialog = page.getByRole('dialog', { name: 'Color chooser' });
    await dialog.waitFor();
    const box = await dialog.boundingBox();
    const height = await page.evaluate(() => innerHeight);
    check('the colour chooser is in view', box.y >= 0 && box.y + box.height <= height, box);
    for (const name of ['Neon', 'Pastel', 'Matrix']) {
      check(`the ${name} palette is shown`, (await dialog.getByRole('group', { name }).count()) === 1, name);
    }
    await press(dialog.getByRole('button', { name: 'Neon pink #ff10f0' }));
    const value = await page.locator('.ui-samples .ui-color input').inputValue();
    check('a palette colour sets the value', value === '#ff10f0', value);
    await page.context().browser().close();
  }

  // 3. Plain lines for inner blocks and plain borders for controls; outer panels keep the frame.
  {
    const page = await open('/settings/', { 'corner.blocks': 'line', 'corner.controls': 'border' });
    await page.locator('.ui-samples').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    const outer = (await style(page, '.ui-samples .card.ui-samples__panel', ['clip-path']))['clip-path'];
    const inner = (await style(page, '.ui-samples .card .repo', ['clip-path']))['clip-path'];
    const button = await style(page, '.ui-samples .button', ['clip-path', 'background-image']);
    // The skin's own button keeps its chamfer, which is zero under the custom frame: a rectangle.
    const uncut = (clip) => clip === 'none' || !/calc|[1-9]\d*(\.\d+)?px/.test(clip);
    check(
      'line blocks and border controls, framed outer panels',
      outer.startsWith('polygon(') &&
        inner === 'none' &&
        uncut(button['clip-path']) &&
        button['background-image'] === 'none',
      { outer, inner, button },
    );
    await shoot(page, '.ui-samples', 'samples-plain');
    await page.context().browser().close();
  }

  // 4. The corner layer: on top the frame is an overlay above the colour bar; nothing moves.
  const boxes = {};
  for (const layer of ['top', 'below']) {
    const page = await open('/experience/', { 'corner.layer': layer });
    const after = await style(page, '.position', ['background-image', 'pointer-events'], '::after');
    if (layer === 'top') {
      check(
        'the frame is drawn over the content',
        after['background-image'] !== 'none' && after['pointer-events'] === 'none',
        after,
      );
    } else {
      check(
        'below, the overlay draws nothing',
        after['background-image'] === 'none' || !after['background-image'],
        after,
      );
    }
    boxes[layer] = await page.evaluate(() =>
      [...document.querySelectorAll('main *')]
        .filter((node) => getComputedStyle(node).position === 'absolute' && !node.getAnimations().length)
        .map((node) => {
          const r = node.getBoundingClientRect();
          return [
            node.tagName,
            node.className.baseVal ?? node.className,
            Math.round(r.x + scrollX),
            Math.round(r.y + scrollY),
            Math.round(r.width),
            Math.round(r.height),
          ].join(' ');
        }),
    );
    // After the measure: a full page screenshot lays the page out again in another size.
    if (layer === 'top') await shoot(page, '.position', 'position');
    await page.context().browser().close();
  }
  check('the corner layer moves no positioned element', JSON.stringify(boxes.top) === JSON.stringify(boxes.below), {
    count: boxes.top.length,
    moved: boxes.top.filter((box, index) => box !== boxes.below[index]).slice(0, 5),
  });

  check('no application exceptions', errors.length === 0, errors);
  await writeFile(`${directory}/${engine}-verification.json`, JSON.stringify({ engine, results }, null, 2) + '\n');
  console.log(`Issue 45: ${engine} frames, corner layer, overflow and palettes passed (${results.length} checks).`);
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
  await server.close();
}
