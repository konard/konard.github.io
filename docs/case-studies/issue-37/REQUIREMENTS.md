# Complete requirement inventory

Sources: [issue 37](https://github.com/konard/konard.github.io/issues/37),
[archived full report](data/issue.json), downloaded report PNGs, all issue
comments and all three PR comment APIs (conversation, inline, reviews).
The [October 30 feedback](https://github.com/konard/konard.github.io/pull/38#issuecomment-6521354738)
overrides earlier assumptions permitting automatic layout changes. Its full
conversation is archived in `data/pr-conversation-revision.json`.
There are no required open sub-issues. Issues 17, 19, 21, 23, 25, 27, 29 and 35
supply inherited requirements; their full bodies/comments are archived in
`data/inherited-issue-*.json` and were reread for this revision.

| ID | Requirement, including prose and latest feedback | Implementation and verification |
| --- | --- | --- |
| R1 | Investigate proposed `.05 / 180 / 13` settings; improve defaults | Compare bounded ranges; choose local 30-degree default, retain .20 gaps and 1-degree refinement; unit/browser-check explicit suggested URL without widening its bounds |
| R2 | Never introduce the reported own-reference crossing in `2222` | Score painted halves outside their intentional middle join; exact old-result reproduction, independent 128-segment intersection checks, rendered before/after evidence |
| R3 | Improve overlaps with only small automatic local adjustments | Endpoint turns/gaps only; immutable placement and pinned original fitting frame; no permutation/compaction; retain measured residuals where fixed crossings/closed halves constrain the result |
| R4 | Inspect 10–20 random networks with 1–4 links and fix observed defects within the latest constraints | Same 20 seeded cases, measured residual ceilings, every actual middle/closed-half position checked, dense own-crossing checks, per-case browser round trips and visual contact sheets |
| R5 | Clicking sliders then pressing Left/Right maintains focus and changes value | Pointer-down and click focus in global, per-link and site settings sliders; actual click followed by page keyboard in native browsers, plus native-focus suppression/blur regression |
| R6 | Check other UI/UX | Native dragging/number editing, worker responsiveness/cancellation/errors, pending export gating, concurrent palette edit preservation, exact Apply/share/export, mobile overflow and English/Russian |
| R7 | Preserve all issue data in this case study | Full issue/feedback/inherited snapshots, valid report PNGs, failing/passing logs, raw solver data, original/rejected/fixed screenshots |
| R8 | Deep analysis, online research, available components and plans | README root causes, primary-source research, constrained/incremental layout alternatives and requirement-by-requirement solution plan |
| R9 | Complete and verify within existing PR 38 | Atomic forward commits on prepared branch, all local checks and complete native-browser CI, current description/screenshots, final feedback/diff/main review and ready status; no merge |
| R10 | It must be impossible for automatic spacing to change colors or link placement in `34442132` or any other network | Solver has no layout mutation path; renderer accepts no layout override; Apply whitelists turns/gaps/frame; test all eight placements, custom palettes/manual order, all 22 rendered center sets, closed-half control points and frame serialization |

## Inherited compatibility

- Preserve gallery/rain geometry; default circle for 1–4, hexagonal after;
  alternative placements and circular order remain deliberate manual controls.
- Preserve one continuous colored curve through each own middle. No automatic
  middle cuts by default; retain all explicit cuts and zero overrides.
- Already well-spaced manual drawings remain byte-for-byte identical.
- Closed halves retain turns, gaps and actual image-space control points.
  Paired references to a closed link retain symmetry, equal radii/gaps and
  measured painted clearance without drastic default bends.
- Per-link source/target turn/gap sliders, exact fields and independent resets
  remain available. Manual turns retain ±180 degrees and one-degree resolution.
- Keep original bounds, custom colors, notation, backgrounds, marker controls,
  history, SVG/raster downloads, sharing and historical URL semantics.
- Automatic spacing remains experimental and off by default. Deliberate manual
  geometry/topology edits refit the drawing; cosmetic edits preserve applied
  spacing and its fixed frame.
