// Issue #47: lists emoji and symbol glyphs left in the interface sources.
//   node experiments/issue-47-glyph-scan.mjs [dir]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GLYPH = /[\p{Extended_Pictographic}←-⇿⌀-⏿■-◿☀-➿⤀-⥿⬀-⯿]/gu;
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
for (const file of walk(process.argv[2] || 'src').filter((f) => /\.(jsx?|css)$/.test(f) && !/\.test\./.test(f))) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const found = line.match(GLYPH);
      if (found && !/^\s*(\/\/|\*|\/\*)/.test(line))
        console.log(`${file}:${i + 1}: ${[...new Set(found)].join(' ')}  ${line.trim().slice(0, 90)}`);
    });
}
