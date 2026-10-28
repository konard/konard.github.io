# Issue 33 work plan

Objective: implement and verify every requirement of issue 33 in PR 34.

- [x] Read complete issue, comments, PR conversation, inline comments, reviews and sub-issues (none as of start).
- [x] Inventory requirements, research primary sources and existing libraries, preserve evidence and solution alternatives in the case study.
- [x] Reproduce missing indicators with focused failing tests and before browser screenshots.
- [x] Collect refreshed public repository, organization, registry, community, publication and social data; retain collection times and provenance.
- [x] Collect per-language repository source lines and public personal authorship, including outside repositories; exclude private repository metadata/code; document precise methodology and coverage.
- [x] Implement repository line counts and aggregate personal language/total indicators in English and Russian.
- [x] Implement accessible GitHub-style daily contribution calendar using public profile aggregate counts, including anonymized private activity; condition discipline slogan/explanation on recent activity and freshness.
- [x] Prefer live social embeds, retain historical extracts as fallbacks, label effective dates for snapshot numbers throughout the site and footer.
- [x] Audit personal/organization associative ecosystem against Formal AI stack; report evidence-backed omissions upstream if found.
- [x] Update applicable dependencies and associative-stack entries; review changed dependency install scripts and release conventions.
- [x] Run focused tests, full local checks, production build and real-browser before/after verification; preserve screenshots and evidence in the feature commit.
- [x] Commit atomic steps, merge latest main into prepared branch if needed, push only issue-33-bcf9257c5489.
- [x] Review complete PR diff for regressions, refresh requirements/evidence mapping, update PR title/body with screenshots and Fixes #33.
- [x] Inspect latest CI runs by timestamp/SHA; preserve failed run logs in ci-logs and resolve specific errors; verify all checks pass.
- [x] List recent CI runs with creation times and head SHAs; distinguish the dependency-update success from the later Chromium startup failures.
- [x] Download the failed workflow and both Chromium attempt logs; inspect the actual timeout and dependent pipeline errors with line references.
- [x] Run finite local startup/compositor reproductions, preserve opt-in failure diagnostics, and verify the next Chromium CI job passes without an application change or a timeout increase.
- [x] Verify every final-head CI result, including the three browser engines and all CV PDFs; investigate any new failures using freshly downloaded logs.
- [x] Verify clean tree, all requested work complete, mark PR 34 ready and leave unmerged.

The implementation commit and its successful CI run are pinned in `data/ci-feature-verification.json`. The subsequent evidence-only commit also requires fresh checks before handoff; its final SHA, successful run and clean-tree/readiness confirmation are recorded in the PR validation section, avoiding a self-referential repository commit.

Experiments and browser scripts live in experiments/. Large command output goes to log files. Run memory-heavy checks sequentially under the container budget. Read source/log files over 1500 lines in chunks. Never publish private repository details. Native thread goal is active until acceptance is verified.
