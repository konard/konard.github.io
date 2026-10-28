# Review before final push

- Read the issue and every issue/PR comment, inline review comment and review.
  The final refresh still has no additional requirements or required sub-issues.
  The only PR conversation entry is GitHub's informational Code Scanning setup
  message, not a requested change.
- Reviewed `gh pr diff 32`, the workflow and every changed execution script,
  source/test diff and the lockfile dependency changes. The lockfile adds the
  official artifact SDK and its dependencies; the scoped glob override is covered
  by an actual SDK archive round trip and a clean install/audit.
- Compared the extracted collector networking code to the original functions:
  behavior, throttles, retry limits and exported functions are preserved. Python
  helper changes are formatting plus splitting one combined import.
- All seven browser commands, their original regressions, all three engines,
  the exact 4,131-card hosted load, compositor captures and all 120 PDF checks
  remain enabled. No website feature or prior test case was removed.
- The deployment probe is tested with valid/stale/missing/wrong-content HTTP
  responses. Source archives can build without Git; hosted builds use GITHUB_SHA.
  A PR uploads the real Pages artifact but deliberately does not deploy to main.
- Native imports, the line-count edge cases, upload recovery/permanent rejection,
  missing evidence and complete terminal status coverage have regression tests.
- Staging the template snapshots exposed nested lint-staged configuration
  discovery and ESLint's file-relative configuration discovery. The hook selects
  the root package.json and both lint commands select eslint.config.js
  explicitly. A behavioral regression reproduces both failure paths and verifies
  the corrections; the actual staged snapshot now passes without changing its
  original hashes.
- Every one of the 603 template paths has an inventory entry; every workflow and
  CI/helper script has a disposition in TEMPLATE-COMPARISON.md. All 17 guide
  principles are mapped in README.md. Package/registry/container release steps
  have no target in this private static website.
- The latest fetched default branch is 508cfed490c3946fffca440f8f2d31a8733b8d35
  and is already an ancestor of this branch. No merge or history rewrite is needed.
- Local final validation: 53 suites / 797 tests, source checks, native build,
  Python/Ruff/ShellCheck, workflow/security audits, zero lockfile advisories,
  six Chromium browser suites and all 120 PDFs. The local gallery probe was
  stopped by its memory guard; the full case passed on all hosted engines.
- Hosted implementation run 40668100515 passed every required job and real
  upload, with no warning/error annotations. Final-head checks are verified
  again after the evidence commit; the PR description links their run and records
  readiness. No direct merge or default-branch push is part of this work.

Shared reports: JavaScript template issue 264 and Python template issue 120.
They are upstream reports, not outstanding website acceptance criteria.
