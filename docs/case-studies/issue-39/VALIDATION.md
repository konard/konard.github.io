# Verification evidence

## Current review follow-up

The 2026-10-30 review follow-up merges main at `c0f0889` (issue 41) in `ee8aa4a`. The original verification below is retained as historical evidence. The [review audit](VISUAL-REVIEW.md) maps every subsequent requirement to implementation, reproducing failures, measured geometry and before/after images.

| Check | Current local result / evidence |
| --- | --- |
| Full Vitest suite after merging main | **76 files, 1,014 tests passed**. The one initial issue-41 native-menu test mismatch was corrected using the existing owned-menu helper. [Final log](data/visual-review/review-tests.log), [initial merged-suite failure](data/visual-review/merge-tests.log). |
| New render regression | **Six failures reproduced** at `ee8aa4a`; the fixed Chromium/Firefox renders pass. Dark corner pixel changes from white to the page canvas; default strokes/highlight meet at 16px and are both 2px thick. Both theme edges, nine frame variants, explicit offsets/thickness and custom zero-width CSS borders are checked. [Baseline log](data/visual-review/visual-red.log), [Chromium measurements](data/visual-review/chromium-after.json), [Firefox measurements](data/visual-review/firefox-after.json). |
| Complete issue-39 browser suite | Chromium and Firefox pass owned controls, all corners, every surface at 0/.5/1, all six glass material/theme combinations, widget/fallback and mobile bounds. The render regression is now part of the same three-engine CI command. [Chromium](data/visual-review/ui-chromium-review.log), [Firefox](data/visual-review/ui-firefox-review.log). |
| Main's issue-41 browser suite | Reported examples, 20 seeded networks, default/shared/supplied turns, exports, manual overrides, and mobile checks pass in Chromium. [Log](data/visual-review/issue41-review.log). |
| Production build | Passed. [Log](data/visual-review/review-build.log). |
| CV print regression | All **120 PDFs** pass page-count, readable-text and layout checks. [Log](data/visual-review/review-cv-pdfs.log). |
| Local checks | Lint, format, file limits and secrets pass. Commit hooks also run Python compilation, Ruff lint/format and ShellCheck. [Log](data/visual-review/review-check.log). |
| Real provider and MCP inspection | Official X loader renders 550×552px in both themes with transparent corner canvas. Playwright MCP independently checks the frame in the real browser, captures it and closes it. [Live requests](data/live-social.json), [MCP log](data/visual-review/mcp-review.log). |

