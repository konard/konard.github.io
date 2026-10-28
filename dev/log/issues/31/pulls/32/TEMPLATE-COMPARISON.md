# Complete template comparison

Every tracked path is listed with a content hash and applicability assessment in
`js-file-comparison.json` (482 files) and `python-file-comparison.json` (121 files).
The immutable revisions are recorded in the accompanying SHA files. All workflows,
scripts, hooks and tool configurations are copied under `templates/`; this table
records the execution-level comparison. Application/example sources and their tests
are reference implementations, not features requested for this React website.

## Workflows

| Source | Local application |
| --- | --- |
| JS release.yml; Python release.yml | prepare → fast checks → all existing browser suites → unit/build/PDF artifact → Pages deploy, plus a terminal status gate. No npm/PyPI/registry release, changeset or versioning target exists. |
| JS workflows.yml; Python workflows.yml | Pinned actionlint Docker with shellcheck, separate standalone shell checks, zizmor annotation and pedantic passes, conservative checkout credentials, job timeouts and matrix-specific concurrency. |
| JS security.yml; Python security.yml | JavaScript/Python/Actions CodeQL and scheduled committed npm-lock audit. No installed Python application dependency environment exists to audit. Dependency-review metadata is supplementary; lock audit gates all committed dependencies rather than only PR deltas. |
| JS links.yml; Python links.yml | Bounded lychee check and cache over maintained README, whose relative links cover case-study entry points. Archived evidence is not a live-link contract. Failed live links stay failures; no archive-availability fallback passes them. |
| Python docs.yml | Required README sections and relative links; static website build and Pages publish already generate the actual product documentation. No separate Sphinx/ReadTheDocs target exists. |
| JS example-app.yml, javascript-first-example.yml, javascript-first-gate.yml | Universal-app/Tauri/mobile/Docker/JavaScript-first examples have no corresponding target here. Preserve the website’s existing React build, seven browser suites in three engines and all CV PDF checks. |

## Every CI/helper script

Related helper implementations were compared together. Names are retained here so
each archived executable can be located and its disposition reviewed.

