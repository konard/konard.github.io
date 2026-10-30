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
- [x] Verify gap settings stay unchanged, previous perfect configurations, manual turns,
      style controls, worker spacing, Apply, sharing, downloads, gallery and mobile behavior.
- [x] Capture after screenshots and complete a requirement-by-requirement case study,
      including timeline, root cause, alternatives and reproducible evidence.
- [x] Run local unit/browser/check/build/tooling validation sequentially within memory limits.
- [x] Commit atomic changes after local checks; verify latest main is an ancestor; push only the prepared branch.
- [x] Update PR title/body with reproduction, tests, before/after images and Fixes #41.
- [x] Inspect the complete implementation diff and refreshed feedback; verify implementation CI and save logs.

After committing this evidence, the finalization procedure is to inspect the
evidence diff, wait for CI on that exact final head, confirm a clean worktree,
mark PR 42 ready and report its URL. The final-head check is recorded in the PR
description, avoiding a new evidence-only commit for every CI run. Leave the PR
unmerged.

CI investigation protocol: list the five newest runs with timestamp and head SHA;
compare with the latest commit; download each failed run to ci-logs; read logs in
chunks of at most 1500 lines; record concrete errors and verify their resolution.
No required sub-issues or images are linked in the initial issue or PR feedback.
Browser evidence uses the repository's native Playwright harness and a final
Playwright MCP review after those tools became available.
