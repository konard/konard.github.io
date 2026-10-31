/* global document, window */

// Pass this function's source to Playwright MCP's run-code tool with its page.
export default async function review(page) {
  const root = 'docs/case-studies/issue-41';
  const equal = (a, b) => {
    if (a !== b) throw new Error(`Expected ${b}; got ${a}`);
  };
  const reported = [
    { code: '0222', turns: '0 0' },
    { code: '0112', turns: '0 0' },
    { code: '0001', turns: '0 0' },
    { code: '2002', turns: '0 0' },
  ];
  const result = { date: new Date().toISOString(), engine: 'Playwright MCP Chromium', examples: [], errors: [] };
  page.on('pageerror', (error) => result.errors.push(error.message));
  page.setDefaultTimeout(15000);
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
  for (const { code, turns } of reported) {
    await go(`code=${code}`);
    const original = await picture();
    await go(`code=${code}&turns=${encodeURIComponent(turns)}`);
    equal(await picture(), original);
    result.examples.push({ code, manualEquality: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('code=0222&gaps=0.1+0.2+3+4');
  const original = await picture();
  const target = page.locator('#link-1-turn-1');
  await target.focus();
  await target.press('ArrowRight');
  equal(await target.inputValue(), '1');
  await page.getByRole('button', { name: 'Back to the default: Link 1: turn of the target, °', exact: true }).click();
  equal(await target.inputValue(), '0');
  equal(await picture(), original);
  const shared = new URL(await page.getByLabel('Link to this picture', { exact: true }).inputValue());
  equal(shared.searchParams.get('gaps'), '0.1 0.2 3 4');
  await page.screenshot({ path: `${root}/screenshots/mcp-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await go('code=0112');
  equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
  await page.screenshot({ path: `${root}/screenshots/mcp-mobile.png` });
  equal(result.errors.length, 0);
  result.interactions = 'native keyboard, neutral zero reset, unchanged gaps, desktop and mobile';
  return result;
}
