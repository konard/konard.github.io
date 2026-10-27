# Issue 27 work plan

Objective: implement every requirement of issue 27 in PR 28; preserve existing features and all historical URLs. No required sub-issues are listed in the issue or current comments.

- [x] Read issue 27, all comments, PR 28 conversation/inline comments/reviews, issue 25 and PR 26.
- [x] Archive input reports and verified original screenshots.
- [x] Audit historical URL changes and archive relevant reports, logs and configurations.
- [x] Reproduce and measure unequal closed-loop gaps and the 0.07→0.08 discontinuity before changing code; capture before screenshot.
- [x] Add failing minimal geometry, solver, URL and keyboard regressions.
- [x] Fix stable symmetric painted endpoints while preserving issue 25's equal lens boundaries and gallery geometry.
- [x] Preserve fully/partially self-closed endpoints during automatic gap/angle search; verify the exact 1111 arrangement and prior 2222 reference.
- [x] Compact default turn/gap rows and upgrade historical URLs through browser history without losing Back/Forward.
- [x] Audit every numeric field and slider across the app: decimal stepping, arrows, PageUp/Down, Home/End, editing, Tab and relevant shortcuts.
- [x] Run real Playwright browser checks in all three engines and actual native-spinner mouse clicks through MCP; capture after screenshots and quantitative evidence.
- [x] Research primary specifications and relevant libraries; document chronology, root causes, alternatives, all requirements and evidence in case study. Report upstream issues only if evidence identifies an upstream defect.
- [x] Reproduce and correct the additional native inherited-spinner path: failing unit test and actual MCP Down click return 0 before, 0.07 after.
- [x] Run complete local checks, 737 tests, production build, three-engine issue-27/25 suites, older compatibility suites, 120 CV PDFs and dependency audit sequentially; store large logs. No OOM events/kills.
- [x] Commit atomic implementation steps after local checks and push only issue-27-5cf85bfa2348; prepare the PR title/body with Fixes #27, reproductions, tests, screenshots and case study.
- [x] Confirm main is already an ancestor, review implementation diffs, match CI timestamps/SHAs and archive both passing implementation runs. No failing CI runs require investigation.

This is the archived plan at the evidence commit. The native completion goal remains active through these publication gates; the PR records their final status after this file is committed:

1. Push the case study and all evidence; update the existing PR title and description.
2. Inspect the final evidence commit's own CI run, matching its timestamp and head SHA; require every check to pass.
3. Re-read all latest issue/PR comments and reviews, confirm main ancestry, a clean tree and the complete requirements inventory.
4. Mark PR 28 ready, verify it remains unmerged, then complete the native goal.
