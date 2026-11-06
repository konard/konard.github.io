# Issue 54 work plan

Objective: migrate the site's reusable UI to link-foundation/ui in PR #55,
preserve every existing feature, compare rendering, report framework gaps with
working adapters, and collect the research and verification here.

## Requirements and verification

- [x] Read issue 54, comments, PR conversations, inline comments and reviews;
      inspect related upstream migration issue 66 and its dependencies.
- [x] Inventory reusable UI, persistence, URLs, rendering and site content;
      record baseline screenshots and contract tests before replacements.
- [x] Research current framework APIs and alternatives from primary sources;
      record source revisions, solutions and tradeoffs for every requirement.
- [x] Integrate reproducibly pinned packages, settings engines, select controls,
      color positioning, catalogs, palette tokens, notation parser and inspector.
- [x] Report every observed missing generic feature or bug upstream; retain
      full site functionality through explicit, tested compatibility adapters.
- [ ] Full support for every reusable UI feature upstream: blocked by the
      frame, network/material/audio and publication
      gaps in reports 209–211. PR 213's select, normalization and directional
      stepping/continuous typing APIs and PR 214's browser packaging fixes are adopted; panel
      translation and RGB APIs now exist but do not supply rendering providers.
      Reporting them and keeping working adapters does not complete this item.
- [x] Compare desktop/mobile, themes, presets and pages in real browsers;
      commit baseline/final evidence and automated migration checks.
- [x] Review line counts and deletions, complete focused checks, and preserve
      implementation and evidence as atomic commits.
- [x] Verify main is an ancestor of the prepared branch; review the entire PR
      diff, update its title/body with evidence and Fixes #54,
      and confirm the working tree is clean.
- [ ] Mark ready after the full-support requirement is met. Until then,
      retain the draft and explicitly report the unfinished criterion.

Final CI is tracked by the current-commit checks on PR 55. The initial failed
run is preserved in the case study. All checks must pass on the corrected
commit before this draft's implementation work can be reported as verified;
passing checks still do not complete the separate upstream-support criterion.

## Initial findings

- Issue 54 and PR 55 have no feedback comments or reviews as of 2026-11-05.
- Upstream issue 66 describes a migration based on an older site revision.
  Its licensing prerequisite restricts copying site code upstream, not using
  framework code here. No site code will be relicensed or copied upstream.
- `@link-foundation/ui-settings` returns npm E404. A source snapshot is needed
  until upstream publishes the workspace packages.
- Framework classic frames do not represent this site's individual corners,
  edges, states, element levels and fit limits. Replacing these outright would
  remove existing behavior; this gap needs an upstream report and an adapter.

## CI restart: November 6

- [x] Refresh issue and all three PR comment channels; compare current SHA and
      run times, download all three recent non-passing runs, inspect actual logs.
- [x] Confirm latest main is already an ancestor; no merge/conflict is pending.
- [x] Identify current-head failures: gallery API screenshot stalls in its font
      wait; the keyboard audit passes after 18 minutes but consumes most of the
      single WebKit job, causing cancellation before later suites run.
- [x] Draft native gallery capture and isolate the unchanged WebKit keyboard
      suite in a separate matrix entry with unique concurrency/artifact names.
- [x] Verify focused regressions fail against the original workflow and pass
      after the fix; check static rules and production Chromium gallery capture.
- [ ] Push only the prepared branch; inspect every current-commit CI check and
      preserve any new failure logs before making further corrections.
- [x] Refresh upstream support/publication evidence; keep any still-blocked
      acceptance criteria explicit and leave the PR unmerged.
- [ ] Review final diff, update PR description and confirm a clean working tree.
