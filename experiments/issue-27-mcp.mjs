// Function consumed by Playwright MCP browser_run_code_unsafe.
// eslint-disable-next-line no-unused-vars -- Evaluated as a callback by Playwright MCP.
async function verify(page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    'http://localhost:4187/network/?code=1111&lang=en&rotation=-90&turns=0+0%2C-15+15&gaps=0.08+0.08+%7E+%7E%2C0.18+0.18+%7E+%7E',
  );
  const gap = page.getByLabel('Link 1: Gap at the target reference', { exact: true });
  await gap.fill('0.07');
  await gap.hover();
  const box = await gap.boundingBox();
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2 - 3);
  if ((await gap.inputValue()) !== '0.08') throw new Error('Native spinner Up should move 0.07 to 0.08');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2 + 3);
  if ((await gap.inputValue()) !== '0.07') throw new Error('Native spinner Down should restore 0.07');
  await gap.press('ArrowUp');
  if ((await gap.inputValue()) !== '0.08') throw new Error('Keyboard Up should restore 0.08');
  await gap.fill('');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2 + 3);
  if ((await gap.inputValue()) !== '0.07') throw new Error('Inherited native Down should start at 0.08');
  await gap.fill('');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2 - 3);
  if ((await gap.inputValue()) !== '0.09') throw new Error('Inherited native Up should start at 0.08');
  await gap.press('ArrowDown');
  const result = {
    date: new Date().toISOString(),
    checks: [
      'actual native spinner Up: 0.07→0.08',
      'actual native spinner Down: 0.08→0.07',
      'keyboard Up restores equal 0.08 gaps',
      'native spinner Down/Up from inheritance: 0.08→0.07 / 0.09',
    ],
    url: await page.getByLabel('Link to this picture', { exact: true }).inputValue(),
  };
  await page.locator('.network__preview').scrollIntoViewIfNeeded();
  return result;
}
