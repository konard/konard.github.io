# Issue 43 work plan

Objective: implement and verify every issue 43 requirement in PR 44; leave the PR
unmerged and report any genuinely blocked acceptance criterion as unfinished.

- [x] Confirm prepared branch and clean initial worktree; create native goal.
- [x] Archive complete issue, issue comments, sub-issues, PR conversation,
  inline comments, reviews, and preceding issue/PR context.
- [x] Read shared geometry, layout, style, enumeration and UI implementations;
  inventory requirements and trace root causes across every consumer.
- [x] Research primary sources and existing routing/enumeration components.
- [x] Create failing minimal tests and before screenshots for all reported
  layouts and navigation/random-network defects before implementation.
- [x] Replace inferred nonzero defaults with a general zero-turn geometry rule
  for arbitrary network sizes, preserving manual editing and good behavior.
- [x] Make Next network enumerate all networks across link counts; add Random
  real network with references exclusively in 1..N.
- [x] Verify unit/integration cases, exhaustive bounded small networks,
  additional seeded larger networks, real-browser screenshots and exports.
- [ ] Run complete local unit/static/tooling/build checks sequentially within
  the container memory budget; preserve command logs and experiment scripts.
- [ ] Commit independently useful changes after checks and push only the
  prepared branch; preserve history and incorporate origin/main if needed.
- [ ] Complete case study with timeline, requirement-to-evidence inventory,
  root causes, alternatives, decisions and before/after visual evidence.
- [ ] Inspect PR diff for regressions and scope; refresh all feedback endpoints.
- [ ] Update PR title/body with positive closing reference and screenshots.
- [ ] Inspect latest five CI runs with timestamps/head SHAs; download full logs,
  analyze any failures by line number, fix and verify against the latest head.
- [ ] Ensure all CI checks pass, default branch is included and worktree is
  clean; mark PR 44 ready and complete goal only after all criteria are met.

Experiments stay in `experiments/`; investigation data and logs stay here.
No stress probe may exhaust memory/stack; use finite inputs and one heavy job
at a time. Review files over 1,500 lines in chunks. Read/download actual images
before interpreting them. No sub-agents are required for this task.
