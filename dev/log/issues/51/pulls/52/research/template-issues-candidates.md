# Candidate issues for the pipeline templates

Filed: only the problems this repository shares with the templates.

- G: [JS #278](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/278), [Python #131](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/131).
- The deploy-pages retry (finding 1 of the case study, not listed below): [JS #277](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/277), [Python #130](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/130).
- A-E are problems of the templates alone and were not filed.

Snapshots: JS template `c2463c74`, Python template `67cfe05f` (both 2026-11-02).
On 2026-11-02 neither repository had an open issue. The only open PR was
js #231 ("Adopt JavaScript-first parity gates and bulk drafting standard").
Every candidate below was searched against closed issues; overlaps are noted.
Logs were downloaded with `gh run view --log` (saved locally in /tmp/tpl-logs).

Latest upstream versions on 2026-11-02, used below:

- actions/checkout v7.0.1
- actions/setup-node v7.1.0
- actions/cache v6.1.0
- zizmorcore/zizmor-action v0.8.0, zizmor 1.31.1

---

## A. [JS, high] preview-regen fails on every push to main: `gh: command not found` in the Playwright container

**Repo:** link-foundation/js-ai-driven-development-pipeline-template

**Evidence**

The job runs in a container image that does not include `gh`. In `.github/workflows/example-app.yml` lines 283-291:

```yaml
  preview-regen:
    name: Regenerate Preview Images
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright@sha256:b0ab6f3cb99aa7803adbc14d9027ec1785fc6e433b97e134e0f8fe61683b6b53 # v1.59.1-noble
```

At line 367 a step then runs:

```yaml
          gh auth setup-git
```

The log of run 41352284761 (2026-11-01, `c2463c74`) shows:

```
Preview images drifted:
/__w/_temp/eee48ab3-....sh: line 4: gh: command not found
##[error]Process completed with exit code 127.
```

- The same two lines appear in runs 40970559149 (2026-10-29) and 40108660989 (2026-10-24).
- "Example app" has failed on all 4 main pushes since 2026-10-24. The other one is 40087077764, whose log was not inspected.
- The last successful run was 38049674017 (2026-10-10).
- The images drift on every run, so the regenerated screenshots are never committed.

**Overlap:** Closed js #237 (sh vs bash and dubious ownership) and js #245 (RELEASE_PR_TOKEN) changed this job. The `gh auth setup-git` line arrived with those fixes. No issue mentions `gh: command not found`.

**Proposed title:** `preview-regen fails on every main push: gh is not installed in the Playwright container (exit 127 at "gh auth setup-git")`

**Proposed body:**

- Quote the YAML and log lines above and the four failing run IDs.
- Fix options:
  1. Replace `gh auth setup-git` with a git credential helper that reads `GH_TOKEN`, for example `git config --local credential.helper '!f() { echo username=x-access-token; echo "password=$GH_TOKEN"; }; f'`, scoped to the step.
  2. Install `gh` from its pinned apt repository before the step.
  3. Run the commit/push step outside the container in a follow-up job that downloads the images as an artifact.
- Add a regression test asserting that every command a container job uses exists in the image, or at least that no container job calls `gh` without installing it.

---

## B. [JS + Python, low] Outdated action pins in both templates: zizmor-action v0.6.4 / zizmor 1.30.1 and actions/cache@v5

**Repos:** both templates (one issue in each)

**Evidence: JS template, `.github/workflows/workflows.yml`**

```
139:      - uses: zizmorcore/zizmor-action@v0.6.4
150:          version: 1.30.1
166:          pipx run zizmor==1.30.1 --config .github/zizmor.yml \
```

and `.github/workflows/links.yml:68`:

```
        uses: actions/cache@v5
```

**Evidence: Python template, `.github/workflows/workflows.yml`**

```
29:  ZIZMOR_VERSION: '1.30.1'
96:        uses: zizmorcore/zizmor-action@v0.6.4
```

and `.github/workflows/links.yml:51`:

```
        uses: actions/cache@v5
```

The latest releases are zizmor-action v0.8.0, zizmor 1.31.1 and actions/cache v6.1.0. konard/konard.github.io already runs those versions without findings.

**Overlap:** js #234 / py #106 bumped checkout and setup-node only. js #210 / py #76 / js #178 were about keeping the action and CLI versions in one pin, not about their age.

**Proposed title:** `Bump zizmor-action to v0.8.0 (zizmor 1.31.1) and actions/cache to v6`

**Proposed body:**

- List the lines above.
- Note that the action and CLI pins must move together, so the digest table in v0.8.0 must contain 1.31.1.
- Update `check-ci-workflows.mjs` and the tests if they assert exact versions.

---

## C. [JS, medium] JavaScript-first workflows print `hint: Using 'master' as the name for the initial branch` 7 times per run

**Repo:** link-foundation/js-ai-driven-development-pipeline-template

**Evidence**

Neither workflow has a top-level `env:`.

- `.github/workflows/javascript-first-example.yml` goes straight from `permissions: contents: read` (lines 19-20) to `jobs:` (line 22).
- `.github/workflows/javascript-first-gate.yml` does the same at lines 27-30.

Every other template workflow sets `GIT_CONFIG_COUNT: '1'`, `GIT_CONFIG_KEY_0: init.defaultBranch` and `GIT_CONFIG_VALUE_0: main`.

Run 41352284729 ("JavaScript-first mixed-language example", 2026-11-01) prints `hint: Using 'master' as the name for the initial branch` 7 times. It appears once per checkout: the `javascript-first` gate job, then rust-check, rust-build, rust-test, rust-package, rust-container and rust-publish.

`javascript-first-gate.yml` is a reusable workflow (`on: workflow_call`), so it needs its own `env:`. The caller's `env:` does not carry into a called workflow.

**Overlap:** py #94 fixed the same hint for the Python template. No JS issue covers the javascript-first files, which were added by js #230 after that fix.

**Proposed title:** `javascript-first workflows lack the init.defaultBranch env: 7 "Using 'master'" hints per run`

**Proposed body:**

- Give the evidence above.
- Add the three `GIT_CONFIG_*` variables to both files.
- Extend the workflow-policy test so it checks every workflow file, including reusable ones.

---

## D. [JS, medium] javascript-first-example.yml escapes the template's own workflow policy

**Repo:** link-foundation/js-ai-driven-development-pipeline-template. This can be filed together with C.

**Evidence**

1. **No terminal `pipeline-status` gate.** The jobs (lines 23-143) are `javascript-first`, `rust-check`, `rust-build`, `rust-test`, `rust-package`, `rust-container` and `rust-publish`. The workflow is also missing from the coverage check list in `.github/workflows/workflows.yml` lines 109-115:

   ```
             node scripts/check-status-gate-covers-all-jobs.mjs
             .github/workflows/release.yml
             .github/workflows/links.yml
             .github/workflows/security.yml
             .github/workflows/workflows.yml
             .github/workflows/example-app.yml
   ```

   A `timeout-minutes` kill, which GitHub reports as cancelled, therefore leaves this workflow grey, not red.

2. **No `workflow_dispatch`** (`on:` at lines 3-17). Every other template workflow has it.

3. **The `push.paths` list (lines 13-17) omits `tests/javascript-first-gate.test.js`.** The `pull_request.paths` list includes it at line 8.

4. **The gate job in `javascript-first-gate.yml` (lines 31-35) has no `concurrency:`.** Every other job in the template sets one.

5. **Inconsistent action pinning.** Actions are pinned by SHA here: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1, example lines 41-132, gate line 42) and `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1` (v7.1.0, gate line 51). Every other workflow uses `@v7`, as `.github/zizmor.yml` (`actions/*: ref-pin`) allows. Dependabot and the version policy will treat the two styles differently.

**Proposed title:** `javascript-first-example.yml has no pipeline-status gate and is missing from the status-gate coverage check`

**Proposed body:**

- Give the five points above.
- Add the gate.
- Add the file to the coverage list, or better, make the coverage check glob `.github/workflows/*.yml` and skip `workflow_call`-only files, so a new workflow cannot be missed again.
- Add `workflow_dispatch`.
- Align the `paths` lists.
- Add concurrency to the gate job.
- Use one pinning style.

---

## E. [Python, low] `PytestDeprecationWarning: asyncio_default_fixture_loop_scope is unset` in every test job

**Repo:** link-foundation/python-ai-driven-development-pipeline-template

**Evidence**

Run 41351625272 ("CI/CD Pipeline", 2026-11-01), job "Test (Python 3.13)", log line 1528:

```
.../site-packages/pytest_asyncio/plugin.py:300: PytestDeprecationWarning: The configuration option "asyncio_default_fixture_loop_scope" is unset.
```

- `pyproject.toml:33` depends on `"pytest-asyncio>=0.24.0"`.
- `tests/test_my_package.py:56-57` uses `@pytest.mark.asyncio`.
- `[tool.pytest.ini_options]` (`pyproject.toml:118-122`) sets only `minversion`, `addopts`, `testpaths` and `pythonpath`.

**Overlap:** none found (searched for `asyncio_default_fixture_loop_scope` and `PytestDeprecationWarning`).

**Proposed title:** `Set asyncio_default_fixture_loop_scope to silence the PytestDeprecationWarning in every test job`

**Proposed body:**

- Add `asyncio_default_fixture_loop_scope = "function"` to `[tool.pytest.ini_options]`.
- Optionally add `filterwarnings = ["error"]`, so the next deprecation fails CI instead of scrolling past.

---

## G. [JS + Python, low] links.yml has no schedule, and the lychee cache is always "too old"

**Repos:** both templates

**Evidence**

1. Neither `links.yml` has a `schedule:` trigger. In both templates only `security.yml` has `cron: '0 6 * * 1'`. Link rot in unchanged Markdown is therefore never detected.

2. The JS `links.yml` keys the cache per commit and passes `--max-cache-age 1d`:

   ```
   67-73:   key: cache-lychee-${{ runner.os }}-${{ github.sha }}
            restore-keys: cache-lychee-
   90:      --max-cache-age 1d
   ```

   Restoring an older cache prints a warning:

   - JS run 41352284642, log line 293: `[WARN] Cache is too old (age: 2d 22h 22m 19s, max age: 1d 0h 0m 0s). Discarding and recreating.`
   - Python run 41351625406, log line 294 shows the same warning (`2d 23h 6m 37s`).

**Overlap:** js #248 and py #113 made the cache persist at all. They did not cover the schedule or the age mismatch.

**Proposed title:** `Run the Broken Link Checker weekly and align --max-cache-age with how often the cache is refreshed`

**Proposed body:**

- Add `schedule: - cron: '0 6 * * 1'`.
- Either raise `--max-cache-age` (for example 7d) or accept the discard silently.
- Give the evidence above.

---

## Considered and not proposed

- **npm audit `--audit-level=high`** (JS `security.yml:144`) hides moderate advisories. This is already reported in closed js #246. Do not duplicate it.

- **Permanently red main in both templates.**
  - In the JS template, "Checks and release" fails at Release Preflight: `npm has no package @link-foundation/example-package-name yet ... Add an NPM_TOKEN repository secret` (run 41352284691).
  - In the Python template, "CI/CD Pipeline" fails with `PyPI refused to mint an upload token (422 invalid-publisher ...)` (run 41351625272).
  - js #239 and py #108 deliberately made this a hard failure on the template repos themselves.
  - The side effect is that a red main hides real regressions such as candidate A. Raise this only as a comment or question, not as a bug.

- **Docker Hub `registry-1.docker.io` timeouts in JS test logs.** These come from test fixtures and the jobs passed.

- **`error_count: 10` in deploy logs.** This is only the default value of a deploy-pages input.
