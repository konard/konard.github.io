import { afterEach, expect, it, vi } from 'vitest';
import { copyImage } from './export';

afterEach(() => vi.unstubAllGlobals());
it('starts a PNG clipboard write synchronously with a promised image (Safari activation)', async () => {
  let resolve;
  const pending = new Promise((done) => {
    resolve = done;
  });
  const write = vi.fn(() => Promise.resolve());
  vi.stubGlobal(
    'ClipboardItem',
    class {
      constructor(data) {
        this.data = data;
      }
    },
  );
  vi.stubGlobal('navigator', { clipboard: { write } });
  const copied = copyImage(pending);
  expect(write).toHaveBeenCalledTimes(1);
  const data = write.mock.calls[0][0][0].data;
  expect(data['image/png']).toBe(pending);
  resolve(new Blob(['png'], { type: 'image/png' }));
  await copied;
});
