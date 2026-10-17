# Issue #5 / PR #6 — GitHub Pages deploys from Actions, yet konard.github.io is empty

Issue: https://github.com/konard/konard.github.io/issues/5 — PR: https://github.com/konard/konard.github.io/pull/6

## Collected data

| File | Content |
| --- | --- |
| `data/issue-5.json` | Issue text (only a title) and comments (none) |
| `data/pages-api.json` | `GET /repos/konard/konard.github.io/pages` |
| `data/pages-builds.json` | The last three Pages builds |
| `data/deployments.json` | Every deployment to the `github-pages` environment |
| `data/github-pages-branch-policies.json` | Branches allowed to deploy to `github-pages` (only `main`) |
| `data/site-before-headers.txt`, `data/site-before-status.txt` | What https://konard.github.io served before the fix |
| `ci-logs/run-39029889455-main-before.log` | Last "Deploy to GitHub Pages" run on `main` (`dbbf97e`), green |
| `ci-logs/run-39021305509-pages-build-deployment.log` | The last real Pages deployment (`3d4aa8d`), made by GitHub's built-in Jekyll build |

## Symptoms

- `https://konard.github.io/` returns `HTTP/2 404` ("Page not found · GitHub Pages"), and so do `/index.html` and `/assets/index-OgCrp1wx.js`.
- `https://konard.github.io/case-studies/issue-1/` returns 200, so something was deployed, just not the app.
- Every "Deploy to GitHub Pages" run on `main` is green, including the `deploy` job of run 39029889455. It pushed commit `2c4189d` "Deploy build to docs [skip ci]" with the Vite build in `docs/`.

## Root cause

1. **The Pages source is "GitHub Actions".** `data/pages-api.json` reports `"build_type": "workflow"`. In that mode, GitHub Pages ignores the `source` branch and folder (`main` / `/docs`, a leftover of the old setting). It publishes only an artifact that a workflow deploys with `actions/deploy-pages`. Pushes to `docs/` no longer start the built-in `pages-build-deployment` workflow.
2. **The workflow never deploys to Pages.** The `deploy` job still did what the "Deploy from a branch" mode needs: copy `build/` into `docs/`, commit and push. It never called `actions/deploy-pages`, so in "GitHub Actions" mode the build went into the repository and never reached the site.
3. **What is live is an old Jekyll build of `docs/`.** The only deployment of the current site (`data/deployments.json`, 2026-10-17 09:29, commit `3d4aa8d`) was made by `pages-build-deployment` while the source was still the `/docs` branch folder. At `3d4aa8d`, `docs/` held only `case-studies/` (`git ls-tree 3d4aa8d docs/`). The log shows Jekyll writing only `case-studies/issue-1/index.html`, two other case-study pages and `assets/css/style.css`, so `/` has no `index.html`, which gives the 404. The source was switched to "GitHub Actions" after that. The Vite build that PR #4 committed to `docs/` at `2c4189d` was never deployed.
4. **Why CI stayed green (false negative).** The deploy job counted "pushed a commit" as success, and nothing checked what the site actually served.

## Requirements

| # | Requirement | Source |
| --- | --- | --- |
| R1 | https://konard.github.io must serve the site when Pages is set to deploy from GitHub Actions. | Issue title |
| R2 | A deploy that leaves the site empty must fail CI instead of looking green. | Root cause 4; the CI/CD practice from issue #3 that green must mean working |
| R3 | Keep the existing guarantees: the tested build is published (no rebuild), PRs run everything except the deploy, `main` deploys are not cancelled, least-privilege permissions, Node 24 actions. | `src/workflow.test.js`, PR #4 |
| R4 | Do not leave misleading stale build output in `docs/`; keep `docs/case-studies`. | Root cause 3 |

## Solution

- `test` job: after `npm run build`, `actions/upload-pages-artifact@v5` (which uses `upload-artifact@v7`, Node 24) uploads `build/` as the `github-pages` artifact. Pull requests upload it too, so a broken artifact fails before the merge.
- `deploy` job (only `main`, after `test`): it uses the `github-pages` environment (only `main` may deploy to it), with `pages: write` and `id-token: write` and read-only contents, and runs `actions/deploy-pages@v5`. It no longer commits, so it needs no `contents: write` and keeps no Git credentials.
- `scripts/check-deployed-site.sh <url>` runs after the deployment. It fetches the page with a cache-busting query, requires the React root `<div id="root"></div>` and a `/assets/index-*.js` script, and requires that script to load. It retries 6 times, 10 seconds apart, while the CDN updates, then fails the run.
- The stale Vite and CRA build files are removed from `docs/`; only `docs/case-studies` is left.
- `src/workflow.test.js` checks the Pages artifact upload, `deploy-pages` with the environment and permissions, that nothing commits a build, the post-deploy check, and that `docs/` holds no site build. The Node 24 minimums include the two Pages actions.

## Alternatives considered

| Option | Decision |
| --- | --- |
| Switch Pages back to "Deploy from a branch" (`main` `/docs`) and keep committing the build. | Rejected. The repository owner chose "GitHub Actions" (issue title), and committing build output means bot commits on `main`, `contents: write`, push retries and a large diff on every deploy. |
| Keep both: commit to `docs/` and also deploy with `deploy-pages`. | Rejected. That duplicates the output and keeps `contents: write` for nothing. |
| Also run `actions/jekyll-build-pages` on `docs/` to keep `/case-studies/issue-1/` online. | Rejected. That page appeared only because the app was missing (root cause 3), and it was never meant to be part of the site. The case study stays readable on GitHub at [`docs/case-studies/issue-1`](../../../../../../docs/case-studies/issue-1/README.md). Adding Jekyll would cost a Docker image pull and extra warnings on every run. |
| `actions/configure-pages`. | Not needed. The site is served from the root and Vite uses `base: '/'`, so there is no base path to read. Pages is already enabled. |

## Verification

- `experiments/test-check-deployed-site.sh`: the check script accepts a locally served `build/` and rejects a server with only `docs/` (what the live site served).
- `scripts/check-deployed-site.sh https://konard.github.io 1 0` against the live site before the merge fails with `curl: (22) … 404`. This is the bug reproduced.
- With the old workflow, the new `src/workflow.test.js` tests fail (5 failures). With the new workflow, all 38 tests pass.
- `npm run check`, `npm run test:ci`, `npm run build`, `npm audit` and actionlint 1.7.12 all pass locally.
- The `deploy` job can only run on `main`: the `github-pages` environment only allows `main`. So the first real deployment and its live check happen when this PR is merged.
