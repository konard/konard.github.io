# Issue 23: stable glass panels and precise link editing

Issue: https://github.com/konard/konard.github.io/issues/23  
Implementation/review: https://github.com/konard/konard.github.io/pull/24

## Evidence and chronology

The complete issue, its comments, the earlier issue #21, PR #22 and all three
comment/review types on PR #24 were read. Raw responses are under `data/`.
There are no required child issues. Issue #21 is the explicitly requested audit
of prior work. Its screenshots and supplied URLs remain part of acceptance.

- 2026-10-25: issue #21 requested balanced editor geometry, a cross at the start,
  source-matching colors, undecorated gallery hover and accurate shared controls.
  PR #22 separated editor curve bending from legacy gallery tangent rotation.
  Its full solver session is archived in `logs/pr-22-session.log`; the original
  study, browser evidence and gallery hashes remain under `../issue-21/`.
- 2026-10-25 20:03 UTC: issue #23 reported intermittent Safari header blur after
  loading 4,131 networks, an oversized Share icon, default bend 20, displaced
  markers leaving their curves, and the need for per-link gaps and solver support.
- 2026-10-26: this investigation archived all seven supplied images, verified
  that downloads were PNGs and inspected them. `images/reported-23-1.png` and
  `reported-23-2.png` show the same large gallery with/without header blur;
  `reported-23-3.png` shows the Share icon consuming the card; images 4–5 compare
  wobbly/straight editor defaults. The two #21 images show the supplied settings.
- The prepared branch was `ee7446c`; its CI run 40268137810 passed. That result
  predates the implementation and is not evidence for this fix.
- Before editing, four geometry regressions and two DOM regressions failed
  (`logs/reproduce-geometry.log`, `logs/reproduce-ui.log`). A production build
  produced the four `screenshots/chromium-before-*.png` captures.
- A bounded Chromium run loaded exactly 4,131 cards. Every card retained a
  computed backdrop filter, including offscreen cards. The successful run's
  owned peak RSS was 1,394,089,984 bytes and cgroup peak 2,324,881,408 bytes.
  Earlier attempts stopped at the memory guard and are not counted as successful
  reproductions. The successful run is `logs/chromium-baseline.log` and its
  samples are `data/chromium-baseline.json`.

## Requirements, causes, implementation and checks

