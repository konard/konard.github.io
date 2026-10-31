// Times a full restyle with changed copies of the generated frame sheets
// (src/skins.frames.css and src/skins.frames.corners.css, issue #45). Each
// variant is written to the files, the page is served by a fresh Vite server,
// and the original files are put back at the end. No CSSOM changes, so it runs
// in WebKit too (headless WebKit on Linux crashed on deleteRule here). Prints
// the median of the restyles after the first one: the first adds the probe
// variable, the others change it, as a slider does.
//   [ENGINE=webkit] [ROUNDS=6] [VARIANTS=current,noCorners,...] node experiments/issue-45-css-variants.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FRAMES = 'src/skins.frames.css';
const CORNERS = 'src/skins.frames.corners.css';
const original = { frames: readFileSync(FRAMES, 'utf8'), corners: readFileSync(CORNERS, 'utf8') };
// Whole rules: each ends with a closing brace at the start of a line.
const rules = (text) => text.split(/(?<=\n\}\n)/);
const keep = (text, test) =>
  rules(text)
    .filter((rule) => !test(rule))
    .join('');
const same = (changes) => ({ ...original, ...changes });
const VARIANTS = {
  current: () => original,
  // Without the numbers of the shapes and lines on the root.
  noCorners: () => same({ corners: '/* none */\n' }),
  // Without the rule of the root that turns the numbers into lengths.
  noRoot: () => same({ frames: keep(original.frames, (rule) => rule.includes('--fxp-tl-s:')) }),
  // Without the rules that let every framed element draw its outline and layers.
  noElements: () =>
    same({
      frames: keep(original.frames, (rule) => rule.includes('--fx-el-clip: polygon')),
    }),
  // Without the scale of every framed element.
  noScale: () => same({ frames: keep(original.frames, (rule) => rule.includes('--fx-scale:')) }),
  // Without the registered (typed or not inherited) properties.
  noRegistered: () => same({ frames: keep(original.frames, (rule) => rule.trimStart().startsWith('@property')) }),
  // Without the rules that draw the frame on controls.
  noControls: () => same({ frames: keep(original.frames, (rule) => rule.includes(':root:root')) }),
  // Without the corner layer overlay.
  noLayer: () =>
    same({
      frames: keep(original.frames, (rule) => rule.includes('::after') || rule.includes('position: relative')),
    }),
  noFrames: () => ({ frames: '/* none */\n', corners: '/* none */\n' }),
};
const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
try {
  for (const name of (process.env.VARIANTS || Object.keys(VARIANTS).join(',')).split(',')) {
    const variant = VARIANTS[name]();
    writeFileSync(FRAMES, variant.frames);
    writeFileSync(CORNERS, variant.corners);
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
    const times = [...out.matchAll(/restyle ([\d.]+) ms/g)].map((m) => Number(m[1]));
    console.log(JSON.stringify({ variant: name, medianMs: median(times.slice(1)), times }));
  }
} finally {
  writeFileSync(FRAMES, original.frames);
  writeFileSync(CORNERS, original.corners);
}
