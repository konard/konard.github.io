# Issue 31 / PR 32 investigation

Original issue: https://github.com/konard/konard.github.io/issues/31
Pull request: https://github.com/konard/konard.github.io/pull/32

## Requirement inventory and solution plans

All issue and PR comment/review endpoints were read and archived: no comments,
reviews, images, or required sub-issues existed at the initial audit. The issue
body is the complete acceptance scope. The referenced templates are comparison
sources, not replacement applications.

| Requirement | Evidence / finding | Alternatives and chosen plan | Verification |
| --- | --- | --- | --- |
| Fix the failed main CI/CD run | Run 40662150605, SHA 508cfed, 2026-10-28 09:10 UTC; log line 1288: artifact CreateArtifact ENOTFOUND after all WebKit tests passed | Ignoring evidence uploads conceals missing evidence; re-running the entire test matrix wastes work. Retry only transient artifact operations with a finite budget using GitHub's artifact SDK, fail permanent/exhausted failures | Inject DNS/reset/429/5xx, permanent 403, partial upload and exhausted failures; real uploads in fresh CI |
| Check all false positives, false negatives, warnings and errors | Warning at line 439 (1354-line collector); lines 764–775 and repeated preview calls (extensionless config imports). Missing aggregate gate, scheduled lock audit, standalone shell/Python checks and workflow security audit | Extract networking helpers; load the complete config graph with native ESM; add explicit status, lint and audit gates; verify deployed commit and PDF content rather than only HTTP 200 | Regression tests, local checks, fresh CI and deployment stub tests |
| Compare the complete tree of the JS template, especially every workflow/script | Immutable SHA in js-template-sha.txt; every file classified and hashed in js-file-comparison.json; all workflow/script/config contents in templates/js | Adapt reusable gates and invariants to existing npm/Vitest/React/Pages workflow; retain all browser and PDF checks. Registry, Docker/Helm and universal-app tooling do not apply to a private static website | Per-practice audit below; workflow structure and behavior tests |
| Compare the complete Python template tree, especially every workflow/script | Immutable SHA in python-template-sha.txt; python-file-comparison.json; archived workflow/script/config sources in templates/python | Adopt Python syntax/Ruff checks for all helper scripts; no mypy/package-release machinery for untyped standalone experiments; adopt shared security/status/Pages practices | Ruff and compile checks on all Python files; CI regression tests |
| Report shared defects to the templates | Both have single-attempt artifact uploads, including release-critical Pages artifacts; snapshots in template-artifact-uploads.txt | Search for an existing matching report; file focused issues in each affected template with exact source locations and failure evidence | JS #264 and Python #120 linked in SOURCES.md |
| Apply every applicable best practice from the linked guide | Complete guide archived as CI-CD-BEST-PRACTICES.md | Map all 17 principles explicitly; applicability is based on this repository's actual build/release targets | Practices table below and CI |
| Search online for additional facts and reusable components | Official GitHub Actions docs, upload-artifact / upload-pages-artifact, Vite, actionlint, zizmor, Ruff, lychee, retry action | Prefer GitHub's artifact SDK over a third-party action that executes shell commands: it can classify failures and reuse the official upload protocol. Existing Vitest and Playwright cover behavior | SOURCES.md and reproducible tests |
| Fix every affected occurrence across the entire codebase | All workflows, scripts, experiments, tool configs and tests inventoried; repeat warnings originate in the same transitive imports | Use one artifact uploader for browser evidence and Pages; inspect all standalone shell/Python paths; native config traversal covers every imported config dependency | Repository-wide checks and workflow invariants |
| Preserve collected template data without executing its configuration | Staging the full snapshots exposed lint-staged selecting a nested archived package.json | Select the root lint-staged and ESLint configurations explicitly; keep the imported files unchanged | Failing nested-config reproduction, passing hook regression and the actual evidence commit |
| Complete in this single PR with no deferred requirements | Prepared PR #32 and branch issue-31-ec772c60ce96 | Atomic commits, forward-only history, review diff, update PR body with closing keyword, await exact latest-SHA checks, mark ready; never merge automatically | Final verification log and clean working tree |

## Guide applicability and implementation

| Principle | Website application |
| --- | --- |
| 1. Relevant changes | Detect changes in a job, keep terminal check present on every PR; documentation changes get docs checks, CI and experiment changes run all regressions |
| 2. File limits | Keep 1500-line limit aligned with ESLint; extract collector networking helper to remove warning; include Python, HTML and configuration sources, exempt archived/generated evidence |
| 3. Formatting | Existing Prettier and ESLint; Ruff formatting for Python helpers |
| 4. Static analysis | Existing React hooks/ESLint plus standalone ShellCheck, Python Ruff/syntax, actionlint with bundled shellcheck, zizmor and CodeQL |
| 5. Fast fail | Lint/checks precede browser/build/PDF jobs |
| 6. Changesets | Not applicable: package is private, no package releases or automatic versioning; deployment is the release trigger |
| 7. Actual merge result | Checkout GitHub's PR merge result; fail clearly if latest base is not its ancestor; final branch contains current main |
| 8. Hooks | Preserve lint-staged; include Python/shell checks and file limits in local hooks |
| 9. Automated releases | Existing tested Pages artifact and OIDC deployment; package registry/version/changelog tooling is not applicable |
| 10. Concurrency | Per-job cancellable checks, matrix-specific groups; shared non-cancellable main writer group; no repository version pushes to rebase |
| 11. Secrets | Existing secretlint; include source/docs/config, only raw imported evidence and generated data excluded |
| 12. Docs | Validate required README sections and local links; external link checker with bounded retry and explicit diagnostics; skip only archived historical evidence |
| 13. Native multiarch images | No Dockerfile, image, Helm chart or container release target; no emulation or image publish added |
| 14. Workflow lint | Retain pinned actionlint Docker image with shellcheck, add zizmor low-confidence audit with scoped policy and test workflow invariants |
| 15. Dependency audit | Audit committed npm lock on PR/push and weekly schedule; Python runtime helpers have no installed production dependency tree; third-party experiment tools are explicitly documented |
| 16. Publish preflight | Probe Pages configuration before slow builds, require Actions source on main, report setup limitations on PR; deployment already uses OIDC and no registry secrets |
| 17. Accurate outcomes | Retry transient artifact failures only, validate actual evidence exists, fail unexpected skips, notice deliberate skips, verify correct deployment commit and file contents |

## Scope decisions

No UI change is needed: the observed browser tests all passed and the failure is
in the artifact transport. Browser evidence and screenshots remain generated by
the existing regression suites. No UI features or test suites are removed.

## Research and comparison artifacts

- [Official sources and component alternatives](SOURCES.md).
- [Workflow and every-script comparison](TEMPLATE-COMPARISON.md).
- Shared bug reports: [JavaScript #264](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/264), [Python #120](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/120).
- `*-before.log` and early numbered logs are preserved reproductions/failed implementation experiments. `*-final.log` records the selected implementation checks; initial experiments are not unresolved production failures.
