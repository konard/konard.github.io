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
- [x] Run all local tests and CI checks and inspect logs: 797 tests, production build, 120 PDFs, six browser suites locally and the full seven-suite/three-engine hosted matrix.
- [x] Verify the first implementation CI against its exact SHA and archive the complete successful run, with no warning/error annotations.
- [x] Review the PR diff and requirements/evidence mapping; confirm current main (508cfed) is already an ancestor; update title/body with Fixes #31 and preserve upstream reports.

Finalization protocol: commit this evidence and the reviewed source-archive fix,
push only issue-31-ec772c60ce96, await all checks on that exact final head, then mark
PR 32 ready and confirm a clean tree. The PR description and GitHub check metadata
record the final head/run and ready state after this snapshot is committed; no
subsequent evidence-only commit is necessary to duplicate GitHub's status record.
