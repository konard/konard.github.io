/* global document, getComputedStyle, innerWidth */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'vite';
import { SECTIONS } from '../src/settings/schema.js';
import { chooseSelect } from './support/select.mjs';

const before = process.argv.includes('--before');
const engine = process.env.ENGINE || 'chromium';
const directory = process.env.CAPTURE_DIR || 'docs/case-studies/issue-39/screenshots';
const results = [];
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { port: 4199, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await { chromium, firefox, webkit }[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
    if (process.env.TRACE_BROWSER === '1') console.error('Application exception:', error.message);
  });
  if (process.env.TRACE_BROWSER === '1') {
    page.on('console', (message) => console.log(`${engine} ${message.type()}: ${message.text()}`));
    page.on('requestfailed', (request) => console.log('Request failed:', request.url(), request.failure()));
  }
  await page.addInitScript(() => {
    if (sessionStorage.getItem('issue39-initialized')) return;
    sessionStorage.setItem('issue39-initialized', '1');
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off', 'sound.on': false }));
  });
  await page.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
  await page.route('https://platform.twitter.com/**', (route) => route.abort());
  const go = async (path) => {
    await page.goto(`http://localhost:4199${path}`);
    await page.locator('main').waitFor();
  };
  const patch = (values) =>
    page.evaluate(async (values) => {
      const { setSettings } = await import('/src/settings/store.js');
      setSettings(values);
    }, values);
  const styles = (selector) =>
    page
      .locator(selector)
      .first()
      .evaluate((node) => {
        const s = getComputedStyle(node);
        return Object.fromEntries(
          [
            'backgroundColor',
            'backgroundImage',
            'backdropFilter',
            'boxShadow',
            'borderRadius',
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomRightRadius',
            'borderBottomLeftRadius',
            'borderTopWidth',
            'borderTopStyle',
            'color',
            'paddingTop',
            'fontSize',
          ].map((key) => [key, s[key]]),
        );
      });
  const screenshot = (name) => page.screenshot({ path: `${directory}/${name}.png` });
  const fits = async () =>
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  for (const [name, path, selector] of [
    ['blog', '/blog/?lang=en&network=x', '#feed'],
    ['source-lines', '/?lang=en#activity', '.source-lines'],
    ['settings', '/settings/?lang=en#skin', '#skin'],
  ]) {
    await go(path);
    await page.locator(selector).scrollIntoViewIfNeeded();
    if (name === 'blog' && !before) await page.locator('.post__body').first().waitFor({ state: 'visible' });
    await screenshot(`${before ? 'before' : 'after'}-${name}`);
    if (!before) await fits();
  }
  if (!before) {
    assert.equal(await page.locator('.snapshot-notice').count(), 0);
    assert.equal(await page.locator('select').count(), 0, 'Every menu must use the owned combobox');
    const skin = page.getByRole('combobox', { name: 'Skin', exact: true });
    await skin.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Escape');
    assert.equal(await skin.getAttribute('data-value'), 'glass');
    await skin.press('f');
    await skin.press('Enter');
    assert.equal(await skin.getAttribute('data-value'), 'futuristic');
    assert.equal((await styles('#setting-skin-name')).borderRadius, '0px');
    assert.equal((await styles('#skin')).borderRadius, '0px');
    const rounded = await page.locator('.app *').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const s = getComputedStyle(node);
          return (
            !node.closest('[aria-hidden="true"]') &&
            node.getBoundingClientRect().width > 0 &&
            [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].some(
              (value) => value !== '0px',
            )
          );
        })
        .slice(0, 12)
        .map((node) => node.className),
    );
    assert.deepEqual(rounded, [], 'Angular defaults must have no inherited rounded UI');
    await page.locator('#interface').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await screenshot('after-futuristic');
    await patch({
      'ui.panelTl': 6,
      'ui.panelTr': 12,
      'ui.panelBr': 18,
      'ui.panelBl': 24,
      'ui.controlTl': 3,
      'ui.controlTr': 6,
      'ui.controlBr': 9,
      'ui.controlBl': 12,
      'ui.customAccent': true,
      'ui.accent': '#ff5500',
      'ui.controlBorder': 3,
      'ui.borderStyle': 'dashed',
      'ui.tablePadding': 14,
      'ui.tableBorder': 3,
      'ui.tableGrid': true,
    });
    assert.equal((await styles('.ui-preview__panel')).borderRadius, '6px 12px 18px 24px');
    assert.equal((await styles('.ui-preview .ui-select')).borderRadius, '3px 6px 9px 12px');
    assert.equal((await styles('.ui-preview .ui-select')).borderTopWidth, '3px');
    assert.equal((await styles('.ui-preview .ui-select')).borderTopStyle, 'dashed');
    assert.equal((await styles('.ui-preview td')).paddingTop, '14px');
    assert.equal((await styles('.ui-preview td')).borderTopStyle, 'none');
    await page.getByRole('combobox', { name: 'Preview menu' }).click();
    assert.equal(await page.getByRole('option', { name: 'Disabled option' }).getAttribute('aria-disabled'), 'true');
    await screenshot('after-corner-preview');
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('listbox').count(), 0);
    await page.reload();
    assert.equal((await styles('.ui-preview__panel')).borderRadius, '6px 12px 18px 24px');
    const colorTrigger = page.getByRole('button', { name: 'Choose color: Primary accent', exact: true });
    await colorTrigger.click();
    const chooser = page.getByRole('dialog', { name: 'Color chooser' });
    const blue = chooser.getByRole('slider', { name: 'Blue', exact: true });
    await blue.press('Home');
    await blue.press('ArrowUp');
    assert.equal(await page.locator('#setting-ui-accent').inputValue(), '#ff5501');
    await screenshot('after-color-chooser');
    await blue.press('Escape');
    assert.equal(await chooser.count(), 0);
    assert.equal(await colorTrigger.evaluate((node) => node === document.activeElement), true);
    await patch({
      'ui.panelTl': -1,
      'ui.panelTr': -1,
      'ui.panelBr': -1,
      'ui.panelBl': -1,
      'ui.controlTl': -1,
      'ui.controlTr': -1,
      'ui.controlBr': -1,
      'ui.controlBl': -1,
      'ui.customAccent': false,
      'ui.controlBorder': 1,
      'ui.borderStyle': 'solid',
      'future.frame': 'plain',
      'future.hover': 'none',
    });
    const surfaces = SECTIONS.find((section) => section.id === 'futuristic')
      .fields.find((field) => field.key === 'future.surface')
      .options.map((option) => option.value);
    assert.ok(!surfaces.includes('transparent'));
    let emptySurface;
    for (const surface of surfaces) {
      const images = [];
      for (const opacity of [0, 0.5, 1]) {
        await patch({ 'future.surface': surface, 'future.opacity': opacity });
        const style = await styles('#skin');
        images.push(style.backgroundImage);
        if (opacity === 0) {
          assert.equal(style.backgroundColor, 'rgba(0, 0, 0, 0)', surface);
          // All textures disappear; independently configurable frame accents remain.
          emptySurface ??= style.backgroundImage;
          assert.equal(style.backgroundImage, emptySurface, `${surface}: zero opacity must use the same empty surface`);
          assert.equal(
            style.backgroundImage,
            await page.evaluate(() => {
              const probe = document.createElement('div');
              probe.style.backgroundImage = 'var(--fx-bar-img), var(--fx-frame-img)';
              document.body.append(probe);
              const image = getComputedStyle(probe).backgroundImage;
              probe.remove();
              return image;
            }),
            `${surface}: only the frame may remain`,
          );
          assert.equal(style.backdropFilter, 'none', surface);
          assert.equal(style.boxShadow, 'none', surface);
        }
        results.push({ surface, opacity, ...style });
      }
      assert.notEqual(images[1], images[2], `${surface} must actually respond to opacity`);
    }
    for (const [skinName, opacity] of [
      ['glass', 'glass.level'],
      ['liquid', 'liquid.opacity'],
    ]) {
      await patch({ 'skin.name': skinName, [opacity]: 0, 'liquid.refraction': true });
      const style = await styles('#skin');
      assert.equal(style.backgroundImage, 'none');
      assert.equal(style.backgroundColor, 'rgba(0, 0, 0, 0)');
      assert.equal(style.backdropFilter, 'none');
      assert.equal(await page.locator('#liquid-refraction').count(), 0);
    }
    for (const material of ['Frosted', 'Glossy', 'Liquid']) {
      await page.getByRole('button', { name: material, exact: true }).last().click();
      await page.locator('#liquid').evaluate((node) => node.scrollIntoView({ block: 'start' }));
      assert.equal(await skin.getAttribute('data-value'), 'liquid');
      await screenshot(`after-material-${material.toLowerCase()}`);
      results.push({ material, ...(await styles('#liquid')) });
      await page.evaluate(async () => (await import('/src/i18n/prefs.js')).setTheme('light'));
      await screenshot(`after-material-${material.toLowerCase()}-light`);
      results.push({ material, theme: 'light', ...(await styles('#liquid')) });
      await page.evaluate(async () => (await import('/src/i18n/prefs.js')).setTheme('dark'));
    }
    await patch({ 'ui.transparency': 'reduce' });
    const opaque = await styles('#skin');
    assert.equal(opaque.backdropFilter, 'none');
    assert.equal(opaque.backgroundImage, 'none');
    assert.notEqual(opaque.backgroundColor, 'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator('#liquid-refraction').count(), 0);
    await patch({ 'ui.transparency': 'auto', 'skin.name': 'glass', 'glass.level': 0.4 });
    await chooseSelect(skin, 'futuristic');
    await patch({ 'future.frame': 'corners', 'future.surface': 'gradient', 'future.opacity': 0.82 });
    // Providers are deterministic fixtures here; the separate live probe records external availability.
    await page.unroute('https://platform.twitter.com/**');
    await page.route('https://platform.twitter.com/widgets.js', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.twttr={widgets:{createTweet:async(id,host,options)=>{
        const frame=document.createElement('iframe'); frame.title='X post'; frame.height='230';
        frame.style.cssText='display:block;width:100%;height:230px;border:0';
        frame.srcdoc='<html style="color-scheme:light"><body style="margin:0;background:transparent"><article style="box-sizing:border-box;height:230px;border-radius:14px;padding:20px;background:'+(options.theme==='dark'?'#15202b':'#fff')+';color:'+(options.theme==='dark'?'#e7e9ea':'#15202b')+';font:16px system-ui"><b>Konstantin Diachenko · @konard</b><p>Responsive social post fixture</p><p>Content-sized embed · '+options.theme+'</p></article></body></html>';
        host.append(frame);return frame;}}};`,
      }),
    );
    await go('/blog/?lang=en&network=x');
    const first = page.locator('.post').first();
    await first.scrollIntoViewIfNeeded();
    await first.locator('[data-loaded="true"]').waitFor();
    const box = await first.locator('iframe').boundingBox();
    assert.ok(box.height < 300 && box.width <= 550);
    await screenshot('after-blog-widget');
    await first.getByRole('button', { name: 'Show archived copy', exact: true }).click();
    assert.ok(await first.locator('.post__body').innerText());
    await first.getByRole('button', { name: 'Show embed', exact: true }).click();
    await first.locator('iframe').waitFor();
    await go('/network/?code=1111');
    const gapName = 'Link 1: Gap at the target reference (value)';
    const gap = page.getByLabel(gapName, { exact: true });
    await page.getByRole('button', { name: `Increase: ${gapName}`, exact: true }).click();
    assert.equal(await gap.inputValue(), '0.09');
    await page.getByRole('button', { name: `Decrease: ${gapName}`, exact: true }).click();
    assert.equal(await gap.inputValue(), '0.08');
    await gap.fill('');
    await page.getByRole('button', { name: `Decrease: ${gapName}`, exact: true }).click();
    assert.equal(await gap.inputValue(), '0.07');
    await gap.scrollIntoViewIfNeeded();
    await screenshot('after-number-controls');
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: engine !== 'firefox',
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    await mobile.addInitScript(() => {
      localStorage.setItem('lang', 'en');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem(
        'settings',
        JSON.stringify({ 'motion.mode': 'off', 'sound.on': false, 'skin.name': 'futuristic' }),
      );
    });
    await mobile.route('https://github-contributions-api.jogruber.de/**', (route) => route.abort());
    await mobile.route('https://platform.twitter.com/**', (route) => route.abort());
    for (const path of ['/settings/', '/blog/?network=x', '/network/?code=0120', '/?lang=en#activity']) {
      await mobile.goto(`http://localhost:4199${path}`);
      const target = path.startsWith('/settings')
        ? '#interface'
        : path.startsWith('/blog')
          ? '.post'
          : path.startsWith('/network')
            ? '.network__panel'
            : '.source-lines';
      await mobile
        .locator(target)
        .first()
        .evaluate((node) => node.scrollIntoView({ block: 'start' }));
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path);
      await mobile.screenshot({ path: `${directory}/after-mobile-${path.split('/')[1]?.split('?')[0] || 'home'}.png` });
      if (path.startsWith('/network')) {
        const increase = mobile.getByRole('button', { name: `Increase: ${gapName}`, exact: true });
        await increase.click();
        assert.equal(await mobile.getByLabel(gapName, { exact: true }).inputValue(), '0.09');
        const bounds = await increase.boundingBox();
        if (engine !== 'firefox') assert.ok(bounds.width >= 44 && bounds.height >= 44);
        await mobile.screenshot({ path: `${directory}/after-mobile-number-controls.png` });
        assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      if (path.startsWith('/settings')) {
        const menu = mobile.getByRole('combobox', { name: 'Preview menu' });
        await menu.click();
        const bounds = await mobile.getByRole('listbox').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391);
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 845);
        assert.ok(parseFloat(await menu.evaluate((node) => getComputedStyle(node).fontSize)) >= 16);
        await mobile.keyboard.press('Escape');
        assert.ok(
          await mobile.locator('#setting-ui-accent').evaluate((input) => {
            const style = getComputedStyle(input);
            const context = document.createElement('canvas').getContext('2d');
            context.font = style.font;
            const required =
              context.measureText(input.value).width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            return input.clientWidth >= required;
          }),
          'The complete color value fits the mobile field',
        );
        await mobile.getByRole('button', { name: 'Choose color: Primary accent', exact: true }).click();
        const chooser = mobile.getByRole('dialog', { name: 'Color chooser' });
        const colorBounds = await chooser.boundingBox();
        assert.ok(colorBounds.x >= 0 && colorBounds.x + colorBounds.width <= 391);
        assert.ok(colorBounds.y >= 0 && colorBounds.y + colorBounds.height <= 845);
        await mobile.screenshot({ path: `${directory}/after-mobile-color-chooser.png` });
        await mobile.keyboard.press('Escape');
      }
    }
    await mobile.close();
    assert.deepEqual(errors, [], 'No application exceptions');
    await writeFile(
      `${directory}/${engine}-verification.json`,
      JSON.stringify({ engine, results, errors }, null, 2) + '\n',
    );
  }
  console.log(
    before
      ? 'Baseline screenshots captured.'
      : `Issue 39: ${engine} controls, corners, opacity, glass, embeds and mobile layouts passed.`,
  );
} finally {
  await browser?.close();
  await server.close();
}
