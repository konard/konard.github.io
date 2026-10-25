// Preserve gallery/rain geometry independently of editor changes.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true } });
const { codeAt, decode, networkCount } = await server.ssrLoadModule('/src/links/configurations.js');
const { glyphSvg } = await server.ssrLoadModule('/src/links/glyph.js');
const hashes = {};
for (const n of [1, 2, 3, 4]) {
  const hash = createHash('sha256');
  const count = n < 4 ? networkCount(n) : 512;
  for (let i = 0; i < count; i++) {
    const index = n < 4 ? i : Math.floor((i * (networkCount(n) - 1)) / (count - 1));
    hash.update(glyphSvg(decode(codeAt(n, index))));
  }
  hashes[n] = { count, sha256: hash.digest('hex') };
}
writeFileSync('docs/case-studies/issue-21/data/gallery-baseline.json', JSON.stringify(hashes, null, 2) + '\n');

await server.close();
