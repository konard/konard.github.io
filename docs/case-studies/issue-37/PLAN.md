# Issue 37 work plan

Objective: implement and verify all issue 37 requirements and PR 38 feedback in
one pull request on `issue-37-f17145ac88b1`, without merging.

## Revision for the October 30 placement feedback

The latest owner feedback overrides the earlier assumption that Automatic
placement permits reordering or compacting the drawing. Colors and link
positions must be invariant; automatic changes must remain local to references.

- [x] Read the complete issue and all PR conversation/inline/review feedback;
      verify the prepared branch and that current main is already included.
- [x] Archive the new feedback and reread inherited geometry requirements.
- [x] Capture the rejected four-link result and add failing preservation tests
      before changing the solver, including all 20 original seeded examples.
- [x] Trace and remove automatic layout mutation from solving, preview, Apply
      and export; preserve explicitly chosen arrangements and colors.
- [x] Investigate small, deterministic endpoint adjustments at fixed positions;
      prefer the nearest solution, preserve closed halves and continuity, and
      prohibit new own-reference crossings. Keep measured residuals honest when
      existing crossings cannot be removed under these stronger constraints.
- [x] Research constrained/incremental layout alternatives from primary sources
      and record the decision, revised requirements and evidence.
- [x] Inspect every unchanged seeded example plus both reported networks in a
      real browser, save revised contact sheets and before/after screenshots,
      and regress each observed defect within the latest preservation rule.
- [x] Rerun unit, browser, lint, format, source-tooling, documentation and build
      checks sequentially within the container memory limit; preserve logs.
- [x] Review source changes and inherited compatibility evidence; preserve the
      implementation as an atomic commit. Publishing, current-head CI and final
      review follow the integration protocol below and are recorded in PR 38.

The checklist below records the prior implementation, which the owner rejected
for automatic placement changes. Its evidence is historical, not acceptance of
the revised solution. No Playwright MCP tool is available in this continuation;
use the repository's existing Playwright harness and installed native browsers.

- [x] Read the complete issue and all issue/PR comment types; check required
      sub-issues (none listed), branch, repository guidance and recent related PRs.
- [x] Archive supplied images and relevant historical requirements; research
      primary sources and existing graph/optimization components online.
- [x] Reproduce `2222` crossings, `34442132` spacing and slider arrow failures
      with failing automated tests and before screenshots.
- [x] Trace solver objectives, geometry constraints, defaults and focus lifecycle.
- [x] Implement spacing and keyboard fixes while preserving explicit settings,
      self loops, symmetry, middle continuity, exports and historical URLs.
- [x] Inspect 20 reproducible random networks with 1–4 links, measuring spacing
      and reviewing rendered pictures; fix and test every discovered defect.
- [x] Audit other UI/UX: focus, native number editing, Apply/share, responsive
      layouts, languages and solver responsiveness.
- [x] Integrate automated checks in CI; run local checks, unit tests, production
      build and native-browser suites sequentially within the memory budget.
- [x] Record requirement-to-evidence map, root causes, alternatives, limitations,
      screenshots, raw measurements and saved logs in this case study.
- [x] Commit useful atomic steps after local checks; push only the prepared branch.
- [x] Read the complete PR diff; verify main is included, feedback is addressed,
      PR title/body include screenshots and `Fixes #37`, and worktree is clean.

## Final integration protocol

The final gate is the current commit's live [PR checks](https://github.com/konard/konard.github.io/pull/38/checks).
Their final run URL and results belong in the PR description, so recording them
does not create another repository revision that needs a different CI run.

1. List latest CI runs with timestamps and head SHA; preserve and inspect
   non-passing logs in `ci-logs/`, fix failures, and wait for all head checks to pass.
2. Refresh issue comments, PR conversation comments, inline comments and reviews.
   Verify main is included and there are no uncommitted requirement changes.
3. Mark PR 38 ready and report its URL only after all criteria are verified.

Experiments live in `experiments/`; lengthy outputs go to case-study logs. Browser
work uses the existing Playwright test harness when MCP tools are unavailable.
No delegated agents are requested or needed. No release/version automation exists
for this private website package.
