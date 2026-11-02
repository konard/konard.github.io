# CI/CD comparison with the JS and Python pipeline templates (issue #51)

Template snapshots (shallow clones, file trees in `tree-js-template.txt` and
`tree-python-template.txt`):

- JS: `link-foundation/js-ai-driven-development-pipeline-template` @ `c2463c74` (2026-11-02)
- Python: `link-foundation/python-ai-driven-development-pipeline-template` @ `67cfe05f` (2026-11-02)

This repository is a Vite/React static site deployed to GitHub Pages. It has
no npm or PyPI release, no versioning, no changesets and no container image.
The earlier mapping of every template script to its local equivalent is in
`dev/log/issues/31/pulls/32/TEMPLATE-COMPARISON.md`. This file only records the
state at the template snapshot above and the gaps that remain.

All local line numbers refer to `.github/workflows/github-pages.yml` (GP)
unless another file is named.

## Gap table

| # | Template practice (where) | This repo | Applies here | Recommendation |
| - | ------------------------- | --------- | ------------ | -------------- |
| 1 | Top-level `permissions: contents: read`, jobs escalate (all template workflows) | yes: GP:14-15; deploy escalates `pages: write`, `id-token: write` (GP:351-354); `src/workflow.test.js:92` enforces it | yes | none |
| 2 | `GIT_CONFIG_COUNT/KEY_0/VALUE_0` = `init.defaultBranch main` (py `workflows.yml:25-28`) | yes: GP:19-23 | yes | none |
| 3 | Pinned runner OS, no `*-latest` (all) | yes: `ubuntu-24.04`, `macos-15-intel`; `grep latest` finds nothing in GP | yes | none |
| 4 | Per-job `concurrency` with job suffix + `cancel-in-progress: true` for read-only jobs; `main-writer-${{ github.repository }}-main` + `cancel-in-progress: false` for writers | yes: every job, e.g. GP:27-29, matrix suffix GP:167; writer GP:340-342; `src/workflow.test.js:127-129` | yes | none |
| 5 | `timeout-minutes` on every job | yes: e.g. GP:31, matrix-driven GP:172; enforced by `src/workflow.test.js:83` | yes | none |
| 6 | `persist-credentials: false` on checkout | yes: every checkout; enforced by `src/workflow.test.js:114-120` | yes | none |
| 7 | Change detection job gating slow jobs (js `detect-code-changes.mjs`, py `detect_code_changes.py`) | yes: `prepare` + `scripts/ci-changes.mjs:5-8`, outputs `code`/`docs` (GP:35-37); skip notice `ci-changes.mjs:34-36` | yes | see gap #A below (schedule) |
| 8 | Fresh-merge simulation (`simulate-fresh-merge.sh`) | yes (different form): `scripts/ci-changes.mjs:14-24` fails when the PR merge preview is behind base (`The PR merge preview is behind ...`) | yes | none |
| 9 | actionlint by Docker digest (`workflows.yml`) | yes: GP:58-74, digest `sha256:b1934ee5...` (v1.7.12), `args: -color` | yes | none |
| 10 | zizmor action + pedantic high/high pass (js `workflows.yml:139-169`, py `workflows.yml:95-121`) | yes, newer: `zizmor-action@v0.8.0` / `version: 1.31.1`, `min-confidence: low` (GP:405-416); pedantic pass GP:417-422 | yes | none (templates are behind, see template-issues-candidates.md B) |
| 11 | `.github/zizmor.yml` policy (ref-pin first-party, hash-pin others) | yes: `.github/zizmor.yml`; self-repository ignore scoped to `github-pages.yml` with removal condition ("Remove when rhysd/actionlint#711 / #732 are released") | yes | none |
| 12 | ShellCheck over tracked `*.sh` and `.husky/*` (js `workflows.yml:85`) | yes: GP:403-404 and `.husky/pre-commit:9` | yes | none |
| 13 | `.gitattributes` forcing LF on `*.sh` and `.husky/**` (js and py `.gitattributes`) | **no**: file absent | yes (hooks and `*.sh` are executed and shellchecked; a CRLF checkout on Windows breaks `#!/bin/sh` hooks) | add `.gitattributes` with `*.sh text eol=lf` and `.husky/** text eol=lf` (low) |
| 14 | Status-gate coverage check (js `check-status-gate-covers-all-jobs.mjs`) | yes: `src/workflow.test.js:159-161` asserts `pipeline-status.needs` == every other job | yes | none |
| 15 | Terminal `pipeline-status` with `!cancelled()` + `NEEDS_JSON` (all) | yes: GP:495-521, `if: ${{ !cancelled() }}` (GP:499) | yes | none |
| 16 | CodeQL incl. `actions` language + SARIF result gate (js/py `security.yml`, `check-codeql-results`) | yes: GP:453-493, languages `[javascript-typescript, python, actions]`, `build-mode: none`, `CODEQL_ACTION_DIFF_INFORMED_QUERIES: 'false'`, `scripts/check-codeql-results.mjs` | yes | none |
| 17 | `npm audit --package-lock-only` on a schedule (js `security.yml:144`, `--audit-level=high`; cron `0 6 * * 1`) | yes, stricter: GP:113 `--audit-level=moderate`; `checks` runs on every event including the weekly cron GP:11-12 | yes | none |
| 18 | `dependency-review-action@v5` on PRs + dependency-graph check (js `security.yml:72-120`) | **no** | partially (one lockfile, npm audit already covers existing deps on every run; dependency-review adds license and PR-diff review only) | optional; not required to close #51 (low) |
| 19 | Lychee with cache (`links.yml`) | yes: docs job GP:424-451, `actions/cache@v6` (template still on v5), `lychee.toml` (`cache = true`, `max_cache_age = "1d"`) | yes | see gaps #A and #B |
| 20 | Lychee transient recheck + Web Archive fallback (js `recheck-broken-links.mjs`, `check-web-archive.mjs`) | no (deliberate): `lychee.toml` `max_retries = 3`; rationale in issue-31 TEMPLATE-COMPARISON.md line 45/72 | no (one README; archive hints do not prove availability) | none |
| 21 | `.lycheeignore` | equivalent: `lychee.toml` `exclude = [...x.com, vk.com...]` | yes | none |
| 22 | Required-docs check (`check-required-docs.sh`) | yes: `scripts/check-docs.mjs` (GP:438-439) | yes | none |
| 23 | File-size limit synced with ESLint (`check-file-line-limits.sh`, `max-lines`) | yes: `scripts/check-file-line-limits.sh:8-9` (1500, warn 1350), `eslint.config.js:22` `max: 1500` | yes | none |
| 24 | ESLint `--max-warnings=0`, Prettier check | yes: `package.json:26`, `:28`; GP:99-103 | yes | none |
| 25 | secretlint in CI and pre-commit | yes: `package.json:33`, GP:108-109, `.husky/pre-commit:4` | yes | none |
| 26 | husky + lint-staged pre-commit (js) / pre-commit + ruff (py) | yes: `.husky/pre-commit` runs lint-staged, file size, secrets, Python check, `ruff check`, `ruff format --check`, shellcheck | yes | none |
| 27 | Ruff config (py `.ruff.toml`) | yes: `.ruff.toml` (py310, 120, `E4,E7,E9,F`); CI GP:398-402 with pinned `ruff==0.17.3` | yes | none |
| 28 | Artifact transport action + round-trip regression job (js `artifact-transport`, py `artifact-roundtrip` job `workflows.yml:139-217`) | partial: `.github/actions/upload-artifact` (upload only) tested by `src/artifact-retry.test.js`; real upload on every PR (GP:157 comment) | partially (no download path to round-trip) | none |
| 29 | jscpd duplication check (js `.jscpd.json`) | no | optional | not needed for #51 |
| 30 | Release preflight / changesets / version check / publish (js and py `release.yml`, `.changeset/`, `changelog.d/`) | no | **no** (no package release). The Pages analogue exists: `scripts/check-pages.mjs` with `REQUIRE_PAGES` on non-PR events (GP:51-55) and post-deploy `scripts/check-deployed-site.sh` (GP:371-374) | none |
| 31 | Docker multi-arch, Docker Hub publish (js `publish-dockerhub`, `setup-buildx-resilient`) | no | no (no image) | none |
| 32 | Scheduled link check (neither template has one: `links.yml` has no `schedule:`) | **no**: see gap #A | yes | see gap #A |

