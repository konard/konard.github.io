// Issue #51: Vite only warned about a 507 kB chunk, so main shipped it unnoticed.
import { chunkBudget, CHUNK_LIMIT_KB } from '../vite.config.js';

const chunk = (fileName, kB) => ({ type: 'chunk', fileName, code: 'x'.repeat(kB * 1000) });

test('a chunk above the limit fails the build with its name and size', () => {
  const error = vi.fn();
  chunkBudget().writeBundle.call(
    { error },
    {},
    { a: chunk('assets/Layout.js', 507), b: chunk('assets/react.js', 218) },
  );
  expect(error).toHaveBeenCalledTimes(1);
  expect(error.mock.calls[0][0]).toContain('assets/Layout.js (507.00 kB)');
  expect(error.mock.calls[0][0]).not.toContain('react.js');
});

test('chunks at the limit and assets of any size pass', () => {
  const error = vi.fn();
  const asset = { type: 'asset', fileName: 'cv.pdf', source: 'x'.repeat(2e6) };
  chunkBudget().writeBundle.call({ error }, {}, { a: chunk('assets/a.js', CHUNK_LIMIT_KB), asset });
  expect(error).not.toHaveBeenCalled();
});
