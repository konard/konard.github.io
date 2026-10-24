// Measures the experimental overlap solver of issue #17 on some networks.
import { solveCollisions } from '../src/links/collisions.js';
import { decode, representatives } from '../src/links/configurations.js';

const codes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['12 21', '22 13 31', '23 31 12', '12 23 34 41', '11 22 33 44 55 66 77 88 99', '23 34 45 56 67 78 89 91 12'];
for (const code of codes) {
  const t = performance.now();
  const r = solveCollisions(decode(code));
  console.log(
    code,
    'before',
    r.before.toFixed(2),
    'after',
    r.after.toFixed(2),
    'ms',
    (performance.now() - t).toFixed(0),
    JSON.stringify(r.delta),
  );
}
let better = 0,
  same = 0,
  worse = 0,
  total = 0;
const t = performance.now();
for (const code of representatives(3)) {
  const r = solveCollisions(decode(code));
  total++;
  if (r.after < r.before - 1e-9) better++;
  else if (r.after > r.before + 1e-9) worse++;
  else same++;
}
console.log(
  'n=3 classes',
  total,
  'better',
  better,
  'same',
  same,
  'worse',
  worse,
  'ms',
  (performance.now() - t).toFixed(0),
);
