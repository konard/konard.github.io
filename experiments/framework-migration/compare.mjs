// Compare production captures from renderings.mjs, preserving metrics and one
// representative diff. Animated/external sources are controlled at capture.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const engine = process.env.ENGINE || 'chromium';
const root = '/tmp/issue54-renderings';
const directory = 'docs/case-studies/issue-54/data';
const before = JSON.parse(await readFile(`${root}/baseline/${engine}.json`, 'utf8'));
const after = JSON.parse(await readFile(`${root}/after/${engine}.json`, 'utf8'));
assert.equal(before.length, 48);
assert.equal(after.length, 48);
await mkdir(directory, { recursive: true });
const results = [];
for (const sample of after) {
  const previous = before.find((entry) => entry.id === sample.id);
  assert.ok(previous, sample.id);
  assert.deepEqual(sample.errors, [], sample.id);
  assert.deepEqual(sample.headings, previous.headings, sample.id);
  assert.equal(sample.title, previous.title, sample.id);
  assert.equal(sample.overflow, false, sample.id);
  const first = PNG.sync.read(await readFile(`${root}/baseline/${sample.id}.png`));
  const second = PNG.sync.read(await readFile(`${root}/after/${sample.id}.png`));
  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  const diff = new PNG({ width: first.width, height: first.height });
  const pixels = pixelmatch(first.data, second.data, diff.data, first.width, first.height, { threshold: 0.1 });
  results.push({
    id: sample.id,
    changedPixels: pixels,
    percent: (100 * pixels) / (first.width * first.height),
    controlsBefore: previous.controls,
    controlsAfter: sample.controls,
  });
  if (sample.id === `${engine}-default-dark-desktop-settings`)
    await writeFile(`docs/case-studies/issue-54/screenshots/${engine}-settings-diff.png`, PNG.sync.write(diff));
}
await writeFile(
  `${directory}/${engine}-comparison.json`,
  JSON.stringify({ threshold: 0.1, includeAntiAlias: false, samples: results }, null, 2) + '\n',
);
for (const phase of ['baseline', 'after'])
  await writeFile(`${directory}/${engine}-${phase}.json`, await readFile(`${root}/${phase}/${engine}.json`));
console.log(
  JSON.stringify({
    engine,
    samples: results.length,
    maximumPercent: Math.max(...results.map((sample) => sample.percent)),
    meanPercent: results.reduce((sum, sample) => sum + sample.percent, 0) / results.length,
  }),
);
