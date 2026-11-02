// Issue #51: proves the chunk budget fails a real build instead of only warning.
// Builds the site twice into a temporary directory: with the real 500 kB limit it
// must pass; with a 200 kB budget (below the 287 kB layout chunk) it must fail.
// Usage: node experiments/issue-51/chunk-budget.mjs
import { build } from 'vite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chunkBudget } from '../../vite.config.js';

const outDir = mkdtempSync(path.join(tmpdir(), 'issue51-chunks-'));
const run = (plugins) => build({ logLevel: 'error', plugins, build: { outDir, emptyOutDir: true } });
try {
  await run([]);
  console.log('500 kB budget: build passed');
  const failed = await run([chunkBudget(200)]).then(
    () => null,
    (error) => error,
  );
  const reason = failed?.message.match(/Chunks larger than .*/)?.[0];
  if (!reason) throw new Error(`A 200 kB budget did not fail the build: ${failed?.message}`);
  console.log(`200 kB budget: build failed as expected: ${reason}`);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