Final-head CI provenance is recorded on [PR #40](https://github.com/konard/konard.github.io/pull/40/checks), with the verified SHA/run link in its description. Completion requires the current revision's unit/build/PDF, three browser engines, documentation, tooling, workflow and CodeQL checks to pass. The PR remains unmerged.

## Original implementation

Baseline: `a08a1ea012d2c12efbc974a22971e714e2ca3738` on branch `issue-39-3ca842ebe6d7`.

- Four behavioral regressions failed before implementation: [initial log](data/initial-regressions.log).
- Before UI captures were taken from the baseline with the same 1440×1050 viewport as the final screenshots.
- Focused controls, settings, social and skin suite passed during development (99 tests), followed by the full suite and browser checks recorded below.
- Playwright MCP inspected the settings UI in a real browser. Screenshot review corrected the frosted-grain prototype and the futuristic default scanlines. Its browser was closed after inspection.
- Browser automation uses bounded waits, finite fixtures and sequential engines. It makes no claim of universal assistive-technology certification or native Liquid Glass equivalence.

## Local verification

Checks ran sequentially on 2026-10-30 within the container's 2.92 GiB memory limit. The source revisions are `850693c`, `7fea30d`, `dde87a1` and the subsequent attribution-details browser-query correction. Evidence commits do not change application behavior.

| Check | Result / evidence |
| --- | --- |
| Full Vitest suite | **74 files, 975 tests passed**, including new language, defaults, opacity migration, controls, materials, provider races and optional-audio regressions. [Log](data/unit-tests.log). |
| Focused owned-control checks | **13 tests passed**, including numeric pointer stepping, RGB keyboard/pointer editing and Safari trigger focus. [Log](data/focused-controls.log). |
| Inherited network and indicator browser suites | Editor exports, history/self-loops, layouts, clipboard, source colors, sharing, spacing, arrows, all sliders, preserved manual layouts, contribution calendars, social fallback, mobile layouts and worker responsiveness passed in Chromium. [Log](data/inherited-browser-tests.log). |
| Large gallery and compositor | Headed Chromium passed all skins and repeated scrolling through **1,215 cards** locally. CI retains its stronger **4,131-card** fixture in every engine. [Log](data/gallery.log). |
| Production build | Passed. [Log](data/build.log). |
| CV print regression | All **120 PDFs** passed page-count, readable-text and layout checks; compact versions fit one page and positioned versions at most two. [Log](data/cv-pdfs.log). |
| Issue-39 browser suite | Chromium and Firefox passed the complete owned controls, eight corners, persisted settings, material presets, zero/.5/1 opacity, widget fixture/fallback and mobile checks. [Chromium log](data/ui-chromium.log), [Firefox log](data/ui-firefox.log), [computed styles](screenshots/chromium-verification.json). |
| Mobile color field | A failing rendered-text measurement reproduced clipping; the fix leaves 118px for an 81.39px string. This assertion also runs in the three-engine suite. [Before](data/mobile-color-red.log), [after](data/mobile-color-green.log). |
| Lint, format, file limits and secrets | `npm run check` passed. Commit hooks additionally passed Python compilation, Ruff checks/format and ShellCheck. |
| Dependency audit | `npm audit --package-lock-only --audit-level=moderate`: zero vulnerabilities. |
| Source-line collector | All 12 Python collector tests passed with the repository's pinned cloc script. |
| Documentation checks | `node scripts/check-docs.mjs` passed. |

The browser harnesses close their browser and Vite server in `finally` blocks. Playwright MCP was used to inspect settings and then closed. Final screenshots include desktop/mobile layouts, all three materials in dark/light themes, owned menus, numeric buttons and RGB controls; the intermediate clipped mobile field is retained separately.

## Provider availability and browser support

The live probe uses the actual official X loader separately from deterministic fixtures: [request/status evidence](data/live-social.json), [screenshot](screenshots/live-blog.png). Telegram and VK argument/lifecycle tests use valid fixtures; the current archive lacks Telegram channel-post identifiers and VK export hashes, so those entries correctly retain readable archives. Provider restrictions do not remove their text or source links.

Linux GTK WebKit stalled locally on backdrop panels, matching the repository's documented platform limitation. It was not repeatedly stressed and no timeout was increased. The existing matrix uses **macOS WebKit**, whose complete browser job passed on `dde87a1` in [run 41068320533](https://github.com/konard/konard.github.io/actions/runs/41068320533). Firefox's complete job also passed on that revision. Chromium reported the separate details-query assumption described below; its corrected selector passed the local indicator suite.

## CI provenance

Recent runs were listed with `databaseId`, `createdAt`, `headSha` and `conclusion`; each SHA and timestamp was checked against its commit. Full nonpassing logs are preserved, with specific line references and root causes in [CI-INVESTIGATION.md](CI-INVESTIGATION.md).

- Baseline `a08a1ea`, run **41058668988**, created **12:52:33Z**: passed.
- First implementation `850693c`, run **41065296471**, created **13:41:24Z**: exposed numeric-label, slider-audit, fallback, Safari-focus and audio-loading failures; all were investigated and corrected.
- Follow-up `7fea30d`, run **41067827591**, created **13:59:09Z**: superseded/cancelled; exposed the mobile attribution query's single-element assumption.
- Mobile fix `dde87a1`, run **41068320533**, created **14:02:26Z**: Firefox and macOS WebKit passed; Chromium reproduced only that attribution-query failure, corrected by expanding both disclosures in the inherited test.

The final PR check list and its exact head SHA are available on [PR #40](https://github.com/konard/konard.github.io/pull/40/checks). Completion requires all applicable jobs on that final revision to pass, including unit/build/PDF, all three browser engines, documentation, tooling, workflow lint and CodeQL. The PR is left unmerged.
