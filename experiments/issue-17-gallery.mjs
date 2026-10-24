// Check that configurable shapes preserve the existing gallery and rain glyphs.
// Uses the default branch as the baseline; every 1–3-link network plus a bounded
// sample of four-link networks is compared, without enumerating the full gallery.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { glyphSvg } from '../src/links/glyph.js';

const baselineSource = execFileSync('git', ['show', 'origin/main:src/links/glyph.js'], { encoding: 'utf8' });
const baseline = await import(`data:text/javascript;base64,${Buffer.from(baselineSource).toString('base64')}`);
let checked = 0;
for (let n = 1; n <= 4; n++) {
  const count = (n + 1) ** (2 * n);
  const samples = n === 4 ? 512 : count;
  for (let i = 0; i < samples; i++) {
    const index = n === 4 ? Math.floor((i * (count - 1)) / (samples - 1)) : i;
    const code = index.toString(n + 1).padStart(2 * n, '0');
    const links = code.match(/../g).map((pair) => [...pair].map(Number));
    assert.equal(glyphSvg(links), baseline.glyphSvg(links), `default glyph changed: ${code}`);
    checked++;
  }
}
console.log(`Preserved ${checked} default gallery/rain glyphs byte for byte.`);
