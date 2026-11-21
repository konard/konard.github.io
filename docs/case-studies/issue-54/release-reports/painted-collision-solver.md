The published `@link-foundation/ui-components@0.1.1` provides the cancellable worker transport from #243. The painted solver specified in #228 is still missing. The changes in #256 improve doublet rendering after turns are supplied.

## Reproduce

```sh
npm install @link-foundation/ui-components@0.1.1
node --input-type=module -e 'import {createDoubletProvider,createNetworkEditorProvider} from "@link-foundation/ui-components/links-view"; console.log(Object.keys(createDoubletProvider()), Object.keys(createNetworkEditorProvider()))'
```

Both providers expose `geometry` and `svg`. They have no `solve`, so `createNetworkPresentation` needs a host solver to compute the turns or gaps. The consumer currently supplies its own painted cost model and search through the released worker transport.

## Acceptance

- Solve `22 11` through turns alone when the range allows it. Keep the original gaps and fit. Return an already-clean input without changes.
- Score strokes, filled marker interiors and miter tips, both halves beyond the center joint, and the actual visible segments around cuts.
- Treat gap edits as a fallback, cap each cut after fitting, and return the exact frame that reproduces the reported score.
- Preserve cancellation through the worker contract. Verify the remaining fixture and performance requirements in #228.
- Offer the painted scorer, solver and its default provider integration as published APIs. The consumer should be able to remove its local painted solver and pass its existing browser regressions.

Consumer context and fixtures are in [PR 55](https://github.com/konard/konard.github.io/pull/55). This report specifies behavior for an upstream implementation.
