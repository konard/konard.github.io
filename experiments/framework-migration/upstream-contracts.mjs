// Bounded integration probe for the draft upstream APIs. Missing contracts
// remain visible; STRICT=1 makes this an intentionally failing deletion gate.
import assert from 'node:assert/strict';
import { nextValue } from '@link-foundation/ui-components/controls';

const actual = nextValue('ArrowUp', { value: 0.075, min: 0, max: 1, step: 0.01 });
const expected = 0.08; // Existing NumberInput.test.jsx: next tick in the direction of travel.
console.log(
  JSON.stringify({
    contract: 'directional stepping from continuous values',
    actual,
    expected,
    supported: actual === expected,
  }),
);
if (process.env.STRICT === '1') assert.equal(actual, expected);
