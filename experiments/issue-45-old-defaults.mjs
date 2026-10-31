// Prints the current default of every key the issue #45 look changes.
import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../src/settings/schema.js';
const look = JSON.parse(
  readFileSync(new URL('../docs/case-studies/issue-45/data/matrix-universe.json', import.meta.url)),
);
for (const [k, v] of Object.entries(look))
  console.log(JSON.stringify(k), JSON.stringify(DEFAULTS[k]), '->', JSON.stringify(v));
