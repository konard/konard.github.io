# Verification evidence

## Reproductions and fixes

- `regressions-before.log`: the native ESM config import fails; the old deployment
  check incorrectly accepts a stale page and HTML at the PDF path. Both pass after
  correction (`regressions-after.log`, then `source-archive-final.log`).
- `artifact-regressions-before.log`: tests introduced before the retry adapter
  exists. `artifact-retry.test.js` now covers DNS/reset/timeouts/429/503 recovery,
  permanent refusals, retry exhaustion, reconciliation, missing IDs and evidence,
  Pages tar layout and a real SDK ZIP round trip.
- `artifact-sdk-network-repro.log`: the offline
  `experiments/issue-31-artifact-network-repro.mjs` exercises the pinned SDK's real
  CreateArtifact client. Injected ENOTFOUND fails after exactly one HTTP request
  despite maxAttempts=3; the adapter recovers on request two. No credentials,
  external requests or real artifact upload are used by this experiment.
- `python-lint-before.log` and `shellcheck-before.log`: pre-existing helper-script
  findings. Selected fixes are verified in the final Ruff/ShellCheck logs.
- `source-archive-before.log`: review reproduced a newly introduced dependency on
  Git metadata during build. The source-archive regression now passes and hosted
  builds still stamp GITHUB_SHA.
- `archive-hook-before.log`: staging the requested template snapshots exposed
  lint-staged's nearest-config discovery: it attempted the archived template's
  commands. `hook-regression-before.log` reproduces that with a failing nested
  package configuration, and `hook-regression-after.log` passes after the hook
  explicitly selects the repository's package.json. ESLint also discovers
  configuration per file: `archive-eslint-before.log` and
  `eslint-hook-regression-before.log` reproduce that second path. Both lint entry
  points now select eslint.config.js explicitly. `hooks-regression-final.log`
  tests both paths and `staged-hook-final.log` verifies the real staged snapshot.
  Archived sources retain their original contents and are never used as hook
  policy; all 118 archived files still match the 603-path inventory hashes.
- `install-script-regression-before.log` fails for the unreviewed, optional
  macOS dependency fsevents@2.3.3. `install-script-probe-before.log` reproduces
  the actual npm advisory with a one-package macOS-targeted install on Linux.
  `install-script-probe-after.log` preserves both the warning baseline and its
  absence with the exact-version repository approval; all six regression cases
  pass in `install-script-regression-after.log`. The probe is offline and never
  loads the native binary. Future dependency versions require another review.

## Local validation

`npm-ci-final.log`: clean install, no deprecated-package warnings, zero advisories.
The narrow archiver-utils/glob override is verified by the actual artifact SDK's
ZIP stream test. `audit-final.log` audits the committed lockfile.

`check-final-staged.log`, `file-size-final.log`, `python-final.log`,
`ruff-final.log`, `ruff-format-final.log`, `shellcheck-final.log`,
`actionlint-final.log`, `zizmor-final.log` and `zizmor-pedantic-final.log` preserve
local static checks. The exact pinned Docker image was fetched, but this sandbox's
Docker daemon cannot create its cgroup. Its extracted actionlint binary was run
with ShellCheck explicitly present; hosted CI runs the image itself.

`unit-final.log`: all 53 suites and 797 tests passed, including the source-archive
regression. `source-archive-final.log`: all 24 tests in the three affected suites
also passed in isolation. `build-source-archive.log` is the production build after
that correction. `check-source-archive-final.log` records the final lint, format,
file-limit and secret checks, including the offline SDK reproduction.

After the script-review fix, `unit-script-review-final.log` records all 53 suites
and 798 tests passing. `check-script-review-final.log` preserves passing source
checks. `npm-ci-script-review-final.log` and `audit-script-review-final.log` record
the clean fresh install and zero advisories after adding the pinned approval.

The editor, issue 19 and issue 21 Chromium browser logs pass. `pdf-final.log`
records all 120 PDFs printed and validated. The local gallery probe is bounded at
1,215 cards and 800 MB descendant RSS: `browser-issue23-guarded.log` records the
memory guard stopping it at 805,019,648 bytes after 3.09 seconds, without a host
OOM. That interrupted probe is not represented as a pass. The full reported
4,131-card case is tested on adequately provisioned hosted runners in all three
engines, including compositor screenshots. Local issue 25, 27 and 29 Chromium
suites also completed successfully; their final logs are preserved.

## Hosted verification

The initial branch run 40664909496 passed before implementation, while the
reported main run 40662150605 failed at artifact transport after its tests passed.
The first implementation run is 40668100515, started 2026-10-28 09:55:59 UTC at
6c1d9b724e8f903d7cfab0a4e53ebb5697224d02. Its three browser jobs and real artifact
uploads passed; Python, JavaScript and Actions CodeQL, docs, source and workflow
checks passed. The complete run finished successfully, including the aggregate
status gate; only deployment was deliberately skipped. Its three informational
notices describe the deliberate deployment skip, macOS runner queue capacity and
the documentation summary. The complete log contains no warning/error
annotations and is archived as `ci-logs/first-implementation-40668100515.log`.
In that log, lines 8125/9050/9762 verify all three evidence artifacts; lines
10471–10472 record 53 suites/795 tests, line 10786 all 120 CV PDFs and line 10806
the Pages artifact's successful finalization. Statuses and the exact tested SHA
are preserved in `ci-first-completed.json`.

