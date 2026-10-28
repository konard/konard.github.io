# Issue 31 / PR 32 work plan

Objective: implement and verify all issue requirements in this PR; preserve evidence here.

- [x] Read the full issue, comments, sub-issues, PR conversation, inline comments and reviews; inventory requirements.
- [x] List recent branch and main CI runs with timestamps and SHAs, download every non-passing run's logs and identify exact errors.
- [x] Inventory the complete repository tree and every workflow, CI/deployment script, configuration and test.
- [x] Snapshot both recommended templates' complete trees and relevant files at immutable commits; compare all files by applicability.
- [x] Read the full CI/CD best-practices guide; map every applicable practice to code and verification.
- [x] Research existing components and official documentation; record alternatives and solution plans per requirement.
- [x] Add focused reproducing tests before fixing actual defects; bound resource use and preserve experiments.
- [x] Apply fixes across all affected paths, preserving existing behavior; report shared defects to template repositories when applicable.
- [x] Run all local tests and CI checks and inspect logs: 799 tests, production build, 120 PDFs, six browser suites locally and the full seven-suite/three-engine hosted matrix.
- [x] Verify the first implementation CI against its exact SHA and archive the complete successful run, with no warning/error annotations.
- [x] Review the PR diff and requirements/evidence mapping; confirm current main (508cfed) is already an ancestor; update title/body with Fixes #31 and preserve upstream reports.
- [x] Inspect raw hosted logs in addition to annotations; reproduce and resolve the macOS-only npm script-review advisory with an exact-version approval and an all-platform regression.
- [x] Resolve the evidence-heavy PR's CodeQL 300-file diff warning by selecting full analysis for every language; report the shared template configuration limitation and verify the workflow regression.

Finalization protocol: commit this evidence and the reviewed source-archive fix,
push only issue-31-ec772c60ce96, await all checks on that exact final head, inspect
raw platform logs for warnings as well as annotations, then mark
PR 32 ready and confirm a clean tree. The PR description and GitHub check metadata
record the final head/run and ready state after this snapshot is committed; no
subsequent evidence-only commit is necessary to duplicate GitHub's status record.

- [x] Resolve all ten alerts exposed by full CodeQL analysis, including existing code; add bounded reproductions and behavioral tests.
- [x] Verify the separate Advanced Security check and zero open PR-merge alerts, in addition to the workflow and raw logs.

- [x] Reproduce the false-green security job, enforce actual SARIF results and test real failing/clean reports; report the shared contract gap in both templates.

- [x] Complete full hosted validation at 67ca6ef (run 40681082933), including 833 tests, all seven suites on all three engines, 120 PDFs, real uploads, independent CodeQL and zero open alerts; inspect complete raw logs and all annotations.
- [x] Archive successful full-run logs, exact-head checks, every security result and the final per-file PR diff review. All requested implementation and verification criteria are satisfied; final-head CI/readiness is recorded in the PR after this evidence snapshot.