| Requirement (including issue #21 audit) | Cause / decision | Implementation and verification |
| --- | --- | --- |
| Stable top-menu blur with many networks | Every appended card retained a backdrop-filter declaration, including offscreen cards. The count grew linearly to 4,131. This is unnecessary compositor pressure. | Shared viewport observer disables only offscreen card filters, with a 200px prefetch margin. Header filtering remains enabled. Browser pressure samples, repeated scrolls and screenshots test all three skins. |
| Fix the same pressure in every unbounded list | Gallery is not the only growing collection. Repositories and posts use the same glass layers. | Shared `Layout` observer handles gallery cards, `.repo` and `.post`, appended nodes, removals and cleanup. Unit tests cover the lifecycle; site-wide browser audit includes the feeds/lists. |
| Remove redundant/misaligned Share button | A second absolute anchor contained an SVG affected by broad gallery sizing. It consumed extra card space and duplicated editor navigation. | Remove icon, anchor and obsolete CSS. One full-card editor link remains; editor downloads/sharing remain covered by prior browser suites. Before/after card screenshots and DOM regression. |
| Audit all HTML alignment | Long text, controls, table cells and image-size selectors need deliberate wrapping/alignment. | Table cells align vertically, reference selects have a bounded width, size controls wrap, and per-link gaps use a responsive two-column grid. `issue-23-alignment.mjs` audits all ten HTML entries × three skins × two themes × two languages × two widths (240 combinations). |
| Straight free links and balanced full/partial loops by default | The editor still supplied global bend 20. The earlier loop width formula used 20 as its neutral point, coupling unrelated shapes. | Editor bend is 0. Independent loop bend is 0. A strictly positive exponential loop width is 1 at neutral settings, allowing signed widening/narrowing without inversion. Full loops remain point-symmetric; partial loops retain a straight free half. |
| Neutral bend/twist/rotation; broad configuration | Bend was restricted to nonnegative values; endpoint angle/rotation ranges were inconsistent. | Bend, loop bend and endpoint angles support −180…180°, marker/per-link rotations remain signed. Whole-layout rotation supports −180…359° to retain existing positive shared values. Curvature, gaps, free length, loop size and spread ranges are expanded. Geometry tests cover signed normalization. |
| Endpoint markers follow curve and rotate with it | Old offsets translated the endpoint along its original tangent and kept its original direction. On a loop this puts the bar off the line. | Measure signed arc length on the full cubic chain, evaluate the curve and its local derivative there; sideways movement uses that local normal and explicit rotation is applied last. Negative/beyond-end offsets extend the endpoint tangent. Start/end/middle tests, degenerate-curve tests and independent native SVG browser measurements verify this. |
| Individual reference/center gaps alongside global settings | Only global `startGap`, `endGap`, `middleGapStart`, `middleGapEnd` existed. | Four per-link overrides; blank inherits the global value, explicit zero remains zero. URL normalization/clamping, saved looks, removal/renumbering, preview, SVG export and sharing preserve overrides. UI, geometry and browser round-trip tests. |
| Auto-adjust gaps in the experimental solver | The objective sampled complete center lines and the search varied angles only. | Add a second bounded coordinate-descent stage for reference gaps and center cuts. Score the actual visible pieces without bridging cuts. Preserve manual starting values; penalize changes, cap new center cuts to 30% of each half, and reject a worse exact score. Gap-only fixture improves without any angle changes. Apply/share reproduces the preview. |
| Precise symmetry and a cross at the start (#21) | Existing centered-axis invariants must survive new neutral bend and arc offsets. | Existing exhaustive finite/continuous small-network tests and exact point/quarter-turn symmetry tests remain; bar is centered on the path with the local perpendicular. Default start offset equals its half-size, crossing the line. |
| Source-matching colors and no underline (#21) | These are already implemented and must remain unchanged. | Existing dark/light gallery and theory navigation browser tests, plus palette and hover tests, continue to run. Share icon removal does not remove card navigation. |
| Controls match supplied images/URLs and shared output (#21) | Defaults may improve but explicitly selected values must remain explicit. | Both supplied URLs and edited controls are reloaded and compared with their SVGs in Chromium/Firefox/WebKit. Numeric values retain their existing meaning/units and explicit values are not silently replaced by defaults. |
| Keep all non-editor geometry (#21) | Rain/gallery/theory must preserve their established construction. | Legacy `SHAPE` defaults and rotation branch are preserved. Existing stored SHA-256 gallery baselines cover every 1–3-link configuration plus sampled 4-link configurations byte for byte. |
| Deep case study, logs/data, research and diagnostics | Safari's intermittent pixel loss cannot be attributed to a specific driver/browser defect solely from screenshots. | Archive evidence and measured counts; distinguish proven local defects from compositor inference. `localStorage['ui.debug']='1'` enables observer totals/active counts, off by default. No third-party bug is asserted without a standalone reproduction. |

Angles remain degrees, as the existing controls and shared URLs specify. The
issue's percentages describe the visual bend rather than a request to reinterpret
old degree-valued URLs. Leaving/entering approach angles remain equal at 30°:
these define the balanced loop/reference construction; bend, per-link turns,
layout rotation, marker rotation and loop bend all have neutral zero defaults.

## Rendering analysis and limits

The reproducible local defect is **unbounded filter requests**, not a CSS rule
turning off the top bar. Its computed blur remains `blur(14px)` even in the old
large-gallery run. The two supplied Safari screenshots are the evidence of actual
intermittent pixel loss. Native macOS WebKit now passes the full reported 4,131-card load, repeated
scrolling and actual display-pixel blur checks in all three skins. This verifies
the mitigation on that platform; it does not identify or independently reproduce
the original intermittent Safari/OS/GPU failure. The solution removes the avoidable pressure at its
source, preserves the visual design in view and verifies that offscreen filters
stay disabled when lists grow or skins change. It does not claim that computed
CSS alone proves pixel blur. Final screenshots and the Safari originals are
retained for human comparison.

IntersectionObserver is asynchronous. The 200px margin activates panels before
ordinary scrolling reaches them; a jump can require one observer delivery before
newly visible panels acquire their blur. Content, dimensions, links, keyboard
focus and print layout remain available. Without the observer API the original
presentation remains as a progressive-enhancement fallback.

The collision objective is a sampled heuristic for line overlap, not a guarantee
that every graph can be drawn without intersections. Applying its result never
increases that measured objective. Pair scores are cached for gap candidates;
when changed fitting affects image-unit cuts, the complete score is recalculated.
A dense 24-link probe fell from 34.95s to 4.81s with the same 114.25 → 74 score;
a regression test rejects the former cost with a generous 10s budget. A separate
independent final-fit probe caught two cuts exceeding their budget after later
reference-gap changes; the final budget pass and a reproducing test cover that
case. New automatic center cuts are limited and penalized, rather than hiding
whole links. Manual cuts retain their full exposed
range; inherited controls continue to track global edits.

## Research and alternatives

Sources were consulted online on 2026-10-26; local snapshots are in `research/`.

- [WebKit: Introducing Backdrop Filters](https://webkit.org/blog/3632/introducing-backdrop-filters/)
  describes the extra rendering passes required for backdrop effects. Combined
  with the measured surface count this supports reducing offscreen filters.
  It does not identify the user's particular Safari/OS/GPU failure.
- [W3C Intersection Observer](https://www.w3.org/TR/intersection-observer/)
  defines asynchronous visibility delivery and positive root margins. A shared
  observer fits these ordinary DOM lists; it avoids a new rendering framework.
- [SVG 2 paths, directionality and distance](https://www.w3.org/TR/SVG/paths.html)
  specifies direction at a distance along the curve. The implementation uses
  bounded 256-step length tables and analytic cubic derivatives. Tests compare
  against native `getPointAtLength` independently of the helper.
- [Bezier.js](https://github.com/Pomax/bezierjs) offers derivatives, subdivision,
  lengths and lookup tables. [svg-path-properties](https://github.com/rveciana/svg-path-properties)
  exposes path length/point/tangent functions without a browser. Both are viable
  for a general SVG path importer. Here all paths are two known cubics; extending
  the existing de Casteljau helper keeps browser and export geometry identical
  without adding a dependency or reparsing rounded SVG strings.
- Full list virtualization (e.g. [TanStack Virtual](https://github.com/TanStack/virtual))
  would reduce DOM nodes as well as filters, but changes scroll height/focus,
  search and card accessibility. Viewport-based filter activation directly
  addresses measured pressure without removing content. `content-visibility`
  alone leaves filter allocation behavior dependent on engine heuristics.
- Disabling all panel blur or forcing permanent GPU layers would change the
  requested skin or risk retaining more surfaces. Neither is needed for the
  measured issue. The header's visible blur remains enabled.

The first implementation CI run, 40273493595 (`a20ae9c`, 05:18 UTC), passed all
three existing suites on all three Linux engines but failed the new pixel check
in Firefox and WebKit (`header blur must affect actual pixels (0)`). Downloaded
logs are in `ci-logs/`; Firefox's failing assertion is at lines 847–858 of its
job log. These are fresh runs after the implementation, not the prepared-branch
pass listed above.

A standalone HTML fixture separated two test-platform limitations from the
application. On Firefox 155, display capture changes exactly 128,000 pixels when
blur is disabled, while `page.screenshot()` changes zero. This confirms the
snapshot API omits a visibly rendered effect. Mozilla tracks the non-WebRender
snapshot path in [bug 1657997](https://bugzilla.mozilla.org/show_bug.cgi?id=1657997).
The new [Playwright report #43646](https://github.com/microsoft/playwright/issues/43646)
contains a complete reproduction, a framebuffer-capture workaround and a suggested
investigation of its `drawSnapshot` implementation. It is a test tooling defect,
not an explanation for the original Safari blink.

The Linux WebKit GTK display in this container also omits blur in that minimal
fixture; changing screenshot methods does not restore it. Its EGL startup
reports unavailable DRI3 acceleration. The official
[WebKit graphics documentation](https://docs.webkit.org/Ports/WebKitGTK%20and%20WPE%20WebKit/Graphics.html)
distinguishes its accelerated and non-accelerated drawing paths. Forcing
compositing/always-on acceleration did not enable the effect in this container;
those bounded attempts are archived and not counted as passes. WebKit's matrix
entry now runs on macOS to test the reported platform, with native display
capture. Linux Chromium/Firefox use Xvfb display capture. All three engines must
still pass the actual-pixel assertion for all three skins. No assertion is
silently skipped or replaced with computed CSS. The standalone fixture is
`experiments/issue-23-blur-probe.mjs`, with a dependency-free capture helper.
Early `*-probe-*` images/logs are calibration data; only the stable standalone
`*-minimal-*` captures establish the API/display difference.

The repository already pins
Playwright 1.63 because of the separately reported Linux WebKit regression
[microsoft/playwright#43426](https://github.com/microsoft/playwright/issues/43426)
from the earlier study. This fix preserves that pin; it does not present that
unrelated report as completion of #23. A vendor report about the original Safari blink would require an
isolated OS/version/GPU reproduction; the archived originals and optional panel
counts preserve the information needed to investigate any recurrence.

## Reproduction and verification

```sh
npm ci
npx playwright install chromium firefox webkit
npm run test:ci -- --maxWorkers=1
npm run check
npm audit --audit-level=moderate
npm run build
ENGINE=chromium npm run test:network:browser
ENGINE=chromium npm run test:network:issue19
ENGINE=chromium npm run test:network:issue21
ENGINE=chromium npm run test:network:issue23
node experiments/issue-23-alignment.mjs
npm run build:cv
```

Repeat the four network suites with Firefox and WebKit. CI runs all four in its
three-engine matrix and uploads data/screenshots even on failure. For issue #23's
pixel probe, Firefox needs display capture; WebKit runs on macOS rather than the
non-accelerated Linux GTK renderer. On Linux:

```sh
mkdir -p /tmp/issue23-display
ENGINE=firefox XWD_FILE=/tmp/issue23-display/Xvfb_screen0 \
  xvfb-run -a -s '-screen 0 1600x1200x24 -fbdir /tmp/issue23-display' \
  npm run test:network:issue23
```

On macOS, use `ENGINE=webkit DISPLAY_CAPTURE=1 npm run test:network:issue23`.
The standalone fixture uses a smaller 1600×700×24 display and does not need a
production build. It prints changed-pixel counts for both capture methods.
The long-gallery experiment is finite and should run under the existing memory
guard in this 2.92GiB container:

```sh
PROBE_SECONDS=120 PROBE_RSS_BYTES=1600000000 CARD_BATCHES=8 \
  python3 experiments/issue-19-memory-guard.py node experiments/issue-23-browser.mjs
```

`issue-23-baseline.mjs` was run against the **old** build before replacement; it
captures the old state and must not be used to label a current build as baseline.
`issue-23-solver.mjs` is a small, deterministic gap-only experiment. The finite
`issue-23-solver-scale.mjs` records cost at 3/6/12/24 links;
`issue-23-solver-caps.mjs` independently measures the final fitted cut budgets. Logs are
retained under `logs/`, browser measurements under `data/` and comparison images
under `screenshots/`. The final validation inventory is recorded in `VALIDATION.md`.

The first macOS matrix run (40275047300, `1098eca`) passed PNG/JPEG/SVG
downloads but the old export harness timed out waiting for a WebP download
(`ci-logs/webkit-macos-40275047300.log:442`). The app already rejects unavailable
canvas encoders with an explicit PNG alternative. The harness now probes actual
encoder support and verifies that message when WebP is unavailable; formats
that can be encoded still require real files, MIME signatures and image
dimensions. Independent browser suites continue after a sibling suite fails,
while the job still fails if any suite fails. In that run, Chromium and Firefox
passed all four suites, with real display blur in all skins; complete artifacts
are archived under `ci-evidence/40275047300/`.

## Final native-display browser evidence

Run [40275956453](https://github.com/konard/konard.github.io/actions/runs/40275956453),
created 2026-10-26 05:45:33 UTC at `0bc96b4296c5e904e8674cb37431f3801b0da18c`,
passes **all four browser suites in every engine**. Each engine loads the exact
reported 4,131 cards and repeatedly scrolls all three skins, with zero page
errors. Between 55 and 176 card filters remain active across the recorded
samples; the original code retained all 4,131. Native SVG marker error is below
0.0026 image units in every engine; the gap-only solver improves 6.5 → 3.8 and
its applied/shared result matches the preview. Complete downloaded artifacts
are in `ci-evidence/40275956453/`, including all measurements and screenshots.

| Engine / platform | Glass changed pixels | Liquid changed pixels | Futuristic changed pixels |
| --- | ---: | ---: | ---: |
| Chromium 153 / Ubuntu 24.04 | 132,706 | 72,235 | 125,621 |
| Firefox 155 / Ubuntu 24.04 | 134,525 | 72,488 | 127,151 |
| WebKit 26.6 / macOS 15 | 88,706 | 53,276 | 81,751 |

Counts compare a fixed stripe fixture behind the real header, with and without
its blur. Every value exceeds the same 5,000-pixel assertion. Linux captures
read the 1,600×1,200 Xvfb framebuffer; macOS captures read its 1,024×768 native
display, including the visible browser window. The macOS display clips the
right side of the larger browser viewport, so counts are not a cross-platform
quality ranking. Ordinary viewport screenshots are also retained. Element-only
mobile captures can include the sticky header over scrolled content; the clean
mobile control render in `screenshots/mobile-gaps.png` is used for review.

![Native macOS WebKit gallery after 4,131 cards](ci-evidence/40275956453/webkit/screenshots/issue23/webkit-after-gallery-glass-display.png)

The complete workflow also passes all 710 unit tests, builds, dependency/security
and formatting checks, workflow lint, and all 120 CV PDFs. Deployment remains
skipped on pull requests by design. See `VALIDATION.md` for log line references.
Final evidence-only commit checks are tracked on PR #24; the archived source run
remains the reproducible baseline for these unchanged application sources.
