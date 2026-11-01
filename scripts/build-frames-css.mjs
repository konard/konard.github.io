// Writes src/skins.frames.css, src/skins.frames.corners.css,
// src/skins.frames.properties.css (issues #15 and #45) and the stylesheet of
// every level, src/skins.frames.level-<level>.css (issue #47), from
// src/skins.frames.js and src/skins.frames.levels.js, and the corners by the size of
// the element, src/skins.frames.fit.css (issue #47), from src/skins.frames.fit.js.
import { writeFileSync } from 'node:fs';
import { cornersCss, framesCss, propertiesCss } from '../src/skins.frames.js';
import { LEVEL_FILES, levelCss } from '../src/skins.frames.levels.js';
import { fitCss } from '../src/skins.frames.fit.js';

for (const [name, css] of [
  ['skins.frames.css', framesCss()],
  ['skins.frames.corners.css', cornersCss()],
  ['skins.frames.properties.css', propertiesCss()],
  ...LEVEL_FILES.map(([file, level]) => [file, levelCss(level)]),
  ['skins.frames.fit.css', fitCss()],
]) {
  const out = new URL(`../src/${name}`, import.meta.url);
  writeFileSync(out, css);
  console.log(`Wrote ${out.pathname}`);
}
