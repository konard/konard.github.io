// Compare production captures from renderings.mjs. Keep per-sample metrics and
// significant before/after pairs. Animated/external sources are controlled at capture.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const engine = process.env.ENGINE || 'chromium';
const root = process.env.CAPTURES || '/tmp/issue54-renderings/release';
const directory = 'docs/case-studies/issue-54/data';
const screenshots = 'docs/case-studies/issue-54/screenshots';
const before = JSON.parse(await readFile(`${root}/baseline/${engine}.json`, 'utf8'));
const after = JSON.parse(await readFile(`${root}/after/${engine}.json`, 'utf8'));
assert.equal(before.length, 120);
assert.equal(after.length, 120);
await mkdir(directory, { recursive: true });
const results = [];
for (const sample of after) {
  const previous = before.find((entry) => entry.id === sample.id);
  assert.ok(previous, sample.id);
  assert.deepEqual(sample.errors, [], sample.id);
  assert.deepEqual(sample.headings, previous.headings, sample.id);
  assert.equal(sample.title, previous.title, sample.id);
  assert.ok(!sample.overflow || previous.overflow, `${sample.id}: new horizontal overflow`);
  const first = PNG.sync.read(await readFile(`${root}/baseline/${sample.id}.png`));
  const second = PNG.sync.read(await readFile(`${root}/after/${sample.id}.png`));
  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  const pixels = pixelmatch(first.data, second.data, null, first.width, first.height, { threshold: 0.1 });
  const total = first.width * first.height;
  const expected = new Uint32Array(first.data.buffer, first.data.byteOffset, total);
  const actual = new Uint32Array(second.data.buffer, second.data.byteOffset, total);
  let exact = 0;
  for (let i = 0; i < total; i++) if (expected[i] === actual[i]) exact++;
  results.push({
    id: sample.id,
    changedPixels: pixels,
    percent: (100 * pixels) / total,
    exact,
    total,
    exactPercent: (100 * exact) / total,
    controlsBefore: previous.controls,
    controlsAfter: sample.controls,
  });
  if (
    engine === 'chromium' &&
    (sample.id === 'chromium-default-dark-desktop-settings' || sample.id === 'chromium-default-dark-mobile-network')
  ) {
    const name = sample.id.split('-').slice(-2).join('-');
    await writeFile(`${screenshots}/release-before-${name}.png`, await readFile(`${root}/baseline/${sample.id}.png`));
    await writeFile(`${screenshots}/release-after-${name}.png`, await readFile(`${root}/after/${sample.id}.png`));
  }
}
const exactMatches = results.filter((sample) => sample.exact === sample.total).length;
const exactPercent =
  (100 * results.reduce((sum, sample) => sum + sample.exact, 0)) /
  results.reduce((sum, sample) => sum + sample.total, 0);
const leastExact = results.reduce((least, sample) => (sample.exactPercent < least.exactPercent ? sample : least));
if (leastExact.exactPercent < 99.5) {
  await writeFile(
    `${screenshots}/release-before-${engine}-largest-change.png`,
    await readFile(`${root}/baseline/${leastExact.id}.png`),
  );
  await writeFile(
    `${screenshots}/release-after-${engine}-largest-change.png`,
    await readFile(`${root}/after/${leastExact.id}.png`),
  );
}
const summary = { engine, samples: results.length, exactMatches, exactPercent, leastExact };
await writeFile(
  `${directory}/release-${engine}-comparison.json`,
  JSON.stringify({ threshold: 0.1, includeAntiAlias: false, summary, samples: results }, null, 2) + '\n',
);
console.log(JSON.stringify(summary));
assert.ok(exactPercent >= 90, `${engine}: fewer than 90% of pixels match exactly`);
assert.ok(leastExact.exactPercent >= 90, `${leastExact.id}: fewer than 90% of pixels match exactly`);
