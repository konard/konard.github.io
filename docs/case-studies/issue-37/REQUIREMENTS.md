# Complete requirement inventory

Sources: [issue 37](https://github.com/konard/konard.github.io/issues/37),
[archived full report](data/issue.json), both downloaded report images, all issue
comments and all three PR comment APIs (conversation, inline, reviews).
No required sub-issues or additional feedback were listed at investigation time.
Issue 29 is a regression reference, not an unfinished sub-issue; its accepted
requirements are preserved and its tests are rerun. Issue 35 continuity remains
part of the compatibility audit.

| ID | Requirement, including prose | Implementation and verification |
| --- | --- | --- |
| R1 | Investigate the suggested `34442132` URL with gap range .05, turn range 180 and step 13; improve automatic defaults | `issue-37-measure.mjs` compares old/default/suggested options; default turn range 180, internal coarse exploration and original-grid refinement; retain .20 gap bounds and one-degree editable resolution based on 1111/2222 evidence |
| R2 | Do not introduce crossings between a link's own references, especially `2222` | Score the two painted halves outside their intentional middle join; failing old-score test plus independent 128-segment intersection check; before/after screenshots |
| R3 | Carefully improve automatic spacing toward the previous visual requirements | Bounded circular-order and compact-spacing search for small Automatic layouts; exact refitted acceptance, tiny movement preferences, paired-reference symmetry; preserve explicit layouts and satisfied drawings |
| R4 | Inspect 10–20 random networks with 1–4 links; fix and test every observed imperfection | Seed `0x37c0de`, exactly 20 cases with no resampling based on results; archive original and solved SVG contact sheets, raw measurements and individual native-browser checks; regress every discovered defect |
| R5 | Left/right arrows must work after clicking sliders, maintaining focus | Explicit `focus({preventScroll:true})` on pointer down and click in global, per-link and site settings sliders; unit tests cover lost focus during native mouse handling; actual mouse click followed by page keyboard, without `locator.press()` focusing implicitly |
| R6 | Check other UI/UX issues | Native dragging, number-field text navigation, pending status, worker cancellation and errors, preserving style edits made during manual Apply, downloads waiting for a finished image, Apply/share/export equality, mobile overflow, English/Russian; existing editor/browser suites retained |
| R7 | Collect issue-related data in `docs/case-studies/issue-37` | Full source issue, PR/comment snapshots, report PNGs, baseline/result measurements, focused failing/passing logs and screenshots |
| R8 | Deep case study, including online facts, existing libraries and plans for each requirement | README analysis, this inventory, PLAN checklist, primary-source research data and alternatives table |
| R9 | Execute the whole solution in the existing single PR, no deferred required work | PR 38 on the prepared branch; unit checks, production build, native browser CI, self review, updated PR description and ready status; no default-branch merge |

## Compatibility inherited from issues 19, 23, 25, 27, 29 and 35

- Keep the gallery/rain's legacy geometry and explicit historical URL semantics.
- One continuous colored curve passes through each own middle. Do not create
  automatic middle cuts by default; honor explicit cuts and their zero overrides.
- Already well-spaced manual drawings remain byte-for-byte identical.
- Self-closed halves retain their turns and gaps; paired references to a closed
  link remain symmetric with equal radii/gaps and measured painted clearance.
- Source/target turn and gap sliders, exact fields and independent resets remain
  available. Per-link source/target turns keep one-degree resolution and ±180°.
- Preserve user bounds relative to original turns/gaps, custom colors, notation,
  backgrounds, marker settings, history, SVG/raster downloads and sharing.
- Automatic spacing stays experimental and switched off by default. Explicit
  placement and explicit circular order do not acquire automatic layout changes.
