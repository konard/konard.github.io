# Issue 33 validation and reproducibility

All collection times below are UTC on 2026-10-28. The implementation is reviewed in [PR 34](https://github.com/konard/konard.github.io/pull/34); the requirement-by-requirement analysis, alternatives and limitations are in [README.md](README.md).

## Collected evidence

| Dataset | Effective time | Coverage |
| --- | --- | --- |
| Anonymous public profile | 17:43 | Public-field allowlist; private self-profile settings rejected |
| Curated repository catalog and organizations | 15:53 | 737 collected repositories; 527 displayed after the existing visibility, empty/fork and generated-log rules |
| Complete public ecosystem inventory | 17:27 | 1,912 repositories across the personal account and 15 public organization accounts, including forks; 1,303 are not generated temporary repositories |
| Historical public contribution discovery | 16:16 | 951 public repositories discovered through historical contribution collections and paginated public PR history |
| Repository health | 16:16 | File/root-history facts for the complete curated catalog |
| Anonymous GitHub profile graph | 16:37 | 368 consecutive dates and all five daily levels; 102,095 contributions, checked against the profile heading |
| Separate first-party contribution research | 16:16 | 15 annual totals through 2026, summing to 136,956; calendar aggregate includes 6,198 restricted contributions |
| Package registries | 15:58–16:01 | 20 main and 13 additional registry checks; 501 discovered packages before the website's project filters |
| Stack Overflow | 16:04 | Public user and top-tag statistics |
| Habr | 15:48 | 13 articles and current fallback statistics; the existing live refresh remains available |
| Social archive | 15:51 | 67 messages: 64 VK and 3 X; four new public VK images downloaded and verified as JPEG |
| Associative-stack audit | 17:47 | Every one of the 1,912 inventory repositories; 574 broad associative candidates and three proven runtime omissions |
| Completed public source census | 21:40 | 1,737 measurements, zero errors; all 527 displayed repositories have whole-repository language counts and all 1,303 non-noise inventory repositories are covered |

The generated website totals are 436 original repositories (146 personal and 290 organization repositories), 88 mirrors, 3 public forks, 986 stars and 67 GitHub-detected languages. These are dated project-catalog figures, not a count of all 1,912 audited repositories or a measure of personal authorship.

The completed census credits 13,224,518 surviving nonblank source lines across 95 cloc language categories and 805 repositories. Of these, 4,461,732 lines are credited in 260 repositories outside the personal and organization accounts in the public inventory. These are Git-attributed lines, including comments and tool-assisted/generated source; they are not a measurement of manual typing. Shared original-line identities are credited once.

`source-coverage.json` records the complete inventory/display coverage and external-account contribution counts. `source-checkpoint-verification.json` records the passing independent comparison of all 1,737 measurements and every language total with the private durable deduplication database. Only public aggregate verification results are published. `source-census-final.log` preserves the final resumed collection, which completed with zero errors, and `build-data.log` records the subsequent website rebuild.

## Exact collection commands

Run from the repository root. Older collectors retain their historical default output directories, so the explicit issue-33 destinations matter.

```sh
node experiments/collect-public-profile.mjs
node experiments/collect-repositories.cjs docs/case-studies/issue-33/data
node experiments/collect-organizations.cjs docs/case-studies/issue-33/data
node experiments/collect-repository-health.cjs --verbose
node experiments/collect-indicators.cjs
node experiments/collect-public-calendar.mjs
node experiments/collect-public-inventory.cjs
node experiments/collect-registries.cjs docs/case-studies/issue-33/data
node experiments/collect-other-registries.cjs docs/case-studies/issue-33/data
node experiments/collect-stackoverflow.mjs
node experiments/collect-habr.cjs docs/case-studies/issue-33/data
node experiments/archive-posts.cjs --out=docs/case-studies/issue-33/data/posts.json
node experiments/audit-associative-stack.cjs
```

`npm run build:data` copies the collected social/archive fallback into the website as well as rebuilding profile, repository and indicator data. Historical case-study data is preserved.

The latest cloc release at collection time was [v2.10, published 2026-07-04](https://github.com/AlDanial/cloc/releases/tag/v2.10). Both local fixtures and CI use the same release script and verify its SHA-256:

```sh
curl --fail --location --silent --show-error \
  https://raw.githubusercontent.com/AlDanial/cloc/v2.10/cloc -o /tmp/issue33-cloc.pl
printf '%s  %s\n' \
  bf59272455172108072a0a106379f7509fd4349bdcfd85203bac038ccd286d83 \
  /tmp/issue33-cloc.pl | sha256sum --check
python experiments/collect-source-lines.py --cloc /tmp/issue33-cloc.pl --verbose
CLOC_PATH=/tmp/issue33-cloc.pl python experiments/test_source_lines.py
python experiments/verify-source-checkpoint.py
npm run build:data
```

The attribution cache and verified author identities stay outside the repository in `/tmp/issue33-source-cache`. A resumed census requires its matching deduplication database; use `--fresh` to deliberately rebuild both measurements and deduplication state. Do not delete the cache during a census or publish its author-identity files.

After the census completes, `verify-source-checkpoint.py` independently reads its SQLite database in read-only mode. It compares every durable repository measurement with the public JSON and groups the unique original-line identities by language, checking both the language sums and the overall total. Its output contains public aggregate counts only; the database and identity cache are never published.

## Dependency and tooling refresh

The npm dependency/lockfile upgrade is verified with `npm outdated` and `npm audit`; the final results are recorded with the full local checks below. CI tool versions were checked against their official latest stable releases, preserved in `data/tooling-versions.json`: Ruff 0.17.3, zizmor 1.31.1, zizmor-action v0.8.0 and actions/cache v6.1.0 (the workflow follows its v6 major). ShellCheck v0.11.0 and actionlint v1.7.12 were already current. Cache v6 retains the Node 24 runtime and the workflow's inputs; zizmor-action retains every configured input. Updating Ruff required one formatter-only change in the existing entry-page generator.

`tooling-checks.log` records passing checks with the updated Ruff and both regular and pedantic online zizmor audits. The existing severity/confidence thresholds, publisher policy and narrow documented ignores are retained.

`data/action-versions.json` independently confirms the remaining configured action majors against their latest stable official releases: checkout v7.0.1, setup-node/setup-python v7.1.0, deploy-pages v5.0.1, lychee-action v2.9.0 and codeql-action v4.39.1. CodeQL bundle releases have separate versions and are not mistaken for action releases.

`workflow-checks.log` records all 42 workflow/CI-policy regressions passing after these changes. `check.log` records passing ESLint, Prettier, the 333-file source-size gate and secret scanning. `data/dependency-verification.json` records an empty `npm outdated` result and zero vulnerabilities from the fresh npm audit at 20:57.

## Reproductions and regression evidence

- `red-tests.log`: the original implementation fails the three feature regressions for daily/personal indicators, per-language repository lines and archive-first social posts.
- `profile-privacy-red.log` / `profile-privacy-green.log`: an authenticated self-profile exposes account-only fields; anonymous collection, allowlisting and rejection of a private profile view pass.
- `calendar-rollover-red.log` / `calendar-rollover-green.log`: a mirror that changes the snapshot's former last day after midnight must be rejected. Today's contribution count cannot decrease either.
- `calendar-unit.log`: all 13 focused calendar tests pass, covering daily counts/levels, Sunday-first weeks, missed days, stale or future evidence, malformed/incomplete responses, unavailable service, historical disagreements and midnight rollover.
- `generated-log-red.log` / `generated-log-green.log` and the corresponding `generated-log-display-*` logs: the shared generated-log archive is excluded from source projects while the real `log-it` software project remains visible. Its complete public tree metadata is retained in `data/generated-log-archive.json` and the ecosystem audit.
- `patch-attribution-red.log`: a saved patch initially receives personal programming credit. The collector fixtures verify that patch text remains in whole-repository language counts while receiving no personal credit; checkpoint migration removes old patch credit consistently.
- `git-index-limits.log`: a finite 2,500-file checkout under a 128 MiB limit reproduces the threaded-lstat failure and passes with bounded pack/index settings.
- `checkpoint-recovery-red.log`: interrupting the JSON write initially changes one real authored Python line to zero on resume. Durable measurements and line identities now commit together, and the resumed run retains that line.
- `legacy-checkpoint-scope-red.log`: reusing an identical revision from a legacy outside-repository checkpoint initially raises `KeyError: 'sourceLinesScope'`. Those older scans covered whole repositories; migration now persists that scope before the durable checkpoint is saved, and reuse grants no duplicate credit. The existing identical-revision fixture verifies both current and legacy records. The long-running census, which had loaded the earlier collector before this fix was written, subsequently reached the same error at `konard/CEHR2005-GCS-TS`; `legacy-checkpoint-scope-census.log` preserves that real occurrence. Restarting with the corrected collector resumes from the durable records and applies the migration.
- `zero-size-repository-red.log`: a real one-line Git repository initially loses its code because the API reports size zero. GitHub's zero-KiB metadata for a public nonempty example and its real HEAD are preserved in `data/zero-size-repository.json` and `zero-size-head.log`. The collector now verifies an absent public HEAD before recording an empty tree; legacy size-only empty checkpoints are rechecked without removing any credited line identities.
- `source-tests.log`: twelve finite local Git/cloc fixtures cover verified nonblank attribution, comments, mirror deduplication, renamed paths, candidate-only partial clones, private visibility rejection, checked-zero and identical-SHA shortcuts, large JSON counting, bounded index checkout, saved-patch exclusion/migration, interruption recovery and a nonempty zero-KiB repository.
- `cv-print-before.log` / `cv-print-after.log`: the added site-wide data notice initially expands a compact CV to two pages; excluding that notice from print restores all 120 PDF variants to their existing size/text-layer requirements.
- `habr-dates-red.log` / `habr-dates-green.log`: a partial article/profile refresh initially labels saved figures as live. Missing profile data, missing articles and an empty refresh now retain the appropriate dated fallback label; the existing complete-refresh test still verifies live numbers.
- `social-rebuild-red.log` / `social-rebuild-green.log`: collecting the social archive with an explicit issue-33 destination initially leaves `build:data` without a website archive output. The regression verifies that rebuilding publishes the preserved public archive, including its effective date and media paths.

## CI startup investigation

Run [40740634789](https://github.com/konard/konard.github.io/actions/runs/40740634789), created at 17:57:46 for `35a870e`, failed twice in Chromium before the first issue-23 assertion: `locator('#style-bulge').inputValue()` timed out after 15 seconds. The saved job logs in `ci-logs/github-pages-40740634789-chromium.log` and `-chromium-attempt2.log` locate the timeout at line 630 and the original script location at line 634. The full workflow log records the same failure at line 8769 and its dependent pipeline failure at line 11036. Firefox and WebKit passed.

The preceding `4a4eb40` run passed all engines. The intervening privacy commit changes only the public-profile collector, its fixture and case evidence; it changes no application or lockfile. Ten finite local headed Chromium startups and the full 1,215-card headed regression also passed. Commit `d602cd3` preserves failed-request, DOM and screenshot diagnostics, with optional `TRACE_BROWSER=1` console tracing, without changing the application or increasing its timeout. The Chromium job in [40745028548](https://github.com/konard/konard.github.io/actions/runs/40745028548) then passed, including the 4,131-card compositor checks. This establishes an intermittent CI startup failure; it does not establish its underlying cause or claim an application fix. Final-head checks are recorded separately below.

That run's WebKit job was canceled before acquiring a runner: its runner ID was zero and it executed no steps. GitHub's annotations explicitly report macOS ARM capacity constraints and repeated unsuccessful runner acquisition; they are preserved in `data/ci-webkit-capacity.json`. A job log does not exist because execution never began. The workflow now selects `macos-15-intel`, a [supported GitHub-hosted Intel runner](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job), retaining native macOS 15 WebKit and the existing job timeout. This addresses the identified runner-pool failure without weakening the compositor assertions.

The next run (also preserved in `data/ci-runner-verification.json`), [40748655886](https://github.com/konard/konard.github.io/actions/runs/40748655886), created at 18:49:17 for `98d769a`, passed every required job. This includes Chromium, Firefox, native WebKit on `macos-15-intel`, unit/build/PDF verification, workflow linting, documentation, tooling, all three CodeQL analyses and the final pipeline gate. Deployment was correctly skipped for the pull request. This verifies the runner change; the final feature-head results are recorded separately.

## Final local verification

The final, complete source dataset passes all 865 tests in 62 files (`test-ci.log`, 21:41:48–21:45:34). This includes production-data coverage, external-account attribution, generated-data consistency and the UI/calendar/privacy regressions. `build.log` records the subsequent successful production build of every page.

All 120 CV PDF variants pass the existing page-count and searchable-text checks (`cv-print-after.log`). The complete-data browser regression also passes (`indicators-browser.log`): exact daily counts and all five colors in both themes, compatible live replacement, conflicting/invalid/offline fallback, slogan expiry, repository language counts, social archive/retry and narrow mobile layouts. Expanded attribution evidence for all 805 credited repositories fits the mobile viewport. The seven final `after-*.png` browser captures were inspected as valid PNG images; the two earlier Playwright MCP captures separately show the calendar and footer dates.

All seven existing Chromium browser scripts pass against the final production build (`existing-browser-browser.log` and `existing-browser-issue{19,21,23,25,27,29}.log`). These retain history, clipboard/downloads, geometry, all eight navigation keys for 45 network and 55 settings sliders, automatic spacing, per-link cards and mobile layouts. The local gallery probe is finite at 1,215 cards; CI retains the full 4,131-card load in all three engines. Captures and result JSON go to `/tmp/issue33-final-existing`, preserving historical case studies.

The initial combined shell invocation ended with status 143 after the first editor script printed all passing assertions; it did not start the remaining scripts. There was no assertion failure or OOM. Its output is preserved in `existing-browser-browser-interrupted.log`. Every script was then run separately and exited successfully without a code change. The process termination's cause is not established.

`docs-check.log` records the passing documentation check. A fresh fetch confirms that `main` at `bb88ed9437a1b26cb43b7fc1436fe885080c113d` is already an ancestor of the working branch.

## Pull request review

The complete implementation at `c7ea669c447ffb11fd76b0d5de1a696aada2634d` passed [run 40776059468](https://github.com/konard/konard.github.io/actions/runs/40776059468), created at 21:56:41 and completed at 22:10:14, after the implementation commit at 21:56:19. All 13 required jobs succeeded: preparation, Chromium, Firefox, native Intel macOS WebKit, unit/build/PDF verification, documentation, tooling, workflow linting, source checks, three CodeQL analyses and the pipeline gate. Deployment was correctly skipped for the pull request. The test log confirms 865 passing tests in 62 files and all 120 CV PDFs. Immutable run/job metadata is preserved in `data/ci-feature-verification.json`.

PR 34 was marked ready for review after this run passed. The following evidence-only commit adds these CI/review records, completes the plan and removes the prepared placeholder. Its fresh CI outcome and exact final SHA are recorded in the PR validation section; the pull request remains unmerged.

GitHub's combined `gh pr diff 34` endpoint rejects this data-rich pull request with HTTP 406 because it exceeds 20,000 diff lines. Review therefore used the complete local base-to-head diff and all paginated GitHub pull-request file records. Every one of the 176 paths and blob SHAs matches the pushed implementation commit `c7ea669c447ffb11fd76b0d5de1a696aada2634d`; the aggregate comparison is preserved in `data/pr-review-verification.json`. The 4,253-line source/configuration diff was read in bounded chunks, while the collected datasets are checked by production-data coverage, regeneration, privacy and independent checkpoint verification. The preserved historical failure logs were reviewed separately with the line references above.

The review found no new functional regressions. Annual charts, multilingual social deduplication, the editor/gallery, existing keyboard interactions and all CV variants remain covered by their passing regressions. The generated `konard/public-logs` archive is deliberately reclassified under the source catalog's generated-log rule; its public metadata remains in the complete audit. The prepared-branch `.gitkeep` placeholder is removed. A fresh issue/sub-issue and all three PR-comment-type check found no new feedback or required sub-issues.

## Preserved limitations

GitHub Packages' token lacks `read:packages`; current public package pages provide rounded download totals, which remain explicitly labeled as rounded rather than exact. Additional-registry discovery preserves two truncated trees and the inaccessible public-tree error as known coverage limits, not zero results. These pre-existing collector constraints do not block the requested repository source measurements.

Source attribution measures surviving default-branch lines credited by Git, including tools used under the verified account. It excludes private code, deleted work, documentation/data and saved patches. Repository totals cover all detected cloc languages, with code/comments/blanks distinguished. Unrecognized file types are not assigned an invented language or estimated line count.

The live calendar mirror disagrees with GitHub's anonymous graph on completed days. The website therefore retains the exact, dated first-party graph; deterministic tests separately verify compatible live replacement, offline/invalid/disagreeing fallback and slogan expiry after 48 hours. Cross-origin social widgets can fail without exposing an inspectable error, so a readable archive control and original link remain available. VK requires an export hash; the refreshed records have none. The configured Telegram address is a personal account, not a public channel feed.

The manifest/source-backed guide omissions were reported in [Formal AI issue 1455](https://github.com/link-assistant/formal-ai/issues/1455). It is an upstream documentation report, not a required sub-issue or a dependency for completing this website change.
