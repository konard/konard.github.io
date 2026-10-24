// Writes src/skins.frames.css from src/skins.frames.js (issue #15).
import { writeFileSync } from 'node:fs';
import { framesCss } from '../src/skins.frames.js';

const out = new URL('../src/skins.frames.css', import.meta.url);
writeFileSync(out, framesCss());
console.log(`Wrote ${out.pathname}`);
