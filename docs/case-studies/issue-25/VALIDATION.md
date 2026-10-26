# Validation record

Source changes are split into `a9001c9` (painted spacing and arrow geometry)
and `3d077c2` (per-link cards and native browser regression/CI integration).
The prepared branch starts at `a80408d`, based on `main` at `bede391`.
The fetched default branch is an ancestor; no merge conflict or history rewrite
was needed. The raster-test portability adjustment is `ffce48f`; documentation/evidence
follows these source commits.

## Local verification

| Check                                            | Result                                                                                                                      | Saved evidence                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Original-source regression                       | Expected failure: six issue regressions fail; zero-gap self-loop protection passes on original geometry                     | [reproduce-tests.log](logs/reproduce-tests.log), [initial five failures](logs/reproduce-initial-tests.log) |
| Full unit suite                                  | 717 passed locally (43 files, exit 0), and in source CI                                                                     | [final local log](logs/all-tests-final.log), [previous 716-test run](logs/all-tests.log)                   |
| Final focused solver/geometry/DOM suite          | 13 passed, including the two retained dense 24-link search/cut-budget tests                                                 | [focused-final.log](logs/focused-final.log)                                                                |
| Zero-gap compensation reproduction               | Failed before the fallback fix, then passed in focused suite                                                                | [zero-gap-reproduction.log](logs/zero-gap-reproduction.log)                                                |
| ESLint, formatting, file lengths, secret scan    | Pass; only the existing 1354-line registry collector warning                                                                | [final check](logs/check-final.log), [earlier check](logs/check.log)                                       |
| Dependency audit                                 | 0 vulnerabilities                                                                                                           | [audit.log](logs/audit.log)                                                                                |
| Production build                                 | Pass                                                                                                                        | [build.log](logs/build.log)                                                                                |
| Existing editor/download browser suite, Chromium | Pass: real SVG, PNG, JPEG, WebP and lino downloads; notation, styling, sharing                                              | [chromium-editor.log](logs/chromium-editor.log)                                                            |
| Issue 19 browser suite, Chromium                 | Pass: loop controls, history, clipboard, large networks, mobile                                                             | [chromium-issue19.log](logs/chromium-issue19.log)                                                          |
| Issue 21 browser suite, Chromium                 | Pass: supplied URLs, source colors, presets, SVG equality, mobile                                                           | [chromium-issue21.log](logs/chromium-issue21.log)                                                          |
| Issue 23 browser suite, Chromium                 | Pass: native displaced markers, gaps, 1215-card local gallery load, all skins, actual display blur, Russian mobile controls | [chromium-issue23.log](logs/chromium-issue23.log), [data](data/compat-issue23)                             |
| Issue 25 browser suite, Chromium                 | Pass                                                                                                                        | [native browser log](logs/chromium-browser.log), [JSON](data/chromium-browser.json)                        |
| Issue 25 browser suite, Firefox                  | Pass                                                                                                                        | [log](logs/firefox-browser.log), [JSON](data/firefox-browser.json)                                         |
| Issue 25 browser suite, WebKit                   | Pass, including Linux-specific narrow-tip raster measurement                                                                | [log](logs/webkit-browser.log), [JSON](data/webkit-browser.json)                                           |
| CV PDF build                                     | Pass: all 120 PDFs, page limits and readable text layers                                                                    | [log](logs/cv.log)                                                                                         |

The initial Firefox attempt failed because only Chromium was installed. The
environment failure is preserved in [firefox-missing-browser.log](logs/firefox-missing-browser.log).
Installing the pinned Firefox and WebKit revisions fixed the environment;
no application workaround or dependency change was required.

The browser suite checks exact SVG equality after applying automatic turns/gaps,
sharing and reloading; it edits cards, removes and renumbers a link, and checks
that English/Russian controls stay within the phone viewport. Actual SVG paint
is rasterized at 2000 × 2000 pixels with a two-pixel boundary tolerance,
equivalent to one pixel in a 1000 × 1000 image. A bounded Linux WebKit probe
confirmed antialias quantization at the smaller resolution; the original
failure and pixel rows are retained in `webkit-1000px-reproduction.log` and
`data/webkit-pixels.json`. No application change was needed. It independently checks miter joins and
painted boundary alignment at 5°, 15° and 45°. Full pixel measurements and SVGs
are preserved in each engine's JSON, alongside screenshots. Zero page errors
are required.

The local issue 23 compatibility run uses its default two gallery batches
(1215 cards) to respect the container's 2.92 GiB shared memory limit. CI retains
the pre-existing eight-batch **4131-card** check for each engine, including
native WebKit display capture on macOS. The full browser suites run sequentially;
every experiment closes its browser and server. No unbounded stress probe is used.

A long combined validation command was interrupted by the command runner
before its final unit summary; its partial output is preserved in
[all-tests-interrupted.log](logs/all-tests-interrupted.log). The final unit
run uses a standalone background process and records its exit status in
[unit-exit-code.txt](logs/unit-exit-code.txt). This separates execution-runner
limits from test failures.

## CI provenance

The baseline run [40397527295](https://github.com/konard/konard.github.io/actions/runs/40397527295)
was created at 20:39:02 UTC for `a80408d` and passed. It must not be confused
with validation of the changes. See [completed metadata](data/baseline-ci-final.json)
and [complete log](logs/baseline-ci.log).

The source-validation run is
[40401691502](https://github.com/konard/konard.github.io/actions/runs/40401691502),
created after the push at 21:07:39 UTC for `3d077c2`.
It completed successfully at 21:12 UTC: lint/actionlint, audit, 717 unit tests,
all five browser suites on Chromium/Firefox/macOS WebKit, the production build
and 120 CV PDFs passed. See [metadata](data/source-ci.json),
[complete logs](logs/source-ci.log) and [artifact inventory](data/source-ci-artifacts.json).
Downloaded browser JSON is preserved under `data/ci-source`, with all
issue-specific CI screenshots under `screenshots/ci-source`. Complete browser
artifacts remain linked in the run. The final evidence commit is checked by
another fresh run before the PR is marked ready; its URL and exact SHA are
recorded in the PR description, avoiding a self-referential archive commit loop.

## Final review

The full source PR diff was downloaded and read in bounded chunks; the original
placeholder `.gitkeep` is removed in the evidence commit. The card conversion
retains all nine existing per-link inputs and all link actions. Only the
obsolete expandable gap presentation and its browser clicks were removed.
Gallery/rain geometry uses legacy defaults and remains covered by stored hashes.
There is no automatic-release workflow or public package release trigger to bump.

All issue/PR conversation comments, inline comments, reviews and required
sub-issues were checked again after implementation and remained empty. The
separate `*-final.json` files preserve that audit. Acceptance mapping and
remaining mathematical search limits are documented in [README.md](README.md).
