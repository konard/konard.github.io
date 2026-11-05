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
      panel, frame, network/material/audio and packaging gaps in reports 209–212.
      Reporting them and keeping working adapters does not complete this item.
- [ ] Compare desktop/mobile, themes, presets and pages in real browsers;
      commit baseline/final evidence and automated migration checks.
- [ ] Review line counts and deletions, complete focused checks, push atomic
      commits, and verify all CI for the final SHA.
- [ ] Merge main into the prepared branch if necessary; review the entire PR
      diff, update its title/body with evidence and Fixes #54, mark ready,
      and confirm the working tree is clean.

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
