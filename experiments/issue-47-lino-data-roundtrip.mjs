// Can the site data of src/data/*.json be kept as Links Notation (issue #47)?
// Round trip, size and time of lino-objects-codec on each file, nested form.
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { decode, encode, setDebugEnabled } from 'lino-objects-codec';

setDebugEnabled(false);
for (const name of process.argv.slice(2)) {
  const json = readFileSync(name, 'utf8');
  const value = JSON.parse(json);
  let t = performance.now();
  const lino = encode({ obj: value });
  const encodeMs = performance.now() - t;
  t = performance.now();
  const back = decode({ notation: lino });
  const decodeMs = performance.now() - t;
  console.log(
    `${name}: JSON ${(json.length / 1024).toFixed(0)} kB, lino ${(lino.length / 1024).toFixed(0)} kB, ` +
      `encode ${encodeMs.toFixed(0)} ms, decode ${decodeMs.toFixed(0)} ms, equal ${isDeepStrictEqual(back, value)}`,
  );
}
