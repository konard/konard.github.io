ui-components/links-view: collision solver that tries turns before gaps, scores painted clearance and runs as a cancellable provider job

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to remove all general-purpose UI code from the site. Related upstream work is #66. This issue follows up the #211 criterion that was left unfinished: a "turns-before-gaps solver with painted clearance". It depends on the default renderer requested in `network-renderer.md`, because it adjusts that renderer's per-link turns, gaps and frame. Licensing: the site has no license, so this issue is a behavior specification only. No site code is copied here.

## Current upstream

At b4baef4:

- `packages/ui-components/src/links-view/presentation.js` (`createNetworkPresentation`) already accepts an optional provider `solve` with latest-job-wins `AbortSignal` cancellation. It discards late results and keeps the other options on partial updates. `docs/spec/network-providers.md` documents this contract.
- No upstream module scores or resolves visual collisions. The only "collision" upstream is the ID check in `lino-to-network`.
- The `force` layout separates nodes. It does not separate painted curves.

## Required behavior

Add `solveCollisions(links, options, {signal})` and wire it as the default provider's `solve`. It must also be runnable in a module Worker.

- **Inputs:**
  - `clearance`: 0..10, in 1/100 of the symbol box, default 1.
  - `solveRange`: 0..180°, default 180.
  - `solveStep`: 1..30°, default 1.
  - `solveGaps`: default true.
  - `solveGapRange`: 0..1 layout units, default 0.2.
  - `solveMiddleRange`: 0..15 box units, default 0. It allows new middle cuts.
  - `passes`: default 3.
  - `debug`: optional.
- **Painted scoring:**
  - Collisions are measured on what is painted: the stroke width plus clearance, marker outlines including miter tip extensions, filled-marker interiors, and cuts as real breaks.
  - A link's own halves count against each other outside a joint radius of `strokeWidth + clearance + middleSize/2`.
  - A crossing costs more than a near miss. A near miss costs more as the distance shrinks, and it costs extra below the stroke width.
- **Search order:**
  1. Symmetric case: a link that refers twice to a self-closed link, `(1: 1 1)`, gets turns `[a, −a]` with equal gaps. Ties prefer the most uniform spacing and then the smallest movement.
  2. Turns only, first within ±min(30, range) and then within ±range. The search stops at the first collision-free result.
  3. If nothing is clean and gaps are allowed, try gap-first stages (gaps, then turns, then gaps again).
- **Winner:** fewest collisions, then the smallest total gap change, then the earlier stage. A per-degree turn penalty only breaks ties.
- **Never worse:** the result never scores worse than the input. Input that is already collision-free is returned unchanged.
- **Bounds:**
  - Applied turns stay within ±180.
  - Free (`0`) ends and self-closed halves are not moved.
  - A new cut is at most 30% of the half-length and at most 30 units.
  - Existing manual cuts are never shortened.
- **Frame pinning:** when the input has no frame, the solver pins the current fit as a `frame`. Its edits then do not rescale the drawing, and the cut caps are re-checked after any refit.
- **Performance:**
  - For 3 or more links with clearance, search a coarse grid first (about 61 angles per end at most), then refine locally.
  - Pair costs are cached incrementally.
  - A dense 24-link network finishes within a bounded time on one core.
- **Result:** `{turns, linkGaps, frame, delta, before, after}`. `before` and `after` are collision counts, which a UI shows as "before → after". The partial-update path applies only turns, gaps and frame, so all other options are untouched.
- **Cancellation:** aborting rejects with an `AbortError` and terminates the worker. A synchronous fallback is used when `Worker` is unavailable.

## Acceptance criteria

- [ ] `22 11` is solved by turns alone. Gaps are unchanged, one turn points inward and one outward, and the largest |turn| is above 30.
- [ ] `22 11` with turns `-90 90` is already clean and is returned unchanged.
- [ ] `22 22` gets mirrored turns, all with |delta| ≤ 30.
- [ ] `22 11` with `solveRange 30` changes gaps. With `solveGaps false` it is still clean.
- [ ] `11 11` (link 2 refers twice to the self-closed link 1) gets symmetric turns `[a, −a]` and equal gaps on link 2.
- [ ] Gaps-only mode reduces cost without creating a crossing through a cut. A cut never exceeds its cap after a refit.
- [ ] For random inputs of 1–6 links, `after ≤ before` always holds.
- [ ] A 24-link dense network returns a bounded cost. Aborting it mid-run rejects within one frame.
- [ ] Rendering the returned turns, gaps and frame reproduces the reported `after` score exactly.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| `src/links/collisions.js` | 361 |
| `src/links/painted-collisions.js` | 108 |
| `src/links/collision-gaps.js` | 97 |
| `src/links/collision-symmetry.js` | 95 |
| `src/links/collision-gap-cache.js` | 73 |
| `src/links/solver-job.js` | 26 |
| `src/links/collision-worker.js` | 9 |
| `src/pages/useCollisionSolver.js` | 27 |

The solver fields of `src/links/style.js` also become deletable.
