# Issue 39 work plan

Objective: implement and verify the complete issue in PR 40 on `issue-39-3ca842ebe6d7`; retain existing features and leave the PR unmerged.

- [x] Read the complete issue, all comments, PR conversation, inline comments and reviews (none at initial inspection); identify required sub-issues (none linked).
- [x] Research and archive current upstream immortality and t3code patterns, official social embed documentation, Apple materials/accessibility guidance and relevant component alternatives.
- [x] Inventory every requirement, root cause, implementation choice and verification in the case study.
- [x] Install dependencies; inspect existing settings, components, styles, unit tests and browser scripts.
- [x] Capture the reported image and reproducible before screenshots; add failing regression tests before changes.
- [x] Collapse source languages with fewer than 1,000 lines into Other without losing totals or detail.
- [x] Remove redundant numerical-indicator text at page tops while preserving footer sources.
- [x] Correct social embed sizing, lifecycle and blog presentation; verify responsive layouts and failure fallback.
- [x] Establish consistent new UI defaults and owned configurable controls, dropdowns, tables, spacing, accents, borders and corner previews across skins.
- [x] Make opacity work for every background style; migrate transparent style to zero opacity and avoid painting invisible backgrounds/effects.
- [x] Add independent rounded corners, sharp futuristic defaults, expanded border/accent ranges, and configurable frosted, glossy and liquid glass presets.
- [x] Verify accessibility (keyboard, focus, contrast, reduced motion/transparency), performance and saved-settings compatibility.
- [x] Run focused regression tests then full local CI checks and appropriate real-browser scripts sequentially within the memory budget; save long logs.
- [x] Capture and inspect final desktop/mobile/skin screenshots; commit permanent evidence and reusable experiments.
- [x] Commit useful atomic changes after local checks and push only the prepared branch.
- [x] Confirm latest main is already an ancestor; review `gh pr diff` and preserve all requested features. Verify clean git status after the evidence commit.
- [ ] Update PR title/body with implementation, reproduction, tests, before/after images and `Fixes #39`.
- [ ] Inspect recent CI timestamps and SHAs; download and analyze any failed logs to ci-logs, fix failures, wait for checks on the final commit.
- [ ] Re-read new feedback, mark PR ready, and complete the objective only when every criterion is verified.

Experiments belong in `experiments/`; evidence belongs here. No deliberate unbounded stress probes or concurrent heavy builds. Use Playwright MCP to inspect the live result and the repository's Playwright library harness for repeatable browser regression coverage.

This checklist records the evidence-commit checkpoint. Final CI and readiness are verified against the exact final head on [PR #40](https://github.com/konard/konard.github.io/pull/40/checks); no requested implementation is deferred.
