// Safari can decode WebP without a canvas WebP encoder. Verify the application's
// existing explicit PNG alternative instead of expecting an impossible download.
/* global document */
export async function verifyWebpFallback(page) {
  const supported = await page.evaluate(
    () =>
      new Promise((resolve) =>
        document.createElement('canvas').toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp'),
      ),
  );
  if (supported) return false;
  await page.getByRole('button', { name: 'WebP', exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector('.network-share__status')
      ?.textContent.includes('image/webp is not supported; use PNG instead'),
  );
  return true;
}
