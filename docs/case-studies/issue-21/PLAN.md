# Issue 21 implementation checklist

- [x] Read issue, all issue/PR comments and reviews; check required sub-issues (none).
- [x] Verify prepared branch and clean initial state; archive issue, PR and related PR metadata.
- [x] Download and validate supplied images; inspect every visible setting and compare with URLs.
- [x] Trace editor geometry, gallery navigation, palette selection, markers and style URL round trips.
- [x] Research primary documentation and similar geometry libraries; archive relevant evidence and timeline.
- [x] Add minimal failing regression tests before fixing geometry, colors and hover behavior; capture before screenshots.
- [x] Implement editor-only symmetric defaults and meaningful bend behavior while preserving gallery/rain geometry and all existing editing features.
- [x] Verify supplied URL settings and controls in both directions, including exports and fresh shared-link reloads.
- [x] Add strict symmetry, gallery-isolation and navigation consistency regressions; retain reusable browser experiments.
- [x] Run local checks, all unit tests and production build sequentially within container memory limits; save logs.
- [x] Verify final UI in real browsers with screenshots; add automated browser checks to CI. Playwright MCP is not exposed, so use the repository's Playwright framework.
- [x] Complete case study: requirements/evidence mapping, timeline, root causes, solutions, library review, limitations and diagnostic instructions.
- [x] Commit useful atomic changes after checks; merge latest main if needed; push only prepared branch.
- [x] Read implementation PR diff, verify no features removed, inspect fresh CI by timestamp/SHA, download logs/artifacts, fix any failures.

## Final handoff protocol

After committing this evidence, update PR 22's title/body with reproduction,
tests, before/after screenshots and `Fixes #21`. Review the complete diff again,
verify the latest commit's CI by timestamp/SHA and confirm a clean working tree.
Then mark PR 22 ready without merging. The live results for these external
actions are recorded on [PR 22](https://github.com/konard/konard.github.io/pull/22),
so this evidence snapshot does not require recursively archiving itself.
