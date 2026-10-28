// Finite adversarial inputs; the parent caps V8 memory, stack and elapsed time.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseMath } from '../src/links/edit.js';

const require = createRequire(import.meta.url);
const { sanitize } = require('./archive-posts.cjs');
const kind = process.argv[2];
if (kind === 'math') {
  assert(parseMath('(0, 0)' + ' (0, 0)'.repeat(40) + '!').error);
} else if (kind === 'html') {
  assert.equal(typeof sanitize('<A !=' + '"" !='.repeat(40) + '!'), 'string');
} else {
  throw new Error(`Unknown probe: ${kind}`);
}
console.log(`${kind}: rejected the adversarial input without hanging`);
