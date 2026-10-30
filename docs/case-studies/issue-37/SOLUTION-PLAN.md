# Solutions and execution plan by requirement

IDs refer to [the inventory](REQUIREMENTS.md). The latest owner feedback is a
hard constraint, overriding the prior rejected automatic layout-search plan.

| Requirement | Options considered | Selected implementation and verification |
| --- | --- | --- |
| R1: defaults | Copy 180/.05/13; 15/30/60/180 local ranges | Measure all ranges on both reported and all seeded networks; default to 30 degrees, .20 gaps, 1-degree refinement; keep suggested explicit settings and test bounds |
| R2: self crossing | Penalize angle signs; score actual painted halves | Reproduce old zero-cost folded lens; add painted-half self scoring and independent dense intersection checks; verify symmetric close 2222 references |
| R3/R10: preserve drawing | Global permutation/compaction; pinned nodes alone; fixed nodes and original image transform | Remove rejected search and renderer override; whitelist Apply spacing; serialize fixed frame through preview/Apply/share/export; compare actual coordinates/colors and closed-half geometry in tests |
| R4: sampled imperfections | Resample easy networks; move nodes until scores vanish; inspect unchanged sample under fixed geometry | Retain all 20 original seeded cases, bounded endpoint corrections and explicit honest residual ceilings; manually inspect all contact-sheet pairs and test every round trip in browsers |
| R5: keyboard focus | Duplicate key handlers; rely on native focus; pointer-down and completed-click focus | Reproduce focus loss between mouse phases; restore without cancelling dragging; native click plus page keyboard in four contexts and a focus-policy shim; macOS WebKit CI |
| R6: UI/UX | Synchronous search; main-thread deferral; cancellable worker | Worker keyed to current geometry; pending/error status, gated exports, stale-result cancellation; merge Apply into current style; retain responsive/mobile/language and existing editor regressions |
| R7: evidence | Replace old results; preserve separate phases | Keep original/rejected/preserved measurements and images with explicit labels, failing/passing logs and complete source snapshots; reusable probes in experiments |
| R8: research | Add graph-layout dependency; assess constraints first | Review W3C, WebKit, yFiles incremental layout, Graphviz pin/overlap/neato, ELK and existing d3-force; reject position-moving alternatives, reuse current curve renderer |
| R9: finish one PR | Defer sample/Safari tests; finish full matrix | Sequential local checks within memory budget; commit/push only prepared branch; update PR with fixed-placement screenshots, review full diff/feedback, verify main and clean state, wait current-head CI, mark ready without merging |

Pinned positions alone do not guarantee a fixed rendered picture: Graphviz's
pin documentation explicitly describes later transformations that can move them.
Our own position probe demonstrated the equivalent renderer-refitting defect.
The fixed-frame regression addresses that second cause independently of removing
permutation and compaction.

Linux WebKitGTK stalls remain a local validation limitation. Full Safari engine
coverage uses the existing native macOS CI matrix with ordinary pointer actions;
local incomplete runs are not counted as passing validation.
