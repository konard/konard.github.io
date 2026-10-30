/* global document, window */

// Pass the function source, without `export default`, to Playwright MCP run-code.
export default async function review(page) {
  const root = 'docs/case-studies/issue-43';
  const equal = (actual, expected) => {
    if (actual !== expected) throw new Error(`Expected ${expected}; got ${actual}`);
  };
  const result = { date: new Date().toISOString(), engine: 'Playwright MCP Chromium', examples: [], errors: [] };
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => result.errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('lang', 'en');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('settings', JSON.stringify({ 'motion.mode': 'off' }));
  });
  const go = async (query) => {
    await page.goto(`http://127.0.0.1:4155/network/?lang=en&${query}`);
    await page.locator('.network__preview svg').waitFor();
  };
  const picture = () => page.locator('.network__preview').innerHTML();
  for (const code of ['0211', '2011', '2210', '2221', '0222', '0112', '0001', '2002']) {
    await go(`code=${code}`);
    const original = await picture();
    const zero = await page
      .locator('.link-cards input[type=range]')
      .evaluateAll((inputs) => inputs.filter(({ id }) => id.includes('-turn-')).every(({ value }) => value === '0'));
    equal(zero, true);
    await go(`code=${code}&turns=0+0`);
    equal(await picture(), original);
    result.examples.push({ code, zeroDefaults: true, explicitZeroEquality: true });
  }
  for (const [code, next] of [
    ['11', '0000'],
    ['2222', '000000'],
  ]) {
    await go(`code=${code}`);
    await page.getByRole('button', { name: /Next network/ }).click();
    equal(new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('code'), next);
    await page.getByRole('button', { name: /Previous network/ }).click();
    equal(new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('code'), code);
  }
  await go('code=0000');
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  await page.getByRole('button', { name: 'Random real network', exact: true }).click();
  equal(new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('code'), '1111');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('code=0211&gaps=0.1+0.2+3+4');
  const original = await picture();
  const target = page.locator('#link-1-turn-1');
  await target.focus();
  await target.press('ArrowRight');
  equal(await target.inputValue(), '1');
  await page.getByRole('button', { name: 'Back to the default: Link 1: turn of the target, °', exact: true }).click();
  equal(await target.inputValue(), '0');
  equal(await picture(), original);
  equal(new URL(await page.getByLabel('Link to this picture').inputValue()).searchParams.get('gaps'), '0.1 0.2 3 4');
  await page.getByRole('button', { name: 'Random real network', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${root}/screenshots/mcp-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await go('code=0211');
  equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
  await page.screenshot({ path: `${root}/screenshots/mcp-mobile.png` });
  equal(result.errors.length, 0);
  result.interactions = 'neutral geometry, size boundaries, random real, keyboard/reset, unchanged gaps, mobile';
  return result;
}
