// How much each part of lino-objects-codec adds to the bundle (issue #47, C5):
// the writers alone or with the readers, minified and gzipped.
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const cases = {
  writers: 'export { encode, formatIndented, setDebugEnabled } from "lino-objects-codec";',
  'writers + readers':
    'export { decode, encode, formatIndented, parseIndented, setDebugEnabled } from "lino-objects-codec";',
  'links-notation parser': 'export { Parser } from "links-notation";',
};
const dir = mkdtempSync(join(import.meta.dirname, '.lino-size-'));
for (const [name, code] of Object.entries(cases)) {
  const entry = join(dir, 'entry.js');
  writeFileSync(entry, code);
  const out = join(dir, 'out');
  await build({
    configFile: false,
    logLevel: 'silent',
    root: process.cwd(),
    build: { outDir: out, emptyOutDir: true, lib: { entry, formats: ['es'], fileName: 'x' }, minify: true },
  });
  const file = readdirSync(out).find((f) => f.endsWith('.js'));
  const bytes = readFileSync(join(out, file));
  console.log(`${name}: ${(bytes.length / 1024).toFixed(1)} kB, gzip ${(gzipSync(bytes).length / 1024).toFixed(1)} kB`);
}
rmSync(dir, { recursive: true });
