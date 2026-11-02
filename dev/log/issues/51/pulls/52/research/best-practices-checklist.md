# hive-mind CI-CD-BEST-PRACTICES.md checklist (issue #51)

Source: `gh api repos/link-assistant/hive-mind/contents/docs/CI-CD-BEST-PRACTICES.md --jq .content | base64 -d`
(571 lines, fetched 2026-11-02). GP = `.github/workflows/github-pages.yml`.

| § | Practice | Applies | Follows | Evidence |
| - | -------- | ------- | ------- | -------- |
| 0 | Pin hosted runner OS, no `ubuntu-latest` | yes | yes | all jobs `ubuntu-24.04`; webkit `macos-15-intel`; no `latest` in GP |
| 1 | Run checks only on relevant changes (`detect-changes` job + outputs) | yes | yes, one gap | `prepare` (GP:26-55) runs `scripts/ci-changes.mjs`; outputs `code`/`docs` (GP:35-37); `.md`, `docs/`, `dev/`, `.gitkeep` excluded from code (`ci-changes.mjs:6`). Gap: on `schedule` both outputs are `false` (`ci-changes.mjs:30`), so the weekly run skips the link check (see template-comparison.md gap A) |
| 2 | File size limit 1000-1500, synced with ESLint `max-lines` | yes | yes | `scripts/check-file-line-limits.sh:8-9` `LIMIT=1500`, `WARN_THRESHOLD=1350`; `eslint.config.js:22` `'max-lines': ['error', { max: 1500, ...}]`; CI GP:105-106 |
| 3 | Automated formatting (ESLint + Prettier; Ruff for Python) | yes | yes | `package.json:28` `prettier --check .`; GP:102-103; `ruff format --check .` GP:402 and `.husky/pre-commit:8` |
| 4 | Static analysis (ESLint strict; Ruff + mypy) | yes | yes (mypy n/a) | `package.json:26` `--max-warnings=0`; `ruff check .` GP:401; Python here is only `experiments/` and `scripts/` helpers, so mypy is not warranted |
| 5 | Fast-fail ordering, slow jobs gated on fast ones | yes | yes | `test` needs `[prepare, lint-workflows, checks, network-browsers]` (GP:119); `network-browsers` needs `[prepare, lint-workflows, checks, tooling]` (GP:169) |
| 6 | Changeset-based versioning | no (no package release) | n/a | - |
| 7 | Validate the actual merge result | yes | yes | checkout of the PR merge ref (GP:39 "Checkout the merge result"), and `ci-changes.mjs:21-24` refuses a stale preview: `The PR merge preview is behind ${branch}. Merge the latest base into the PR and rerun checks.` |
| 8 | Pre-commit hooks: format, lint, types, file size, secrets | yes | yes | `.husky/pre-commit`: `npx lint-staged` (ESLint --fix --max-warnings=0 + Prettier, `package.json:80-88`), `check:file-size`, `check:secrets`, `check-python.py`, `ruff check`, `ruff format --check`, shellcheck |
| 9 | Release automation, OIDC publishing, version bump commit | no (static site; Pages deploy uses OIDC `id-token: write`, GP:351-354) | n/a | - |
| 10 | Concurrency: per-job cancellable read-only groups; one repo-wide `main-writer` group with `cancel-in-progress: false`; no workflow-level cancellable concurrency; `!cancelled()` not `always()` | yes | yes | job groups `check-${{ github.workflow }}-${{ github.ref }}-<job>` (e.g. GP:28, matrix GP:167); deploy GP:340-342 `main-writer-${{ github.repository }}-main`, `cancel-in-progress: false`; `src/workflow.test.js:127` asserts no workflow-level concurrency; `!cancelled()` at GP:345, 499; no `always()` in GP. Push/rebase-retry: n/a (deploy-pages does not push to git) |
| 11 | Secrets detection in CI | yes | yes | `package.json:33` secretlint; GP:108-109; `.secretlintrc.json` preset-recommend |
| 12 | Documentation validation (required sections, links via lychee) | yes | partial | `scripts/check-docs.mjs` (GP:438-439); lychee on `README.md` with `fail: true` (GP:447-451). Gap: not run on the weekly schedule (gap A) |
| 13 | Container images on native runners | no (no image) | n/a | - |
| 14 | Lint workflows: actionlint Docker image + zizmor annotations, confidence floor, scoped suppressions | yes | yes | actionlint by digest (GP:58-74); zizmor `annotations: true`, `advanced-security: false`, `min-confidence: low` (GP:405-416) + pedantic high/high pass (GP:417-422); `.github/zizmor.yml` suppression scoped to `github-pages.yml` with a removal condition |
| 15 | Audit the dependency tree: `--package-lock-only`, on a schedule, explicit level | yes | yes | GP:113 `npm audit --package-lock-only --audit-level=moderate`; `checks` has no `if:` so it runs on the weekly cron (GP:11-12) |
| 16 | Prove you can publish before you build (preflight) | partially (Pages, not a registry) | yes | `prepare` runs `scripts/check-pages.mjs` with `REQUIRE_PAGES` true off-PR (GP:51-55) before any build; post-deploy anonymous verification `scripts/check-deployed-site.sh` (GP:371-374) |
| 17 | Tell a broken pipeline from a changed world (warn on push for external state, skip reasons as `::notice::`, defaults for dispatch inputs, logs where upload looks) | yes | yes | skip reason notice `ci-changes.mjs:34-36` (`::notice::Skipping browser/build/PDF jobs ...`); `workflow_dispatch` has no inputs; network-browser evidence steps guarded by `steps.browser.outcome == 'success'` |

## Summary

All applicable practices are followed. The only applicable deviation is
§1/§12: the scheduled run cannot see link rot because `ci-changes.mjs` reports
`docs=false` on `schedule`. Release-related practices (§6, §9, §13 and the
registry parts of §16) do not apply to a GitHub Pages site.
