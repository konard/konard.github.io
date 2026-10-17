# Issue #3 / PR #4 — CI/CD false positives, false negatives, warnings and errors

Issue: https://github.com/konard/konard.github.io/issues/3 — PR: https://github.com/konard/konard.github.io/pull/4

## Collected data

| File | Content |
| --- | --- |
| `data/issue-3.json` | Issue text and comments (none) |
| `data/main-runs.json` | Recent `main` runs |
| `ci-logs/run-39021305360.log` | Last "Deploy to GitHub Pages" run on `main` (`3d4aa8d`), the baseline |
| `ci-logs/run-39021305509.log` | Last "pages build and deployment" run (GitHub's own Pages build) |
| `data/template-file-tree.txt` | Full file tree (and commit) of `link-foundation/js-ai-driven-development-pipeline-template` used for comparison |
| `data/CI-CD-BEST-PRACTICES.md` | Snapshot of hive-mind's CI/CD best practices |
| `data/npm-install-after.log` | `npm install` output after the migration (0 vulnerabilities, no deprecations) |

## What the green baseline run actually hid

Both `main` runs were green, but the logs of run 39021305360 contain:

1. `##[warning]Node.js 20 is deprecated … actions/checkout@v4, actions/setup-node@v4` (both jobs).
2. 48 `npm warn deprecated` lines (eslint@8, glob@7, rimraf@3, svgo@1, workbox, babel proposal plugins, …) — all from `react-scripts@5.0.1`.
3. `107 vulnerabilities (6 low, 20 moderate, 77 high, 4 critical)` — never failed the build (false negative: no audit gate).
4. `Browserslist: browsers data (caniuse-lite) is 21 months old` (printed twice by the CRA build).
5. `[DEP0040] punycode` / `[DEP0169] url.parse()` deprecation warnings from setup-node on old action versions.
6. `hint: Using 'master' as the name for the initial branch` from `git init` inside actions/checkout.
7. No lint, formatting, file-size, secret or workflow-lint gates at all (false negatives).
8. The workflow-level `cancel-in-progress: true` could cancel a running deploy on `main` when a newer push arrived (lost deploy).
9. The deploy job rebuilt the site instead of publishing the artifact the tests verified, and failed if `main` moved before `git push`.
10. Old `ci-logs/github-pages-38958801553.log`: a PR #2 branch run that "failed because of a workflow file issue" (GitHub gives no detail in the log; that run predates the merged workflow). Workflow files were never linted before they ran; actionlint now does it.

The root cause of 2–5 is Create React App: `react-scripts` is deprecated (React team, Feb 2025: https://react.dev/blog/2025/02/14/sunsetting-create-react-app) and its dependency tree cannot be made audit-clean with overrides.

## Requirements and how they were addressed

| # | Requirement | Solution |
| --- | --- | --- |
| R1 | Find and fix all CI/CD warnings | Actions bumped to Node 24 majors (`checkout@v6`, `setup-node@v6`, `upload-artifact@v7`, `download-artifact@v8`), Node 24 runtime, CRA replaced with Vite 8 + Vitest 5 (removes deprecations, Browserslist and punycode warnings), `init.defaultBranch` set via `GIT_CONFIG_*` env (template practice) |
| R2 | Find and fix errors | 107 vulnerabilities → 0 (`npm audit`); deploy push now rebases and retries |
| R3 | Find and fix false negatives | New gates: ESLint (`--max-warnings=0`), Prettier check, 1500-line file limit (warn at 1350), secretlint, `npm audit --audit-level=moderate`, actionlint (with shellcheck); workflow policy tests in `src/workflow.test.js` |
| R4 | Find and fix false positives | Deploy now publishes the tested artifact (previously a green test of build A then deploy of rebuild B); `App.css` (1387 lines) split so the file-size gate is clean, not just under the limit |
| R5 | Compare all files with the JS template and reuse its best practices | See comparison below |
| R6 | Follow hive-mind CI/CD best practices | Mapping below |
| R7 | Report issues found in the template too | No issue present here was also present in the template (it already uses Node 24 actions, `persist-credentials: false`, actionlint, audit, etc.), so nothing was reported |
| R8 | Everything in this single PR | Done in PR #4 |

## Template comparison (applicable vs. not applicable)

Applied: `.github/workflows/*` patterns (least-privilege `permissions`, `timeout-minutes` everywhere, `persist-credentials: false`, digest-pinned actionlint, `GIT_CONFIG_*` env, PR-only cancellation), `eslint.config.js` (flat config, `max-lines`), `.prettierrc`/`.prettierignore`, `.secretlintrc.json`, `.husky/pre-commit` + `lint-staged`, `scripts/check-file-line-limits.sh` (adapted).

Not applicable to a private, unpublished personal site: changesets, `release.yml`, npm publishing/`setup-npm`, Docker/buildx actions, version checks, release notes formatting, Deno/Bun matrix, CodeQL/zizmor workflows (zizmor is redundant with the policy tests for a single workflow; can be added later), lychee link checking (would flag external profile links as flaky).

## Best practices mapping (hive-mind CI-CD-BEST-PRACTICES.md)

1 relevant file changes — `paths-ignore: docs/**, dev/**`. 2 file size — `check:file-size`. 3 formatting — Prettier. 4 linting — ESLint. 5 fast-fail ordering — `lint-workflows` + `checks` before `test` → `deploy`. 6 changesets — n/a (no releases). 7 merge result — `pull_request` checkout is the merge commit. 8 pre-commit — husky + lint-staged. 9 release automation — the deploy job. 10 concurrency — PR cancellation only. 11 secrets — secretlint. 12 docs — README updated. 13 containers — n/a. 14 workflow lint — actionlint. 15 dependency audit — `npm audit`. 16/17 — n/a (no publishing).

## Alternatives considered

- Keep CRA and add `overrides`: cannot fix `react-scripts` internals (webpack-dev-server, svgo@1, jest 27) without breaking it.
- Next.js static export / Rsbuild: heavier change; Vite is what react.dev recommends for SPAs and what the template's example app uses.
- `actions/deploy-pages` instead of committing to `docs/`: needs the repository Pages source switched to "GitHub Actions" (a settings change) and would drop the served `docs/case-studies`; kept the existing model.

## Verification

Local: `npm run check` (lint, format, file size, secrets) pass, `npm run test:ci` 34/34 pass, `npm run build` passes with byte-identical CSS output, `npm audit` 0 vulnerabilities, actionlint 1.7.12 clean. CI results are in PR #4.