## Concrete gaps that apply here

### A. The weekly scheduled run never checks links (false negative for link rot)

`GP:11-12` schedules the pipeline weekly (`- cron: '0 6 * * 1'`), but
`scripts/ci-changes.mjs:30`:

```js
const result = classifyChanges(files, kind === 'workflow_dispatch' || (!base && kind !== 'schedule'));
```

For `schedule` there is no `base`, so `files` is `[]` and `force` is `false`;
both `code` and `docs` are `false`. The `docs` job is gated on
`if: needs.prepare.outputs.docs == 'true'` (GP:429), so lychee never runs on
the schedule. A README link that rots is only noticed when someone next edits
Markdown/HTML. hive-mind CI-CD-BEST-PRACTICES §12 asks for broken-link checks
and §15/§17 make the point that only a scheduled run can see changes in the
outside world.

Recommendation: on `schedule`, force `docs=true` (keep `code=false` so browser
jobs and deploy stay skipped), e.g. `docs: force || kind === 'schedule' || ...`,
and add a unit test next to the existing `classifyChanges` tests in `src/ci-policy.test.js`.

### B. Lychee cache age vs. cache key (warning, low)

`lychee.toml` sets `max_cache_age = "1d"` while the docs job restores the cache
by `restore-keys: lychee-${{ runner.os }}-` (GP:444-446). Any restore older
than a day is thrown away with
`[WARN] Cache is too old (age: ..., max age: 1d ...). Discarding and recreating.`
(the same warning appears in both templates' runs: js run 41352284642 log line
293, py run 41351625406 log line 294). It is harmless but is log noise; if gap
#A is fixed, a weekly run will always print it. Either accept it or raise
`max_cache_age` (e.g. `"7d"` with a note that only successful responses are
cached).

### C. No `.gitattributes` for executable hooks and scripts (low)

Both templates ship:

```
*.sh text eol=lf
.husky/** text eol=lf
```

This repo has no `.gitattributes`, while `.husky/pre-commit` (`#!/bin/sh`) and
`scripts/*.sh` are executed and shellchecked.

### D. No dependency-review on pull requests (optional, low)

The JS template runs `actions/dependency-review-action@v5` with
`fail-on-severity: high` (js `security.yml:98-120`). Here `npm audit
--package-lock-only --audit-level=moderate` (GP:113) runs on every event
including the weekly cron, which already covers the advisory part. Only
license policy and PR-diff summaries would be added.

## Not gaps (checked)

- `pull_request` without `types:` (GP:7-9): the default types are
  `opened, synchronize, reopened`, the same list the templates spell out.
- `setup-node` caching: `cache: npm` is set where `npm ci` runs (GP:95, 135,
  211, 512); `prepare` does not install dependencies.
- Action versions are at or above template versions: checkout@v7,
  setup-node@v7, setup-python@v7, cache@v6 (templates: v5), zizmor-action
  v0.8.0 / zizmor 1.31.1 (templates: v0.6.4 / 1.30.1), deploy-pages@v5,
  codeql-action@v4, lychee-action@v2.
