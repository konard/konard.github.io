# Issue 25 work plan

Objective: implement and verify every issue requirement in PR #26, on
`issue-25-665823cdf9ad`, preserving existing features and history.

- [x] Read the entire issue, comments, PR conversation, inline comments and reviews;
      archive raw data and check required child issues.
- [x] Inspect and archive all supplied images, URLs, related PRs and baseline CI.
- [x] Inventory requirements and map each to a root cause, implementation and check.
- [x] Research primary sources and relevant existing geometry/layout libraries.
- [x] Reproduce automatic gap/spacing, arrow sharpness/alignment and editor UI
      defects with failing automated tests and before screenshots.
- [x] Implement joint angle/gap search and configurable drawing clearance.
- [x] Implement configurable sharp arrows, acute-tip preservation and default
      balanced endpoint extents with a legacy opt-out, across rendering/export.
- [x] Replace per-link expandable controls with responsive cards containing all
      existing link inputs, including every per-link override.
- [x] Add opt-in diagnostics where useful; preserve URL, saved styles and exports.
- [x] Run focused regressions, then all unit tests, local CI checks, build and
      browser tests sequentially within the container memory budget.
- [x] Capture final desktop/mobile and before/after evidence in the repository;
      add the browser regressions to CI.
- [x] Complete the case study: chronology, all requirements, causes, alternatives,
      implementation, verification, raw evidence and any proven external issues.
- [x] Commit atomic changes after local checks and push only the prepared branch.
- [x] Fetch/merge latest default branch; review `gh pr diff 26`, fresh discussions,
      requirements, preservation of existing features and clean git status.
- [x] Update PR title/body with reproduction, tests, permanent screenshots and
      `Fixes #25`; validate source CI timestamps/SHA and archive complete logs.
      Repeat these checks on the final evidence commit before the publication gate.
- Final publication gate: mark PR #26 ready after the evidence commit passes
  fresh CI; leave unmerged. The final-head SHA, run URL and completed status
  are recorded on PR #26 after this archive snapshot.

Experiments stay under `experiments/`; collected logs/data/screenshots stay here.
Large logs are saved to disk and read in chunks of at most 1500 lines.
Browser MCP is unavailable in this session; use the repository's Playwright
library and actual Chromium/Firefox/WebKit automation instead.
