# Issue 37 work plan

Objective: implement and verify all issue 37 requirements and PR 38 feedback in
one pull request on `issue-37-f17145ac88b1`, without merging.

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
- [ ] Commit useful atomic steps after local checks; push only the prepared branch.
- [ ] Read the complete PR diff; verify main is included, feedback is addressed,
      PR title/body include screenshots and `Fixes #37`, and worktree is clean.
- [ ] List latest CI runs with timestamps and head SHA; preserve and inspect
      failed logs in `ci-logs/`, fix failures, and wait for all head checks to pass.
- [ ] Mark PR 38 ready and report its URL only after all criteria are verified.

Experiments live in `experiments/`; lengthy outputs go to case-study logs. Browser
work uses both Playwright MCP inspection and the existing Playwright test harness.
No delegated agents are requested or needed. No release/version automation exists
for this private website package.