Raw log review of run 40672107686 (head a9fd72dc064199ba5a9a5bb53200ea6cb7ae8ba7)
found a warning despite all checks succeeding and no warning annotations.
`ci-logs/pre-script-review-40672107686.log:9346` records npm 11.19.0 reporting
fsevents@2.3.3 as unreviewed on macOS. The first implementation run also contains
the warning at lines 9310–9313. Neither run is claimed as warning-free.
The registry advertises an install command (`node-gyp rebuild`), while the
integrity-pinned published tar contains a prebuilt binary, no binding.gyp and
no install lifecycle command. npm retains the lockfile's hasInstallScript flag
and emits a sentinel advisory. The reviewed exact-version approval preserves
existing installation behavior without approving other packages or versions.
Published/registry manifests and the tar inventory are archived as
`fsevents-2.3.3-*`; deleting valid registry-derived lock metadata, blanket script
approval and hiding npm warnings were rejected. The JS template's universal-app
example already records a fsevents review; the website root lacked that policy.
Their artifact defect reports remain applicable independently.
Final verification must inspect raw logs as well as check annotations.

Run 40674729926 at b9e68d463783128440e3a410b543cff3ec61a3a6 then exposed
CodeQL's 300-file compare API boundary: the PR had grown to 314 changed files.
All three CodeQL jobs succeeded but warned about a truncated diff. Selecting
full analysis explicitly avoids requesting that diff and preserves all default
queries. `codeql-full-scan-before.log` reproduces the missing workflow policy;
`codeql-full-scan-after.log` passes all 15 workflow regressions after correction.
`codeql-diff-limit-source.log` and `codeql-action-sha.txt` preserve the official
action's boundary, flag and upstream behavioral test. The final hosted run must
verify full analysis for JavaScript, Python and Actions without those warnings.
Both templates inherit the same v4 default: JS issue 265 and Python issue 121
report that shared limitation, without claiming their own runs were observed
failing. Source/workflow lint and both security audit modes are preserved in
the `*-codeql-final.log` files.

The completed macOS browser job in that run passed all seven suites and its
actual npm 11.19.0 install is now clean: `ci-logs/macos-script-review-122770649627.log`
lines 245–250 record 534 packages installed and zero advisories, with no npm
warnings. `ci-logs/codeql-limit-122770237784.log:1066` preserves the separate
CodeQL warning before the full-scan setting. These completed job logs were
downloaded directly through GitHub's job-log API while the overall run finished.

`unit-codeql-final.log` records the final complete local run: 53 suites and
799 tests passed. `check-codeql-final.log` records all source gates passing.

A PR deliberately skips deployment. No live site was overwritten from this
branch. Deployment verification is exercised through local HTTP server fixtures
that accept valid content and reject old commits, HTML assets and missing files.
The uploaded Pages artifact uses the official tar-in-ZIP format. The final PR
status is checked against the exact latest head after all evidence is committed.

## Separate Advanced Security gate

Run 40675994571 (head dfb1f91) has successful workflow jobs and clean raw logs,
but its separate CodeQL check 122774900583 fails. Three changed-line annotations
are not the whole scope: the complete PR-merge API reports ten alerts.
SECURITY.md inventories all ten, distinguishes real defects from trusted-input
and plain-text contexts, and maps fixes and bounded regressions. The final
verification includes all check runs and zero open PR-merge alerts, not just
gh run watch's workflow result.

The ten findings now have code fixes and regression coverage. The original
security reproductions fail nine cases; the corrected focused run passes 192.
The full current run passes 833 tests in 55 suites (unit-security-final.log).
The new SARIF gate also rejects the actual ten-finding report and accepts the
real clean Python report; security-gate-real-*.log records the CLI outcomes.
This closes the workflow false green without waiting for the independent check.
Missing, malformed and incomplete reports fail as well. Shared upstream reports
are JavaScript 266 and Python 122; the website implementation is independent.
Fresh install, production build and all static checks are repeated for this
security correction; the final exact-head hosted scan remains required.

## Completed full implementation validation

Run [40681082933](https://github.com/konard/konard.github.io/actions/runs/40681082933)
completed successfully at 67ca6ef0cda668aea13cb1460b4bc7c56ec904e8 on
2026-10-28. The complete raw log and exact-head job/check metadata are preserved
as ci-logs/security-completed-40681082933.log, ci-security-completed.json and
checkruns-security-completed.json. All 15 checks succeed except the documented
PR deployment skip. The independent CodeQL check succeeds with zero annotations;
all three analyses report zero findings and the complete open PR-merge alert
list is empty. No findings were dismissed or queries/source coverage removed.

The raw log records all 55 suites / 833 tests at lines 11515–11516, all 120
PDFs at 11830, the Pages artifact at 11850 and the Chromium, WebKit and Firefox
evidence artifacts at 8647, 9359 and 10809 respectively. Every original browser
suite and full 4,131-card case passed on every engine. Fresh macOS npm output
contains no warning; each platform install has zero advisories.

The complete log was searched for warning/error annotations and raw warning,
error and failure messages. There are no real warnings or errors. Remaining
matches are action options, CodeQL query names, empty browser error arrays and
explicitly injected retry/history failures in successful regression tests.
annotations-security-completed.json records exactly three informational notices:
PR deployment deliberately skipped, documentation summary and macOS runner queue
capacity. None is a warning or error.

The final evidence-only commit preserves this successful source validation.
The PR description and GitHub metadata record the checks for that final head
after push; no further source or evidence changes are required after those pass.
