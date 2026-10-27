# Validation record

The before state is prepared parent `406a2b4`, containing the merged issue-25 implementation. Native browser checks use the pinned Playwright 1.63.0 browsers. All substantial commands write logs to files and final commands run sequentially under the container's 2.92 GiB memory budget.

## Reproduction and focused checks

- Five initial geometry/solver/serialization tests fail before the fixes: [log](logs/reproduce-tests.log).
- Three additional keyboard regressions fail: [log](logs/reproduce-keyboard-tests.log). The URL test was run after the serializer fix and already passed.
- The new off-grid stepping check fails with `0.075 → 0.085`: [log](logs/off-grid-reproduction.log). The same attempt records a fixture path error, corrected before acceptance.
- All 19 new focused tests then pass: [log](logs/focused-final.log). They cover painted equality/continuity, exact manual arrangement, full/partial closed halves, all six historical schema revisions, old aliases and compact rows, URL history, inherited stepping, negative drafts and every slider schema.
- Historical source audit passes all six schemas, retaining 53–84 fields as the schema grows: [audit log](logs/url-history-audit.log), [fixture](data/url-schema-history.json).

## Full verification

An initial full suite passed **727 tests in 45 files** before nine historical-schema/shared-key regressions were added: [log](logs/all-tests-first-pass.log). The expanded suite passes **736 tests in 47 files**: [log](logs/all-tests-final.log). The final inherited native-spinner regression fails with `0` instead of `0.07` before its fix ([log](logs/native-inheritance-reproduction.log)), then passes ([log](logs/native-inheritance-fixed.log)). The complete final suite passes **737 tests in 47 files** (181.59 seconds): [log](logs/all-tests-complete.log). Final repository checks ([log](logs/check-complete.log)) and production build ([log](logs/build-complete.log)) also pass. The only file-size warning is the existing 1354-line registry collector.

All final production browser runs pass all five groups: preserved/canonical historical URLs, four rasterized arrow angles, automatic spacing/apply/share/reload, native and keyboard decimal stepping and editing, and all eight keys on 92 rendered sliders. These runs include off-grid snapping and native pointer stepping from inheritance. Their JSON includes exact painted distances, browser versions, exercised control IDs and zero page errors.

| Local browser | Version       | Checks                   | Evidence                                                                      |
| ------------- | ------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Chromium      | 153.0.8010.12 | 5/5; 92 sliders × 8 keys | [JSON](data/chromium-browser.json), [log](logs/browser-chromium-complete.log) |
| Firefox       | 155.0         | 5/5; 92 sliders × 8 keys | [JSON](data/firefox-browser.json), [log](logs/browser-firefox-complete.log)   |
| WebKit        | 26.6          | 5/5; 92 sliders × 8 keys | [JSON](data/webkit-browser.json), [log](logs/browser-webkit-complete.log)     |

The maximum measured difference between rasterized closed endpoint distances is **0.04243 SVG units** at 2000-pixel resolution, below the independent 0.12-unit raster tolerance. Analytic equality remains exact to nine decimal places.

The final build retains the application's existing warnings about extensionless imports and bundle chunks. JSDOM emits its existing unsupported canvas warnings; the browser suites verify actual canvas rendering and downloads.

## Verification boundaries

- The solver remains an opt-in overlap heuristic. The exact symmetric manual arrangement is verified separately; default solving finds a zero-overlap arrangement with unequal open-lens gaps while preserving all self-closed halves.
- Analytic paint equality uses the shaft cap and sharp miter tip. Native raster tests allow 0.12 SVG units for pixel/antialiasing differences at 2000-pixel resolution; they do not weaken analytic equality.
- Keyboard tests use real desktop browser engines. Native operating-system dialogs, touch assistive technologies and every operating-system clipboard/undo convention are not independently emulated. Their standard key events remain unintercepted.
- Historical URLs preserve explicit supported configurations and parser compatibility. Omitted defaults have always followed the current application; the historical URL scheme contains no release identifier.
- The initial full suite and Chromium validation briefly overlapped in this container; the cgroup approached its memory ceiling but recorded **zero OOM events/kills**. Subsequent heavy validation is sequential. No deliberately unbounded stress probes are used.

## Interactive browser verification

Playwright MCP passes actual mouse clicks on the native number spinner: **Up 0.07→0.08**, **Down 0.08→0.07**, keyboard Up, and native **Down/Up from empty inheritance →0.07 / 0.09**. The controls restore the shared URL to equal `0.08 / 0.08` closed gaps. [Result](data/mcp-browser.json), [final trace](logs/mcp-browser-final.log), [screenshot](screenshots/mcp-after-equal.png), [retained script](../../../experiments/issue-27-mcp.mjs). [Before](screenshots/native-spinner-before.png) and [after](screenshots/native-spinner-after.png) show the inherited native-Down problem and correction. The MCP page and preview server were closed after verification. An initial dynamic-import attempt failed because the MCP VM has no dynamic-import callback. The retained callback uses a named function so formatting cannot add an expression-ending semicolon that the MCP wrapper rejects; it is verified by loading that exact file through MCP.

## Archived CI and compatibility evidence

The first implementation commit `847d1faa8d3e9ac3028f2cc623ba7574ed248b19` passes [run 40577107753](https://github.com/konard/konard.github.io/actions/runs/40577107753), created **2026-10-27 20:20:09 UTC**: workflow lint, repository checks, all six browser suites in Chromium/Linux, Firefox/Linux and WebKit/macOS, 736 unit tests, production build and 120 CV PDFs. Deployment is intentionally skipped for pull requests. [Complete CI log](logs/ci-source-40577107753.log), [job metadata](data/ci-source-status.json), [all three artifact manifests, numerical JSON and issue-27 screenshots](ci-evidence/40577107753/). The manifests index every downloaded artifact file by size and SHA-256; unchanged older-suite screenshots already have dedicated case-study archives.

That run precedes the final inherited native-spinner regression and correction. The final evidence commit is independently validated by the PR's checks; its head SHA must match the inspected run before marking ready. Baseline PR run `40572967850` and the latest default-branch deployment `40405958762` also pass, so no pre-existing failing CI check is bypassed.

The native-spinner follow-up is application commit `400b4d777354d0c3cb00530e863b64e7f9743a0b`. Its [run 40579640992](https://github.com/konard/konard.github.io/actions/runs/40579640992), created **2026-10-27 20:37:02 UTC**, passes every check: workflow lint, repository checks, all six browser suites in all three engines, **737 unit tests**, production build and **120 CV PDFs**. [Complete CI log](logs/ci-native-40579640992.log), [head SHA and job metadata](data/ci-native-status.json), [three browser artifact archives](ci-evidence/40579640992/). They verify the expanded inherited-pointer cases as well as all earlier browser groups, with no page errors. The [small follow-up diff](data/native-follow-up.diff) complements the [original implementation diff](data/pr-source.diff).

Local compatibility suites pass the original editor/download checks and issues 19, 21 and 23 in Chromium, and issue 25 in all three engines. [Editor log](logs/compat-editor-chromium.log), [issue 19](logs/compat-issue19-chromium.log), [issue 21](logs/compat-issue21-chromium.log), [issue 23](logs/compat-issue23-chromium.log), [issue-25 JSON](data/compat-issue25/). Local gallery regression uses its finite 1,215-card default; CI verifies the exact prior 4,131-card load in every engine. [CV generation](logs/build-cv.log) prints all **120 PDFs**; [dependency audit](logs/audit.log) reports **zero vulnerabilities**. The [repeated historical-schema audit](logs/url-history-audit-final.log) passes and cleans up its temporary Git archives.
