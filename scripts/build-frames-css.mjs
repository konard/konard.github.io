// Writes src/skins.frames.css, src/skins.frames.corners.css and
// src/skins.frames.properties.css from
// src/skins.frames.js (issues #15 and #45).
import { writeFileSync } from 'node:fs';
import { cornersCss, framesCss, propertiesCss } from '../src/skins.frames.js';

for (const [name, css] of [
  ['skins.frames.css', framesCss()],
  ['skins.frames.corners.css', cornersCss()],
  ['skins.frames.properties.css', propertiesCss()],
]) {
  const out = new URL(`../src/${name}`, import.meta.url);
  writeFileSync(out, css);
  console.log(`Wrote ${out.pathname}`);
}
