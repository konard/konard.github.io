# Issue 51 / PR 52: false positives, false negatives, warnings and errors in CI/CD

- Issue: https://github.com/konard/konard.github.io/issues/51 ([`issue.json`](issue.json), no comments: [`issue-comments.json`](issue-comments.json))
- Pull request: https://github.com/konard/konard.github.io/pull/52 ([`pr.json`](pr.json), no comments or reviews at the start)
- The failing run on `main`: [41480863205](https://github.com/konard/konard.github.io/actions/runs/41480863205), commit `5f7f468`.
  Full log: [`ci-logs/github-pages-41480863205.log`](ci-logs/github-pages-41480863205.log) (14741 lines), jobs: [`ci-logs/github-pages-41480863205.json`](ci-logs/github-pages-41480863205.json)
- Unit-test console output before the fixes: [`ci-logs/local-vitest-before.log`](ci-logs/local-vitest-before.log) (`npx vitest run --silent=false`)
- Template comparison and best-practice audit: [`research/`](research/)

## 1. Requirements

1. Fix the failing "Deploy to GitHub Pages" run 41480863205 on `main`.
2. Find every false positive, false negative, warning and error in CI/CD, not only that failure, and fix them all.
3. Compare every CI/CD file with the JS and Python pipeline templates (full file trees) and reuse their best practices.
4. Where a template has the same problem, report an issue in that template.
5. Follow https://github.com/link-assistant/hive-mind/blob/main/docs/CI-CD-BEST-PRACTICES.md.
6. Collect the data here, analyse it in depth, look for existing components, apply every fix wherever the problem occurs, all in this PR.

## 2. What the failing run shows

Every job but `deploy` passed. Log lines (from the file above):

```
14422 deploy  Deploy to GitHub Pages  (node:1975) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
14432 deploy  Deploy to GitHub Pages  ##[error]Creating Pages deployment failed
14439 deploy  Deploy to GitHub Pages  ##[error]Error: Failed to create deployment (status: 500) with build version
              5f7f468bef7af0fbb6a0074123743cbcb3e6b1e8. Request ID AA00:25F91:3BD2504:C7A75DA:6AE8C100 Server error, is githubstatus...
14724 pipeline-status  Pipeline failed: deploy: failure
```

and four times, in `test` and in each `network-browsers` build:

```
 8230 network-browsers (firefox)  Build the editor  (!) Some chunks are larger than 500 kB after minification.
14077 test                        Build the React app (!) Some chunks are larger than 500 kB after minification.
```

The "Run tests" step also printed 21 stderr blocks holding 206 React "not wrapped in act(...)" warnings (also
in `ci-logs/local-vitest-before.log`), 8 jsdom "Not implemented: Window's getComputedStyle() method: with pseudo-elements"
errors (line 13978), a `::notice::` line produced by a unit test (line 13947), and retry messages from the artifact tests.

## 3. Root causes and fixes

| # | Finding | Kind | Root cause | Fix | Verification |
| - | ------- | ---- | ---------- | --- | ------------ |
| 1 | `deploy` failed on main | error | One HTTP 500 from `POST /repos/{repo}/pages/deployments`. `actions/deploy-pages@v5` does not retry the creation of a deployment (only the status polling tolerates errors), so a transient server error fails the whole pipeline although the site, the tests and the artifact were fine | `.github/actions/deploy-pages` + `scripts/deploy-pages.mjs`: the same REST protocol (OIDC token, create, poll, cancel), with bounded retries of 429/5xx/network failures only; on a retry it first looks up the deployment of the same commit and adopts it, so a lost response can never publish twice; a deployment it abandons (timeout, cancelled job) is cancelled. The test job now outputs the ID of the artifact it uploaded and the deploy job publishes exactly that one | `src/deploy-pages.test.js` (500 then success, permanent 400/401/403/404/422, exhaustion, adoption, failed earlier deployment, every final state, poll error limit, timeout, missing artifact ID, OIDC, error annotation); `src/workflow.test.js` |
| 2 | `[DEP0040] punycode` deprecation in `deploy` | warning | Bundled in deploy-pages v5 (actions/deploy-pages#413, #434, still open) | The local action has no npm dependencies, only `fetch` | No `punycode` in `scripts/deploy-pages.mjs`; next main run |
| 3 | "Some chunks are larger than 500 kB" in 4 builds | warning | React was part of the shared layout chunk (`Layout-*.js` 507.47 kB, log line 14077 area) | `build.rolldownOptions.output.codeSplitting.groups`: React gets its own cacheable chunk (Layout 288 kB, react 219 kB, RepoList 474 kB) | Local build has no warning |
| 4 | The chunk warning could return unnoticed | false negative | Vite's reporter only warns, and the warning does not reach `onLog`, so it cannot be escalated | `chunkBudget()` plugin in `vite.config.js` fails the build above the same 500 kB limit | `src/chunk-budget.test.js`; `experiments/issue-51/chunk-budget.mjs` builds the real site with 500 kB (passes) and 200 kB (fails naming the chunks) |
| 5 | The weekly run never checked links | false negative | `ci-changes.mjs` reported `docs=false` on `schedule`, so link rot in unchanged Markdown was only found by the next docs edit | `checksForEvent()`: the schedule checks docs (`docs=true`) without rebuilding the site | `src/ci-policy.test.js` |
| 6 | Lychee "Cache is too old" warning (seen in both templates; latent here once #5 runs weekly) | warning | The cache key was per commit with a prefix `restore-keys`, so a cache of any age was restored while `lychee.toml` keeps results for one day | The key and the restore key include the UTC day, so only a cache saved the same day is restored | `src/workflow.test.js` |
| 7 | `pipeline-status` printed its failure as plain stderr | error reporting | `console.error(message)` makes no annotation; the run summary only showed "exit code 1" | One `::error::` annotation with the reason | `src/ci-policy.test.js` |
| 8 | Unit tests printed a `::notice::` and retry messages into the CI log | noise | `pipelineFailures` and `uploadWithRetry` logged with `console.log` | Both take a `log` function; the tests pass a mock and assert on it | `src/ci-policy.test.js`, `src/artifact-retry.test.js` |
| 9 | 206 `act()` warnings and 8 jsdom errors in "Run tests" | warning | Tests changed shared stores (language, settings) or blurred a slider while components were mounted, or finished before the Habr card fell back to its snapshot; `pdfChecks` called jsdom's unimplemented pseudo-element `getComputedStyle` | Those calls run inside `act()`, the App tests wait for the snapshot, the PDF check test answers pseudo-element styles like a browser; `src/setupTests.js` fails any test that prints `console.error`/`console.warn` | Full suite prints no stderr (section 4) |
| 10 | No `.gitattributes` (both templates have one) | latent | Hooks and shell scripts could be checked out with CRLF on Windows | `*.sh text eol=lf`, `.husky/** text eol=lf` | `src/workflow.test.js` |
| 11 | No dependency review on PRs (the JS template has one) | false negative | `npm audit` sees only the lockfile, not the actions a PR adds | `actions/dependency-review-action@v5` step in `checks` on pull requests (the dependency graph is enabled: the compare API answers for this PR) | `src/workflow.test.js` |

Checked and left as they are:

- `##[notice]Summary report available` from lychee-action: an informational link to the job summary.
- Vitest's "jsdom was created 101 times" hint: a performance hint, not a warning about correctness.
- `::debug::` lines of `@actions/artifact` in `src/artifact-retry.test.js`: debug commands are hidden unless step debugging is on.
- The "Graph Update: pip in /dev/log/issues/31/pulls/32/templates/python" run in the issue table succeeded; it is GitHub's
  automatic dependency submission indexing an archived template. Dependabot alerts are disabled for this repository
  (`gh api .../dependabot/alerts` answers 403), so it raises no false alerts.
- "pages build and deployment" (run 39021305509) is the legacy Pages build of commit `3d4aa8d`, from before the site
  moved to Actions deployment; it succeeded and no longer runs.

## 4. Test output

`npx vitest run --silent=false`:

| | Before | After |
| --- | --- | --- |
| Log | [`local-vitest-before.log`](ci-logs/local-vitest-before.log) | [`local-vitest-after.log`](ci-logs/local-vitest-after.log) |
| Test files / tests | 101 / 1208 passed | 103 / 1235 passed |
| `stderr` blocks | 21 | 0 |
| "not wrapped in act(...)" | 206 | 0 |
| jsdom "Not implemented" | 8 (in CI) | 0 |
| Remaining output | | 5 `::debug::` lines of `@actions/artifact`, hidden by GitHub unless step debugging is on |

No component had a bug: every warning came from a test changing shared state outside `act()`, or ending before a
pending update. The new guard in `src/setupTests.js` was checked against the old tests: 13 tests failed with it before
the fixes. A test that expects a warning installs its own console spy, which bypasses the guard (`Sound-load.test.jsx`).

Commits:

| Commit | Change |
| --- | --- |
| `178099a` | React in its own chunk (finding 3) |
| `3d94f78` | Deploy with bounded retries (findings 1, 2) |
| `4c0c440` | Weekly link check (finding 5) |
| `7a446a7` | pipeline-status annotation, injected logs (findings 7, 8) |
| `4e55a72` | Chunk budget (finding 4) |
| `58263da` | Day-scoped lychee cache (finding 6) |
| `0468e61` | Dependency review, `.gitattributes` (findings 10, 11) |
| `1e735d8` | `act()` and jsdom warnings, console guard (finding 9) |

## 5. Existing components considered

- `actions/deploy-pages@v5`: the official action. Its source (`src/internal/deployment.js`) creates the deployment once and
  throws on any error; an older report of 5xx failures (actions/deploy-pages#193) is closed, and v5 still makes a single creation request. Wrapping
  it in a retry action (for example `nick-fields/retry` or `Wandalen/wretry.action`) would rerun the whole action,
  including a second creation after a lost response, and needs a third-party action with shell access. Rerunning the job
  manually works but keeps main red until someone notices.
- `@octokit/plugin-retry`: retries 5xx, but would add npm dependencies to the deploy job and still not adopt a deployment
  whose response was lost.
- The local action reuses `scripts/transient.mjs`, the same transient/permanent classification the artifact upload has used
  since issue #31, so both release-critical steps follow one rule.

## 6. Templates

Both templates were compared file by file ([`research/template-comparison.md`](research/template-comparison.md),
[`research/tree-js-template.txt`](research/tree-js-template.txt), [`research/tree-python-template.txt`](research/tree-python-template.txt)),
and the hive-mind guide section by section ([`research/best-practices-checklist.md`](research/best-practices-checklist.md)).
Problems found in the templates are in [`research/template-issues-candidates.md`](research/template-issues-candidates.md);
the issues filed from them are listed in section 7.

## 7. Issues reported to the templates

Both templates were still at the snapshots above (`c2463c74`, `67cfe05f`) when these were filed. The bodies are in
[`template-issues/`](template-issues/).

| Problem shared with this repository | JS template | Python template |
| --- | --- | --- |
| `actions/deploy-pages@v5` never retries a transient failure to create the deployment (finding 1) | [#277](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/277) | [#130](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/130) |
| `links.yml` has no schedule, and the lychee cache is discarded as "too old" (findings 5 and 6) | [#278](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/278) | [#131](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/131) |

Not shared with the templates, so nothing was filed for them:

- Chunk-size warning: there is none in the template logs.
- `act()` warnings: the templates have no React tests.
- Plain-stderr pipeline-status failure: `scripts/check-pipeline-status.sh` already prints `::error title=Pipeline failed::`.
- Dependency review and `.gitattributes`: both templates already have them.

The comparison also found template-only problems that this repository does not have: candidates A-E in
[`research/template-issues-candidates.md`](research/template-issues-candidates.md). The most serious is A: the JS
template's `preview-regen` job fails on every push to main with `gh: command not found`. The issue asks to report only
problems shared with this repository, so these are recorded there with their evidence but were not filed.
