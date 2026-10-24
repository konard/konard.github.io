# Issue 19 work plan

Objective: implement and verify every issue requirement in PR #20, on the prepared branch only.

- [x] Read the full issue, all comments, PR conversation/inline comments/reviews and latest related PR. No required sub-issues or additional feedback exist at intake.
- [x] Archive source data and download/inspect the reported image.
- [x] Reproduce URL flooding/black screen, self-loop no-op geometry and asynchronous clipboard failure; preserve before screenshot and failing tests.
- [x] Research primary browser API sources and established layout libraries; record timeline, root causes, alternatives and requirement/evidence matrix.
- [x] Debounce URL writes after pointer/touch/keyboard interaction, coalesce short interactions, preserve live preview/share URL, handle history failures with opt-in diagnostics.
- [x] Fix self-loop angles, curvature and bend, with conditional controls for ineffective settings.
- [x] Add symmetric start/end reference gaps, marker offsets/rotations/angles/sizes and middle cut/offset options; validate rendering and URL round trips.
- [x] Set requested editor defaults while preserving gallery/rain defaults and default rotation.
- [x] Add scalable circle, square, hexagonal, dice, playing-card, and deterministic link-aware force arrangements; retain automatic circle for 1–4 links.
- [x] Fix Safari image clipboard activation and support browser capability fallbacks for copying/sharing/export.
- [x] Verify all controls with meaningful geometry/capability tests; run browser regressions in Chromium, Firefox and WebKit sequentially within memory budget, mobile/desktop and supplied URLs, before/after screenshots.
- [x] Run local checks, all 682 unit tests, production build, 120 CV PDF checks and dependency audit. Review code for regressions and removed features. Full WebKit gallery validation uses the larger CI runner after a documented local memory stop.
- [ ] Commit the case study/browser CI and push only the prepared branch; review `gh pr diff` against the published revision.
- [ ] Merge current main if necessary, update PR title/description with reproduction/tests/screenshots and Fixes #19.
- [ ] List CI runs with timestamps/SHA, download and inspect non-passing logs, fix errors, verify final CI and clean working tree; mark PR #20 ready.

Large command logs go to this case study or ci-logs. Keep experiment scripts in experiments/, bounded in input size. Run memory-heavy commands sequentially; tests use one worker locally. No package release automation exists, so no package version bump is needed for the private static site.
