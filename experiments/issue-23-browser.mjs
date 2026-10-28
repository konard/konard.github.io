// Regression checks for #23, against the production build, one engine at a time.
/* global document, window, getComputedStyle, StorageEvent, requestAnimationFrame, innerHeight, Image */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { preview } from 'vite';
import { displayScreenshot } from './issue-23-display-capture.mjs';
const engine = process.env.ENGINE || 'chromium';
const output = process.env.CAPTURE_DIR || 'docs/case-studies/issue-23/screenshots';
const data = process.env.RESULT_DIR || 'docs/case-studies/issue-23/data';
// Default: 1,215 cards. CI and guarded stress runs test the reported 4,131.
const batches = Math.min(8, Math.max(2, Number(process.env.CARD_BATCHES) || 2));
await mkdir(output, { recursive: true });
await mkdir(data, { recursive: true });
const server = await preview({ preview: { port: 4179, strictPort: true } });
const display = Boolean(process.env.XWD_FILE) || process.env.DISPLAY_CAPTURE === '1';
const results = {
  engine,
  capture: display ? 'display' : 'api',
  date: new Date().toISOString(),
  checks: [],
  samples: [],
  errors: [],
};
const pass = (name) => {
  results.checks.push(name);
  console.log(`${engine}: ${name}`);
};
const shot = (page, name, element = page) => element.screenshot({ path: join(output, `${engine}-after-${name}.png`) });
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch({ headless: !display });
  results.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => results.errors.push(error.message));
  await page.goto('http://localhost:4179/network/?code=00000000');
  assert.equal(await page.locator('#style-bulge').inputValue(), '0');
  await shot(page, 'free', page.locator('.network__preview'));
  pass('neutral defaults for free links');
  await page.goto('http://localhost:4179/network/?code=11&startOffset=12&endOffset=12');
  await shot(page, 'markers', page.locator('.network__preview'));
  await page.goto('http://localhost:4179/network/?code=00&bulge=130&startOffset=12&endOffset=12&end=bar');
  const markerChecks = await page
    .locator('.network__preview g[stroke]')
    .first()
    .evaluate((group) => {
      const [path, start, end] = group.querySelectorAll('path');
      const length = path.getTotalLength();
      return [start, end].map((marker, i) => {
        const [x, y, u, v] = marker
          .getAttribute('d')
          .match(/-?\d+(?:\.\d+)?/g)
          .map(Number);
        const distance = i ? length - 12 : 12;
        const p = path.getPointAtLength(distance);
        const a = path.getPointAtLength(distance - 0.01);
        const b = path.getPointAtLength(distance + 0.01);
        return {
          distance: Math.hypot((x + u) / 2 - p.x, (y + v) / 2 - p.y),
          dot: Math.abs(
            ((u - x) * (b.x - a.x) + (v - y) * (b.y - a.y)) /
              Math.hypot(u - x, v - y) /
              Math.hypot(b.x - a.x, b.y - a.y),
          ),
        };
      });
    });
  for (const result of markerChecks) {
    assert(result.distance < 0.05, JSON.stringify(result));
    assert(result.dot < 0.015);
  }
  results.markerChecks = markerChecks;
  pass('both displaced bars agree with native SVG path position and tangent');
  await page.goto('http://localhost:4179/network/?code=221331&solveRange=0');
  const gap = page.getByLabel('Link 1: Gap at the source reference (value)', { exact: true });
  await gap.fill('0.25');
  await page.getByLabel('Link 2: Cut after the middle', { exact: true }).fill('4');
  const shared = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
  const drawing = await page.locator('.network__preview').innerHTML();
  await page.goto(shared);
  assert.equal(await page.locator('.network__preview').innerHTML(), drawing);
  assert.equal(await gap.inputValue(), '0.25');
  await shot(page, 'gaps');
  await page.goto('http://localhost:4179/network/?code=221331&solveRange=0');
  await page.locator('#style-solve').check();
  const preview = await page.locator('.network__preview').innerHTML();
  const score = await page.locator('.network__score').innerText();
  await page.getByRole('button', { name: 'Apply turns and gaps to links', exact: true }).click();
  assert.equal(await page.locator('.network__preview').innerHTML(), preview);
  const applied = await page.getByLabel('Link to this picture', { exact: true }).inputValue();
  assert(new URL(applied).searchParams.has('gaps'));
  await page.goto(applied);
  assert.equal(await page.locator('.network__preview').innerHTML(), preview);
  results.solver = { score, applied };
  pass('individual gaps and gap-only solver survive apply/share/reload');
  await page.goto('http://localhost:4179/art/#symbols');
  await page.getByRole('button', { name: /^4 links/ }).click();
  const sample = async () => {
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('.symbols__grid > li')];
      return (
        cards.length &&
        cards.every((node) => {
          const box = node.getBoundingClientRect();
          if (box.top < innerHeight && box.bottom > 0) return node.dataset.inViewport === 'true';
          if (box.top > innerHeight + 220 || box.bottom < -220) return node.dataset.inViewport !== 'true';
          return true;
        })
      );
    });
    const state = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.symbols__grid > li')];
      const filtered = cards.filter((n) => getComputedStyle(n).backdropFilter !== 'none').length;
      const bar = document.querySelector('.topbar');
      // Liquid's floating mode blurs its two capsules rather than the wrapper.
      const surface = getComputedStyle(bar).backdropFilter === 'none' ? bar.firstElementChild : bar;
      return {
        cards: cards.length,
        filtered,
        y: window.scrollY,
        barFilter: getComputedStyle(surface).backdropFilter,
        barSurface: surface.className,
        barTop: bar.getBoundingClientRect().top,
      };
    });
    results.samples.push(state);
    console.log(JSON.stringify(state));
    // 11 columns × roughly 16 rows fit inside the viewport plus prefetch band.
    assert(state.filtered > 0 && state.filtered < 250, JSON.stringify(state));
    assert.match(state.barFilter, /blur\(/);
    assert(Math.abs(state.barTop) < 1);
  };
  await page.locator('.symbols__grid li').first().hover();
  assert.equal(await page.locator('.symbols__grid li').first().locator('a').count(), 1);
  await shot(page, 'card', page.locator('.symbols__grid li').first());
  await sample();
  for (let k = 0; k < batches; k++) {
    await page.getByRole('button', { name: /^Show more/ }).click();
    await sample();
  }
  for (const skin of ['glass', 'liquid', 'futuristic']) {
    await page.evaluate((skin) => {
      localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'skin.name': skin }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'settings' }));
    }, skin);
    for (const fraction of [0.5, 1, 0.2, 1]) {
      await page.evaluate((f) => {
        const box = document.querySelector('.symbols__grid').getBoundingClientRect();
        window.scrollTo(0, window.scrollY + box.top + box.height * f - innerHeight * 0.7);
      }, fraction);
      // Wait for observer delivery and compositing after every discontinuous scroll.
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await sample();
    }
    await shot(page, `gallery-${skin}`);
    if (display) {
      await page.waitForTimeout(500);
      await displayScreenshot(join(output, `${engine}-after-gallery-${skin}-display.png`));
    }
    // Exercise the actual compositor, not just computed CSS: a sharp pattern
    // behind the header must render differently when its blur is disabled.
    await page.evaluate(() => {
      const pattern = document.createElement('div');
      pattern.id = 'blur-probe';
      pattern.style.cssText =
        'position:fixed;inset:0 0 auto;height:120px;z-index:9;pointer-events:none;background:repeating-linear-gradient(90deg,#000 0 4px,#fff 4px 8px)';
      document.body.append(pattern);
    });
    const bar = page.locator('.topbar');
    const capture = async (state) => {
      // Firefox snapshot APIs can omit backdrop effects. Read the actual
      // Xvfb/macOS display after allowing the compositor update to complete.
      await page.waitForTimeout(500);
      const path = join(output, `${engine}-header-${skin}-${state}.png`);
      return display ? displayScreenshot(path) : bar.screenshot({ path, animations: 'disabled' });
    };
    const blurred = await capture('blurred');
    await bar.evaluate((node) => {
      for (const surface of [node, ...node.children]) {
        surface.style.setProperty('backdrop-filter', 'none', 'important');
        surface.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      }
    });
    const sharp = await capture('sharp');
    const different = await page.evaluate(
      async ([a, b]) => {
        const pixels = async (source) => {
          const img = new Image();
          img.src = `data:image/png;base64,${source}`;
          await img.decode();
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, img.width, img.height).data;
        };
        const [x, y] = await Promise.all([pixels(a), pixels(b)]);
        let count = 0;
        for (let i = 0; i < x.length; i += 4)
          if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 30) count++;
        return count;
      },
      [blurred.toString('base64'), sharp.toString('base64')],
    );
    results.samples.at(-1).blurredPixels = different;
    assert(different > 5000, `${skin}: header blur must affect actual pixels (${different})`);
    await bar.evaluate((node) => [node, ...node.children].forEach((surface) => surface.removeAttribute('style')));
    await page.locator('#blur-probe').evaluate((node) => node.remove());
  }
  pass(
    `bounded blur surfaces and fixed header through ${results.samples.at(-1).cards} cards, repeated scrolling and all skins`,
  );
  // Release the large gallery before the separate mobile editor capture.
  await context.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const phone = await mobile.newPage();
  phone.setDefaultTimeout(15000);
  phone.on('pageerror', (error) => results.errors.push(error.message));
  await phone.goto('http://localhost:4179/network/?code=221331&gaps=0.25+~+~+~,~+~+~+4&lang=ru');
  await shot(phone, 'mobile-gaps', phone.locator('.link-cards'));
  assert(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  pass('individual gap controls fit the Russian mobile editor');
  assert.deepEqual(results.errors, []);
  await mobile.close();
} finally {
  await writeFile(join(data, `${engine}-after.json`), JSON.stringify(results, null, 2) + '\n');
  await browser?.close();
  await server.close();
}
