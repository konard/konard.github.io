// Times a full restyle with changed copies of src/skins.frames.css (issue #45).
// Each variant is written to the file, the page is served by a fresh Vite
// server, and the original file is put back at the end. No CSSOM changes, so it
// runs in WebKit too (headless WebKit on Linux crashed on deleteRule here).
//   [ENGINE=webkit] [VARIANTS=current,rootOnly,noControls,noLayer,noFrames] node experiments/issue-45-css-variants.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/skins.frames.css';
const original = readFileSync(FILE, 'utf8');
// Whole rules: each ends with a closing brace at the start of a line.
const rules = original.split(/(?<=\n\}\n)/);
const keep = (test) => rules.filter((rule) => !test(rule)).join('');
const stripFramed = (text) => text.replace(/,\n:root[^,{]*:where\(\.card[^{]*\{/g, ' {');
const VARIANTS = {
  current: () => original,
  // Only the root part of the rules on every framed element.
  rootOnly: () => stripFramed(original),
  // Without the rules that draw the frame on controls.
  noControls: () => keep((rule) => rule.includes(':root:root')),
  // Without the corner layer overlay.
  noLayer: () => keep((rule) => rule.includes('::after') || rule.includes('position: relative')),
  rootOnlyNoControlsNoLayer: () =>
    stripFramed(
      keep((rule) => rule.includes(':root:root') || rule.includes('::after') || rule.includes('position: relative')),
    ),
  noFrames: () => '/* none */\n',
};
try {
  for (const name of (process.env.VARIANTS || Object.keys(VARIANTS).join(',')).split(',')) {
    writeFileSync(FILE, VARIANTS[name]());
    const out = execFileSync('node', ['experiments/issue-45-restyle-once.mjs'], {
      env: { ...process.env, ROUNDS: process.env.ROUNDS || '5' },
      encoding: 'utf8',
      timeout: 240000,
    });
    const times = [...out.matchAll(/restyle ([\d.]+) ms/g)].map((m) => Number(m[1]));
    console.log(JSON.stringify({ variant: name, minMs: Math.min(...times), times }));
  }
} finally {
  writeFileSync(FILE, original);
}
