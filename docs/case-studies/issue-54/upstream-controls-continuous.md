Consumer follow-up for https://github.com/link-foundation/ui/issues/210

Tested upstream revision `45645979bb91d99f7a308d3b9168f3757294a184`
in https://github.com/konard/konard.github.io/pull/55.

The new `nextValue(..., { snapping: 'directional' })` meets the previously
reported stepping contract: `0.075` + ArrowUp at step `0.01` yields `0.08`.
The consumer now delegates its number/range key arithmetic to this public API.
The new localized panel messages, translated stepper labels and RGB editors
also address the corresponding missing APIs in the previous report.

One remaining number-field deletion gate: typed continuous values still snap.
Minimal public-API reproduction:

```js
import { readNumber } from '@link-foundation/ui-components/controls';
readNumber('0.075', { min: 0, max: 1, step: 0.01, snapping: 'directional' });
// actual: { value: 0.08, invalid: false }
// required opt-in policy: { value: 0.075, invalid: false }
```

`number-field` calls `readNumber` for both draft input and committed text;
`readNumber` calls `clampStep` unconditionally. Keeping the visual draft does
not preserve the continuous value sent to the live preview/store. For this
consumer, step defines keyboard/pointer increments while typed or imported
finite values are clamped to bounds without quantization. Please expose a
typed-value normalization policy independent of directional key snapping.
The existing default can remain step-snapped for other consumers.

The consumer retains its small React number editor and now tests that typing
`0.075` sends `0.075` and clearing sends `null`, alongside the existing
directional key/pointer regression. No site implementation is copied upstream.
The finite probe lives in `experiments/framework-migration/upstream-contracts.mjs`;
`STRICT=1` fails on this remaining field-replacement criterion.
