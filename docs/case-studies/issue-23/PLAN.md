# Issue 23 work plan

Objective: implement every requirement of issue #23, including the full audit of
issue #21, in PR #24. Work only on issue-23-729a1009db7c and leave PR unmerged.

- [x] Read complete issue #23, #21, initial PR #24 comments/reviews and recent work.
- [x] Archive issue screenshots, raw metadata, relevant logs and external research.
- [x] Inspect source and prior requirements; inventory acceptance criteria in case study.
- [x] Measure header/filter pressure under a bounded large gallery; capture before.
- [x] Reproduce default free-link bend, curved marker offsets and missing per-link gaps
      with failing unit/browser checks before implementing fixes.
- [x] Stabilize header blur across gallery load sizes and skins; remove gallery Share UI.
- [x] Audit responsive UI alignment across site, themes, skins and language choices.
- [x] Set zero default bend/rotation with independent self/partial-loop shaping; offer
      signed, broad angle/configuration ranges while preserving explicit shared values.
- [x] Make displaced endpoint/middle markers follow path position and tangent.
- [x] Add individual source/target reference and middle-cut gaps, editing/serialization,
      and integrate gap adjustment into the experimental overlap solver.
- [x] Audit all issue #21 criteria: symmetric defaults, cross start, colors, hover,
      visible settings agreement and legacy gallery/rain preservation.
- [x] Document causes, alternatives/libraries, timeline, requirement evidence,
      default-off diagnostics and upstream findings; report external bugs if proven.
- [x] Run focused tests, full unit tests, lint/format/file size/secrets/audit/build,
      and existing/new browser suites sequentially within memory limit.
- [x] Commit implementation and final cut-budget correction as separate atomic steps.
- [ ] Push only the prepared branch after local checks.
- [ ] Fetch default branch and ensure it is included; review full PR diff for regressions.
- [ ] Update PR title/body with reproduction, tests, screenshot comparisons and Fixes #23.
- [ ] List recent CI runs with timestamps/SHA; download and inspect fresh failure logs;
      fix all failing checks and verify latest commit passes every CI check.
- [ ] Re-read issue/PR feedback; confirm requirement inventory is complete, working tree
      clean, all commands finished, and mark PR #24 ready.
