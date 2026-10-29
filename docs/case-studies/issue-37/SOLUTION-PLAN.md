# Solutions and execution plan by requirement

The IDs refer to [the full requirement inventory](REQUIREMENTS.md). These are
the options considered and the steps used to implement and verify each choice.
Measured results and rejected experiments remain in the case-study data/logs.

| Requirement | Options considered | Selected solution and verification steps |
| --- | --- | --- |
| R1: proposed defaults | Copy all three suggested values; retain old defaults; use coarse exploration with fine refinement | Measure the reported URL and paired references under both settings; adopt 180° range, preserve .20 gap range and 1° resolution, explore coarse candidates internally; test the explicit 13°/.05 URL without widening its bounds |
| R2: crossed references | Penalize large angles; forbid angle signs; score actual self collisions | Reproduce the old zero-score crossing with an independent dense intersection check; score the two painted halves outside the intentional middle joint; retain paired symmetry; verify no self intersection and show before/after images |
| R3: spacing quality | More angle descent; exact refitting of every trial; force layout; ELK/Graphviz replacement; bounded order/spacing search | Trace fitted marker geometry and fixed-order minima; measure existing force placement and exact-fit cost; enumerate at most 24 small Automatic layouts, probe then refine, accept exact fitted improvements; preserve manual placement, closed halves, cuts, user bounds and satisfied drawings |
| R4: random sample | Hand-picked examples; seeded sample with no replacement | Generate 20 networks with 1–4 links before tuning; archive baseline sheets; identify all six additional defective cases; add failing per-case checks, solve them, inspect every final drawing, then verify each in real browsers and Apply/share round trips |
| R5: slider arrows | Add key handlers again; rely on browser focus policy; explicitly focus on pointer down | Demonstrate missing pointer-focus guarantee with failing tests and a native-focus suppression shim; focus without cancelling dragging; use actual click then page keyboard in global, turn, gap and settings controls; keep native number-field editing checks |
| R6: other UI/UX | Synchronous wider search; deferred main-thread search; cancellable worker | Measure search duration and visible responsiveness; move work to a module worker, key results and terminate stale jobs; show pending/errors, gate image exports, test cancellation/startup failure, native dragging, mobile width, languages and legacy editor contracts |
| R7: collect data | External-only investigation notes; repository case study | Archive complete issue/comment snapshots, valid report PNGs, raw before/after geometry, primary-source facts, failed/passing logs and renders here; keep reusable probes in experiments; reference committed screenshots in the PR |
| R8: deep analysis/research | Add a general graph dependency immediately; assess existing components against the doublet grammar | Check W3C/WebKit focus evidence, ELK ordering, Graphviz overlap/neato and existing d3-force; document why bounded search fits this geometry, why alternatives did not fix every constraint, and map every requirement to evidence |
| R9: complete one PR | Defer random defects or Safari validation; finish within PR 38 | Preserve atomic commits on the prepared branch; run local checks and browser regressions within the memory limit; add the new cross-engine check to CI; review the diff and latest comments, update the PR with evidence and closing reference, verify current-head CI, mark ready without merging |

The Linux WebKitGTK rendering stall is a local validation limitation, not an
accepted substitute for Safari coverage. The isolated native-input probe is
retained; full WebKit verification belongs to the existing macOS CI matrix.