| Template script | Applicable behavior or reason not copied |
| --- | --- |
| js/scripts/bootstrap-dependencies.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/changeset-version.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-changesets.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-ci-workflows.mjs | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/check-dependency-graph.sh | Committed npm lock audit, weekly schedule and CodeQL. Python helpers have no project dependency manifest; no Python package resolution or registry publishing surface. |
| js/scripts/check-docker-build.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-docker-publish.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-file-line-limits.sh | `scripts/check-file-line-limits.sh`: warning/error thresholds, Python/HTML/TOML coverage, final unterminated line and spaces tested. |
| js/scripts/check-mjs-syntax.sh | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/check-package-manager.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/check-pages.sh | `scripts/check-pages.mjs` preflight and `scripts/check-deployed-site.sh` content/commit verification. |
| js/scripts/check-pipeline-status.sh | `scripts/check-pipeline-status.mjs` and `src/workflow.test.js`: derive complete required jobs and reject unexpected skips/missing results. |
| js/scripts/check-release-needed.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-required-docs.sh | `scripts/check-docs.mjs`: require Development, Updating the data and Deployment; no package API/installation documentation target. |
| js/scripts/check-staged-formatting.mjs | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/check-status-gate-covers-all-jobs.mjs | `scripts/check-pipeline-status.mjs` and `src/workflow.test.js`: derive complete required jobs and reject unexpected skips/missing results. |
| js/scripts/check-version.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/check-web-archive.mjs | lychee with finite retries; retained failure for unresolved live URLs. Archive hints do not prove availability. |
| js/scripts/create-github-release.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/create-manual-changeset.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/debug-print.mjs | Job timeouts, finite retries and explicit failure/skip messages; no artificial runtime-budget warning when work is valid. Preserve complete logs as evidence. |
| js/scripts/detect-code-changes.mjs | `scripts/ci-changes.mjs`: CI/experiments/configuration changes run application checks; prose/evidence changes skip expensive builds with notices. |
| js/scripts/format-github-release.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/format-release-notes-helpers.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/format-release-notes.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/github-actions-log.mjs | Job timeouts, finite retries and explicit failure/skip messages; no artificial runtime-budget warning when work is valid. Preserve complete logs as evidence. |
| js/scripts/github-release-state.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/install-git-hooks.mjs | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/instant-version-bump.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/js-paths.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/land-via-pull-request.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/lint-changed-lines.mjs | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/lint.mjs | Existing ESLint/Prettier/Husky extended with Python/Ruff and ShellCheck. Workflow invariants cover terminal gate, supported action runtimes, timeouts, credentials and publishing. |
| js/scripts/merge-changesets.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/npm-registry.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/package-info.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/pr-comparison.mjs | `scripts/ci-changes.mjs`: verify the latest base is an ancestor of the checked-out PR merge result; refuse stale previews. |
| js/scripts/preflight-credentials.sh | Pages Actions-source preflight; existing environment/OIDC permission on deploy. No npm/PyPI/Docker registry credentials are used. |
| js/scripts/publish-failure-classifier.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/publish-retry.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/publish-to-npm.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/push-failure-classifier.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/push-main-with-rebase-retry.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/read-job-cancel-in-progress.sh | Per-job cancellation groups; separate noncancelling deployment writer group. Workflow structural regression tests enforce policy. |
| js/scripts/recheck-broken-links.mjs | lychee with finite retries; retained failure for unresolved live URLs. Archive hints do not prove availability. |
| js/scripts/release-metadata.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/release-naming.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/run-command.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/run-with-budget-warning.sh | Job timeouts, finite retries and explicit failure/skip messages; no artificial runtime-budget warning when work is valid. Preserve complete logs as evidence. |
| js/scripts/sanitize-npm-userconfig.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/setup-npm.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/simulate-fresh-merge.sh | `scripts/ci-changes.mjs`: verify the latest base is an ancestor of the checked-out PR merge result; refuse stale previews. |
| js/scripts/smoke-test-package.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/update-preview-images.mjs | Existing browser suites produce regression screenshots; no template preview-image publishing target. |
| js/scripts/use-module.mjs | Single existing npm package/lockfile; npm ci and native-config import test already exercise installation and module syntax. No alternate package manager or universal-app adapter needed. |
| js/scripts/validate-changeset.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/version-and-commit.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| js/scripts/wait-for-npm.mjs | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/audit_dependencies.py | Committed npm lock audit, weekly schedule and CodeQL. Python helpers have no project dependency manifest; no Python package resolution or registry publishing surface. |
| python/scripts/bump_version.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/check-dependency-graph.sh | Committed npm lock audit, weekly schedule and CodeQL. Python helpers have no project dependency manifest; no Python package resolution or registry publishing surface. |
| python/scripts/check-pipeline-status.sh | `scripts/check-pipeline-status.mjs` and `src/workflow.test.js`: derive complete required jobs and reject unexpected skips/missing results. |
| python/scripts/check-required-docs.sh | `scripts/check-docs.mjs`: require Development, Updating the data and Deployment; no package API/installation documentation target. |
| python/scripts/check_file_size.py | `scripts/check-file-line-limits.sh`: warning/error thresholds, Python/HTML/TOML coverage, final unterminated line and spaces tested. |
| python/scripts/check_release.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/check_web_archive.py | lychee with finite retries; retained failure for unresolved live URLs. Archive hints do not prove availability. |
| python/scripts/create_github_release.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/create_manual_changeset.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/detect_code_changes.py | `scripts/ci-changes.mjs`: CI/experiments/configuration changes run application checks; prose/evidence changes skip expensive builds with notices. |
| python/scripts/format_release_notes.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/preflight-credentials.sh | Pages Actions-source preflight; existing environment/OIDC permission on deploy. No npm/PyPI/Docker registry credentials are used. |
| python/scripts/publish_to_pypi.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/read-job-cancel-in-progress.sh | Per-job cancellation groups; separate noncancelling deployment writer group. Workflow structural regression tests enforce policy. |
| python/scripts/read_manifest.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/recheck_broken_links.py | lychee with finite retries; retained failure for unresolved live URLs. Archive hints do not prove availability. |
| python/scripts/release_naming.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/run-with-budget-warning.sh | Job timeouts, finite retries and explicit failure/skip messages; no artificial runtime-budget warning when work is valid. Preserve complete logs as evidence. |
| python/scripts/simulate-fresh-merge.sh | `scripts/ci-changes.mjs`: verify the latest base is an ancestor of the checked-out PR merge result; refuse stale previews. |
| python/scripts/smoke_test_published_package.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/validate_changeset.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |
| python/scripts/version_and_commit.py | Package/version/changelog/npm/PyPI/container/release helper has no publishing target in this private static website; Pages deployment remains the release mechanism. |

## Repository-wide coverage

The local source tree was inventoried in `repository-tree.txt`. There is one
workflow and one npm lock. All artifact sites now share the same uploader. All
eleven extensionless imports reachable from the native Vite config were fixed.
Standalone shell scripts and hooks are checked from the Git index; every maintained
Python helper is compiled without execution and linted/formatted. Generated data,
build output and immutable archived source/logs have explicit exclusions.

The original collector networking code was extracted without changing its request,
retry, throttling or concurrency behavior. Existing tests and browser/PDF suites
remain enabled. Formatting changes to Python helpers also remove a genuine E401
multiple-import warning. No feature or supported browser is removed.
