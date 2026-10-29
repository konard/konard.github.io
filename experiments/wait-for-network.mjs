/** The initial editable drawing remains visible during the worker search. */
export const waitForNetwork = async (page) => {
  await page.locator('.network__preview[aria-busy="false"] svg').waitFor();
  const error = page.locator('.network__view [role="alert"]');
  if (await error.count()) throw new Error(await error.textContent());
};
