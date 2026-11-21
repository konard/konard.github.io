// Bounded public-API regression for the consumer follow-up to upstream PR 213.
import assert from 'node:assert/strict';
import { nextValue, readNumber } from '@link-foundation/ui-components/controls';

const actual = nextValue('ArrowUp', { value: 0.075, min: 0, max: 1, step: 0.01, snapping: 'directional' });
const expected = 0.08; // Existing NumberInput.test.jsx: next tick in the direction of travel.
console.log(
  JSON.stringify({
    contract: 'directional stepping from continuous values',
    actual,
    expected,
    supported: actual === expected,
  }),
);
assert.equal(actual, expected);

// Typed normalization is independent of keyboard increments.
const typed = readNumber('0.075', { min: 0, max: 1, step: 0.01, normalization: 'clamp' });
console.log(
  JSON.stringify({
    contract: 'continuous typed number',
    actual: typed.value,
    expected: 0.075,
    supported: typed.value === 0.075,
  }),
);
assert.equal(typed.value, 0.075);
