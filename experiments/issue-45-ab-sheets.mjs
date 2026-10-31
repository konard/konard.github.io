// A/B timing of two sets of the generated frame sheets (issue #45). Each
// directory holds skins.frames.css, skins.frames.corners.css and
// skins.frames.properties.css; the sets are copied into src/ in turns (A, B, A,
// B, …) so a busy machine slows both alike, and the original files are put back
// at the end. Prints the median restyle of /settings/ of every set.
//   [ENGINE=webkit] [PAIRS=4] [ROUNDS=6] node experiments/issue-45-ab-sheets.mjs <dirA> <dirB>
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NAMES = ['skins.frames.css', 'skins.frames.corners.css', 'skins.frames.properties.css'];
const sets = process.argv.slice(2);
if (sets.length < 2) throw new Error('usage: node experiments/issue-45-ab-sheets.mjs <dirA> <dirB>');
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);
const original = Object.fromEntries(NAMES.map((name) => [name, read(join('src', name))]));
const put = (files) => {
  for (const name of NAMES) {
    if (files[name] === null) rmSync(join('src', name), { force: true });
    else writeFileSync(join('src', name), files[name]);
  }
};
const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
const times = Object.fromEntries(sets.map((dir) => [dir, []]));
try {
  for (let pair = 0; pair < Number(process.env.PAIRS || 4); pair += 1) {
    for (const dir of sets) {
      // A set without a properties sheet still needs the import to resolve.
      put(Object.fromEntries(NAMES.map((name) => [name, read(join(dir, name)) ?? '/* none */\n'])));
      let out = '';
      try {
        out = execFileSync('node', ['experiments/issue-45-restyle-once.mjs'], {
          env: { ...process.env, ROUNDS: process.env.ROUNDS || '6' },
          encoding: 'utf8',
          timeout: 240000,
        });
      } catch (error) {
        // Local headless WebKit sometimes closes the page: keep the restyles it timed.
        out = String(error.stdout || '');
      }
      // The first restyle adds the probe variable; the others change it, as a slider does.
      const run = [...out.matchAll(/restyle ([\d.]+) ms/g)].map((m) => Number(m[1])).slice(1);
      times[dir].push(...run);
      console.log(JSON.stringify({ set: dir, pair, run }));
    }
  }
} finally {
  put(original);
}
for (const dir of sets) console.log(JSON.stringify({ set: dir, medianMs: median(times[dir]), n: times[dir].length }));
