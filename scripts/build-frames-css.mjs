// Writes src/skins.frames.css and src/skins.frames.corners.css from
// src/skins.frames.js (issues #15 and #45).
import { writeFileSync } from 'node:fs';
import { cornersCss, framesCss } from '../src/skins.frames.js';

for (const [name, css] of [
  ['skins.frames.css', framesCss()],
  ['skins.frames.corners.css', cornersCss()],
]) {
  const out = new URL(`../src/${name}`, import.meta.url);
  writeFileSync(out, css);
  console.log(`Wrote ${out.pathname}`);
}
