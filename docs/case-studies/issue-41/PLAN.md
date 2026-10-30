# Issue 41 work plan

Objective: implement and verify every issue requirement in PR 42, preserving gaps,
manual settings, established loop/lens geometry and link identity.

- [x] Read the complete issue, issue comments, PR conversation, inline comments and reviews.
- [x] Inspect repository guidance, geometry, editor, solver, tests and recent related PRs.
- [x] Archive issue/PR data, related history and available CI logs; research existing layout components.
- [x] Reproduce all four supplied examples with failing geometry tests and before screenshots.
- [x] Implement topology-aware default turns in the shared editor/render/solver path; preserve explicit turns.
- [x] Audit other straight-capable configurations and every rendering call site.
- [x] Verify 20 seeded random cases with 1–3 links, plus exhaustive small-network geometry checks.
- [ ] Verify gap settings stay unchanged, previous perfect configurations, manual turns,
      style controls, worker spacing, Apply, sharing, downloads, gallery and mobile behavior.
- [x] Capture after screenshots and complete a requirement-by-requirement case study,
      including timeline, root cause, alternatives and reproducible evidence.
- [ ] Run local unit/browser/check/build/tooling validation sequentially within memory limits.
- [ ] Commit atomic changes after local checks; merge latest main if needed; push only the prepared branch.
- [ ] Update PR title/body with reproduction, tests, before/after images and Fixes #41.
- [ ] Inspect the complete PR diff and refreshed feedback; verify current-head CI and save logs.
- [ ] Confirm clean worktree, mark PR ready and report its URL; leave PR unmerged.

CI investigation protocol: list the five newest runs with timestamp and head SHA;
compare with the latest commit; download each failed run to ci-logs; read logs in
chunks of at most 1500 lines; record concrete errors and verify their resolution.
No required sub-issues or images are linked in the initial issue or PR feedback.
No Playwright MCP tools are exposed; use the repository's native Playwright harness.
