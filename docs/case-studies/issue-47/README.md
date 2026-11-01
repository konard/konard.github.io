# Case study: issue #47 — transparent corners, corners for every level and size, and the notes of the issue comment

- Issue: https://github.com/konard/konard.github.io/issues/47 (created 2026-11-01T10:53:19Z)
- The issue comment: https://github.com/konard/konard.github.io/issues/47#issuecomment-6557458340 (2026-11-01T11:42:09Z)
- Pull request: https://github.com/konard/konard.github.io/pull/48
- Builds on: [issue #45](../issue-45/README.md) (one frame for every bordered element) and [issue #15](../issue-15/README.md)
  (the futuristic skin and its custom frame)
- Data: [`data/issue-47.json`](data/issue-47.json) (the issue and its comment), [`data/pr-48.json`](data/pr-48.json) (the pull
  request and its comments), [`data/issue-45.json`](data/issue-45.json) and [`data/pr-46.json`](data/pr-46.json) (the issue the
  first comment says was not fully delivered), [`data/associative-tech-stack.md`](data/associative-tech-stack.md) (a copy of
  the document the comment points to), the measurements named in each section below
- Images of the issue: [`images/issue-screenshot.png`](images/issue-screenshot.png),
  [`images/comment-articles-section.png`](images/comment-articles-section.png),
  [`images/comment-articles-stats.jpg`](images/comment-articles-stats.jpg)

## 1. The issue and its comment

The issue body, with a screenshot of a chart panel ([`images/issue-screenshot.png`](images/issue-screenshot.png)):

> The left upper corner is not transparent, as well as top bottom. They must be transparent as all for all other
> elements by default.
>
> Also each type of `INTERFACE CONTROLS` must have separate `CORNERS OF THE FRAME`, so on each level I should be able
> to configure it fully.
>
> I think requirements of https://github.com/konard/konard.github.io/issues/45 were not fully delivered.

It then asks for a deep case study in this folder, for debug output where a root cause is not clear, for issues in
other repositories where a problem belongs to them, and for every fix to be applied to the whole codebase.

The comment, posted six minutes after the pull request was opened, adds twelve notes (C1–C12 below): an animations
button, a configurable ring under the photo, SVG icons instead of emojis, a rain that flickers, rendering performance,
corners that depend on the size of an element, Links Notation instead of JSON, the associative technology stack, the
wording of the Habr articles and stat tile, a check of every number, and a manual exclusion of one repository.

## 2. Timeline

All times are UTC on 2026-11-01.

| Time | Event |
| --- | --- |
| 10:53 | Issue #47 is opened |
| 11:36–11:37 | The branch and draft pull request #48 are created (19f2107) |
| 11:42 | The issue comment with the twelve notes |
| 11:44 | d47c72b: the issue screenshot and [`experiments/issue-47-corners.mjs`](../../../experiments/issue-47-corners.mjs), which finds every corner that is not transparent |
| 11:51 | 8f90459: charts are cut to the outline of their frame; their tooltips are drawn outside them (R1) |
| 12:20 | 282ff5c: inner blocks and every type of control get corners of their own (R2) |
| 13:13–13:16 | The first working session stops with an error; its log is attached to the pull request |
| 15:38 | The owner asks to recover and to deliver the issue and every note of the comment |
| 15:43 | 89fca63: a level that follows the panels has no rules of its own, so own corners do not slow every restyle |
| 16:05 | 23f6e84: the vendored CesiumJS copy in PavelChurkin/digital_twin_Earth is excluded from the source lines (C11) |
| 16:08 | a4f890c: which Habr articles are the owner's and which the team's, with a footnote (C9, C12) |
| 16:24 | 82f2987: the rain steps on display frames and clears the alpha the 8-bit fading leaves (C4) |
| 16:28 | ef8cb07: the animations button next to the sound button (C1) |
| 16:28–16:33 | 33566b8, 75e41b6, e0638fe: the numbers that did not match their sources (C10) |
| 16:35 | 7738b9e: the ring under the photo is configurable (C2) |
| 16:59 | 2441043: SVG icons instead of emojis and glyphs, and the number audit (C3, C10) |
| 17:21 | 8b342e8: corners by the minimum and maximum width and height of an element (C6) |
| 17:34 | eb63d96: settings, saved looks, share links and network styles in Links Notation (C7); upstream issue link-foundation/lino-objects-codec#79 (R6) |
| 17:48 | f11168a: the data of the site in Links Notation (C7) |
| 18:01 | bc1c2a7: the browser checks find the download buttons and sliders by name and id (CI) |
| 18:42 | 07b1ba0: the Habr cards float in a plain wrapper, so the framed cards are not restyled on every frame (C5) |
| later | The preview and sample sliders get ids for the browser check; this case study |

## 3. Requirements

### From the issue

| # | Requirement | Solution | Evidence |
| --- | --- | --- | --- |
| R1 | The corners of the chart panel (top left, top and bottom) are not transparent; every element must have transparent corners by default | Root cause in section 4.1. Charts are cut by `clip-path` to the frame outline like every other panel; their tooltips are portalled to `.app` (or the body) so the cut does not hide them | `src/skins.issue-47.test.jsx`; `experiments/issue-47-corners.mjs` checks the corner pixels of every framed element in a browser; the CI step "frames, corner layer, overflow and palettes" of issue #45 passes on chromium, firefox and webkit |
| R2 | Every type of interface control has its own corners, fully configurable on every level | `src/skins.frames.levels.js` and the generated `src/skins.frames.level-*.css`: levels panel, block, button, field, tab, chip, menu and table. Each level can follow the panels or have its own shape, line, size and width of every corner, the edges, edge style and side widths | `src/skins.issue-47.levels.test.jsx`; the settings page "Corners" section with a level chooser |
| R3 | Issue #45 was not fully delivered | Audit in section 6 | section 6 |
| R4 | Collect the data and write a deep case study | this file, `data/`, `images/`, `screenshots/` | — |
| R5 | Debug output where a root cause is not clear | `localStorage.setItem('rain.debug', '1')` logs the cadence of the rain once a second (`src/visuals/rain.js`); `localStorage.debugFrameFit = '1'` logs every element whose size mark changes (`src/frameFit.js`); `localStorage.setItem('ui.debug', '1')` logs panel visibility (`src/components/panelVisibility.js`). All are off by default | the code |
| R6 | Report problems that belong to other repositories, with a reproduction, workarounds and a suggested fix | https://github.com/link-foundation/lino-objects-codec/issues/79: the codec reads `process.env` without a guard and throws in a browser; workaround `setDebugEnabled(false)` in `src/lino.js` | the issue; `experiments/issue-47-lino-browser-globals.mjs` |
| R7 | Apply every fix to the whole codebase | Each fix below names every place it covers (all framed elements, all levels, all icons, all numbers, all JSON) | the tests named below |

### From the comment

| # | Note | Solution | Evidence |
| --- | --- | --- | --- |
| C1 | A button next to the sound button turns animations off and on | `PrefSwitches.jsx`: an "Animations" button with Orbit/Pause icons sets `motion.mode` (auto, on, off; `data-motion-mode` on the root). Off stops the background layers and the interface animations | `src/components/prefs-motion-47.test.jsx` |
| C2 | The rotating square under the avatar is configurable: speed, size, a static angle and so on | `avatar.ring`, `avatar.ringShape`, `avatar.photoShape`, `avatar.spin` (clockwise, counter-clockwise, still), `avatar.period` 1–60 s, `avatar.angle` −180–180°, `avatar.ringWidth` 0–40, `avatar.glow` 0–80 | `src/settings/avatar-47.test.js`; [screenshot](screenshots/avatar-ring-settings.png) |
| C3 | High-quality icons for the social networks, SVG instead of emojis everywhere | Brand icons from Simple Icons (CC0), interface icons from Lucide (ISC); only the used paths are bundled. Contacts, stat tiles, stars, skills, bio words and buttons. `experiments/issue-47-glyph-scan.mjs` finds the remaining glyphs: only the notation arrows → and ↦, which are text, not icons | `src/components/icons-47.test.jsx`; [contacts](screenshots/icons-contacts.png), [skills](screenshots/icons-skills.png), [hero](screenshots/icons-hero-text.png) |
| C4 | The data rain flickers or is not drawn at equal intervals | Root cause in section 4.2 | `src/visuals/rain-cadence-47.test.js`; [`data/rain-cadence-before.json`](data/rain-cadence-before.json), [`data/rain-cadence-after.json`](data/rain-cadence-after.json), [`data/rain-residue.jsonl`](data/rain-residue.jsonl) |
| C5 | The highest rendering performance with the same visuals | Section 5 | `src/components/habr-float-47.test.jsx`; [`data/habr-float-visuals.json`](data/habr-float-visuals.json) |
| C6 | Corners configurable by the minimum or maximum width and height of an element | Section 7 | `src/frameFit-47.test.js`; [before](screenshots/frame-fit-before.png), [after](screenshots/frame-fit-after.png), [settings](screenshots/frame-fit-settings.png) |
| C7 | Indented Links Notation instead of JSON everywhere | Section 8 | `src/lino-47.test.js`; [settings screenshot](screenshots/settings-links-notation.png) |
| C8 | The associative technology stack in all applicable places | Section 9 | section 9 |
| C9 | The Habr articles were mostly crafted with the owner's participation, in consultation with him or under his direction | `HabrCards.jsx`: "13 articles (4 by me, 9 by the team) (\*\*)", a "by me" / "by @alias" line on each card, and the footnote "(\*\*) 4 of the 13 articles are written by me. The other 9 are written by members of the Deep.Foundation team; most of them were crafted with my direct participation, in consultation with me or under my direction. Views, bookmarks and other figures here count all 13." (English and Russian) | `src/components/habr-authorship-47.test.jsx` |
| C10 | Every number matches its source | [`data/number-audit.md`](data/number-audit.md): every displayed number recomputed from its source; ten mismatches found and fixed (33566b8, 75e41b6, a4f890c, e0638fe). Hand-written figures are now computed from the data (`src/data/figures.js`) | `src/data/figures.test.js`, `src/components/numbers-47.test.jsx`, `src/cv/cv.test.jsx` |
| C11 | Exclude PavelChurkin/digital_twin_Earth (2,235,588 lines) by hand | `src/data/source-lines-exclusions.lino` names the repository, its commit, its line count and the reason (a vendored copy of CesiumJS); `scripts/build-indicators.cjs` skips it and fails if the measured commit or count changes. JavaScript drops from 5,596,680 to 3,777,777 lines; the page lists the exclusion | `src/data/indicators.test.js` |
| C12 | The Habr stat tile suggests every article is the owner's; adjust the wording, with (\*) notes or separate statements, as other sites do | The tile reads "Views of Habr articles on links theory & Deep" with the hint "4 articles by me, 9 articles by the Deep.Foundation team · snapshot of 2026-10-28" and a (\*\*) mark that links to the footnote. Research in section 10 | `src/components/habr-authorship-47.test.jsx` |

## 4. Root causes

### 4.1 Corners of the charts were not transparent (R1)

Every framed panel of the futuristic skin is cut to its outline by `clip-path`, which makes the cut corners
transparent. Charts were left out of the cut, because their tooltips overflow the panel and the cut would hide them.
The panel background and border therefore filled the whole rectangle of a chart, corners included, which is what the
screenshot shows. The fix cuts charts like every other panel and portals the tooltip out of the chart (to `.app`,
or the body), so nothing needs to overflow. `experiments/issue-47-corners.mjs` samples the corner pixels of every
framed element on the pages and found no other element with this problem.

### 4.2 The rain did not step at equal intervals and left a residue (C4)

Two separate causes, both measured with [`experiments/issue-47-rain-cadence.mjs`](../../../experiments/issue-47-rain-cadence.mjs)
(which hooks the fading `fillRect` of `.cosmos__rain` and the requestAnimationFrame timestamps):

1. **Timer against the display.** The rain was driven by `setInterval(frame, 105)`, while the other layers draw on
   requestAnimationFrame. 105 ms is 6.3 frames at 60 Hz, so steps landed 6 or 7 frames apart, and a late timer could
   run two steps before the next frame was painted. Before: intervals with a standard deviation of 62.5 ms, a third
   of them uneven, and 14 frames with two steps ([`data/rain-cadence-before.json`](data/rain-cadence-before.json)).
   After: the rain counts display frames and steps every `round(step / frame)` frames (6 at 60 Hz, 13 at 120 Hz,
   measured from the median frame gap); every step was 6 frames apart and no frame had two
   ([`data/rain-cadence-after.json`](data/rain-cadence-after.json)).
2. **8-bit alpha residue.** The trails fade with `destination-out` at 7.5% a step. With 8-bit alpha,
   `round(a × 0.925) = a` for a ≤ 6, so faint pixels never disappear: 254,966 of 294,744 lit pixels were such
   leftovers before the fix. Once a second the canvas is now drawn onto itself through an SVG `feFuncA` filter that
   subtracts 0.035 from alpha (the floor). WebKit has no `ctx.filter`, so there the floor is cleared in bands of rows
   instead; [`data/rain-residue.jsonl`](data/rain-residue.jsonl) shows chromium, firefox and webkit clearing the
   residue ([`experiments/issue-47-rain-residue.mjs`](../../../experiments/issue-47-rain-residue.mjs)).

A limit of the measurement: headless WebKit stops calling requestAnimationFrame after about three frames on this site
(on main as well), while timers keep running; `experiments/issue-47-webkit-raf-probe.mjs` shows it. The rain falls back
to a timer where requestAnimationFrame is missing.

### 4.3 The browser checks failed after the icons and the size limits (CI)

- The icons of C3 replaced the ⤓ glyph of the download buttons with an SVG that is hidden from assistive technology,
  so the button names changed and the checks that clicked "⤓ PNG" waited for nothing. They now find the buttons by
  their names without the glyph (bc1c2a7).
- The keyboard audit of issue #27 walked the sliders of the settings page by position. Pressing End on a size limit
  of C6 reveals more sliders, so the position pointed at another slider. bc1c2a7 made it walk by id, re-scanning for
  sliders that appear; then the run stopped at "every slider has an id", because the preview slider, the sample slider
  and the channel sliders of the colour chooser had none. They now have ids (`ui-preview-slider`,
  `ui-samples-slider`, `<chooser>-red|green|blue`), and `src/pages/slider-ids-47.test.jsx` checks every slider of the
  settings page has a unique id.

## 5. Rendering performance (C5)

"Double check that we use maximum possible performance for UI/UX rendering with the same visuals."

Method (all in `experiments/`):

- `issue-47-render-performance.mjs` measures six pages in Chromium for 5 s: requestAnimationFrame gaps, long tasks and
  the CDP style, layout and script time, with animations on and off
  ([on](data/render-performance-animations-on.json), [off](data/render-performance-animations-off.json)).
- `issue-47-paint-probe.mjs` turns off one kind of drawing at a time (backdrop filter, filter, box shadow, clip path,
  CSS animations, each background layer) and measures the frames.
- `issue-47-trace-probe.mjs` sums a Chromium trace by thread and event, and counts style recalculations and the
  elements they touch; `issue-47-animations-list.mjs`, `issue-47-composited-animations.mjs` and
  `issue-47-selector-stats.mjs` list the running animations, the ones the compositor cannot run, and the cost of
  selectors.

Findings:

- The home page was the only page with heavy main-thread style work while idle: 191 ms of style recalculation in 5 s.
  Turning CSS animations off removed it.
- The cause was the `float` animation of the 13 Habr cards. It runs on the compositor (transform only), but Blink still
  restyles an element with a running animation on every frame it produces, and the background canvases ask for a frame
  on every display refresh. Each card is a framed panel (outline, corner pseudo-elements, custom properties, content),
  so each recalculation restyled about 150 elements. Selector matching was only about 15 ms of the total, so the cost
  was the restyle itself, not the selectors.
- The fix (07b1ba0) moves the float to a plain list item around the card. Per recalculation the main thread went from
  23.5 ms (614 elements in 4 recalculations) to 4.1 ms (440 elements in 7), see
  [`data/trace-home-before.json`](data/trace-home-before.json) and [`data/trace-home-after.json`](data/trace-home-after.json).
- The same visuals: with all animations paused at the same moment, the cards differ in 2 pixels by 1 level of one
  channel (antialiasing), and the hovered card is byte-identical, with the same boxes
  ([`data/habr-float-visuals.json`](data/habr-float-visuals.json), `issue-47-habr-float-shot.mjs`, `issue-47-png-diff.mjs`).
  The card keeps `transform: none`, as its own animation used to override the lift of a hovered panel in the
  futuristic skin.
- Other pages run only the blinking cursor of the navigation, plus the flowing lines of /research/. The compositor
  cannot run 24 `stroke-dashoffset` lines, 2 `clip-path` glitch layers and 1 `box-shadow` pulse on the home page; they
  are small and left alone.
- Already in place: the nebula uses WebGL with `antialias: false, alpha: false, powerPreference: 'low-power'`;
  `src/visuals/governor.js` lowers the resolution and frame rate of the background on slow devices; the background
  stops when the tab is hidden or animations are off; 89fca63 keeps the own-corner rules of the levels from slowing
  every restyle.

Limits: this machine has no GPU, so its headless Chromium composites in software and reads the WebGL canvas back with
`ReadPixels`; whole frames take 400–600 ms here and do not represent real devices. The numbers above compare the main
thread style work only, which does not depend on the GPU.

## 6. Issue #45, re-checked (R3)

The requirements of issue #45 are listed in [its case study](../issue-45/README.md) (R1–R12). Re-checked against the
code and the tests:

- **Not fully delivered: "outer panels, inner blocks and buttons and other bordered elements have the same each side
  border configuration".** Issue #45 gave blocks and controls only a scale of the panel corners
  (`corner.blockScale`, `corner.controlScale`). Now every level (block, button, field, tab, chip, menu, table) can
  have the full set of the panels: the shape, line, size and width of every corner, the edges, the edge style and the
  width of each side (282ff5c, R2). The scales stay for levels that follow the panels.
- **Not fully delivered: "handle transparent background".** Charts kept opaque corners (R1, 8f90459).
- The rest (the default look, overflow cut, selection, top highlight width, the corner layer, the samples of every
  element, the palettes) is covered by the existing tests (`skins.issue-45.test.jsx`, `pages/issue-45.test.jsx`,
  `ColorInput.test.jsx`) and the issue #45 browser step of CI, which passes on all three engines.

## 7. Corners by the size of an element (C6)

- Every level has four limits — `FitMinWidth`, `FitMaxWidth`, `FitMinHeight`, `FitMaxHeight` (0 = no limit) — and a
  factor `FitScale` (0–1, default 0.5): an element outside a limit draws its corners at that factor; 0 draws a plain
  rectangle with edges.
- CSS cannot query the size of the element itself (container queries measure an ancestor), so `src/frameFit.js`
  watches the framed elements with one `ResizeObserver` and marks the ones outside the limits with `data-fx-fit`. Only
  the elements of levels with limits are watched, and a mark is written only when it changes.
- The custom properties of the corner sizes are set on the root and do not inherit as numbers per element, so the
  factor multiplies the final corner lengths in the draw properties of the marked element
  (`src/skins.frames.fit.js` generates `src/skins.frames.fit.css`). A known effect: the thickness of ticks and notches
  scales with the factor too.
- Screenshots: [before](screenshots/frame-fit-before.png), [after](screenshots/frame-fit-after.png) (buttons taller
  than 40 px draw no corners), [settings](screenshots/frame-fit-settings.png).

## 8. Links Notation instead of JSON (C7)

- Settings in localStorage, the "Your changes" box, saved looks, exports, share links and network styles are written as
  indented Links Notation (`settings:` followed by `key value` lines); JSON from before is still read
  (eb63d96). `src/settings/notation.js` reads and writes the stored settings without the codec, because it is also
  inlined into the page head to apply the settings before the first paint.
- The other places use [`lino-objects-codec`](https://github.com/link-foundation/lino-objects-codec) (`src/lino.js`).
  Its module imports the parser at the top, so it costs about 55 kB (14.5 kB gzip); it is loaded only by the pages that
  write notation (settings, looks, network), not by the data pages.
- The data of the site (`src/data/*.lino`: GitHub, Habr, indicators, posts, repositories, the source-line exclusions)
  are Links Notation (f11168a). The generator scripts write them with the codec, and the `linoData()` Vite plugin turns
  each into `JSON.parse("…")` at build time, so the browser does not parse notation for them. This makes the chunks a
  little larger (RepoList 87.0 → 88.6 kB gzip) and is faster to start than an object literal for data over 10 kB
  (https://v8.dev/blog/cost-of-javascript-2019#json).
- What stays JSON: `package.json` and the web manifest (their tools require it), `build-info.json` (read by the deploy
  probe), and the raw API evidence in the case studies.
- Upstream: the codec reads `process.env` without a guard and throws in browsers; reported with a reproduction, the
  workaround and a fix as https://github.com/link-foundation/lino-objects-codec/issues/79.

## 9. The associative technology stack (C8)

From [`data/associative-tech-stack.md`](data/associative-tech-stack.md):

| Component | Here | Why |
| --- | --- | --- |
| links-notation | used | the network page and the codec |
| lino-objects-codec | used | settings, looks, share links, network styles and the data of the site (section 8) |
| lino-i18n | not used | the site has no translation catalogs: 303 inline `t({ en, ru })` pairs in 69 files. Moving them to keyed `.lino` catalogs would be a rewrite visitors never see, and its runtime brings intl-messageformat |
| lino-arguments | not applicable | for command-line programs; the site has only small build scripts |
| command-stream | not applicable | for shell scripts in Bun/Node; the build scripts need none |
| doublets-web (WASM) | not applicable | the only state the site stores is a short list of settings in localStorage |
| meta-language | not applicable | the site does not edit source text |
| link-calculator | not applicable | not published on npm, and the site calculates nothing in that domain |
| link-cli, doublets-rs | not applicable | Rust storage for servers |
| web-capture, web-search | not applicable | services; the site is static |
| Agent CLI, Hive Mind | development tools | this pull request is made with them |

## 10. Research for the Habr wording (C12)

How contribution is credited elsewhere:

- The CRediT taxonomy names 14 contributor roles, among them conceptualization and supervision, each with a degree
  (lead, equal, supporting): https://authors.wiley.com/author-resources/Journal-Authors/open-access/credit.html,
  https://sheffield.ac.uk/openresearch/home/contributor-role-taxonomy-credit.
- The ICMJE recommendations list as authors only those who meet all the authorship criteria and acknowledge the other
  contributors separately: https://www.icmje.org/icmje-recommendations.pdf.

So the site separates the two groups: authored articles are counted as "by me", the team's articles as "by the
Deep.Foundation team", and the owner's part in the latter (participation, consultation, direction — the
conceptualization and supervision roles) is stated in a footnote rather than in the count.

## 11. Validation

- Unit tests (vitest, jsdom), each failing before its fix: `skins.issue-47.test.jsx`, `skins.issue-47.levels.test.jsx`,
  `frameFit-47.test.js`, `lino-47.test.js`, `components/prefs-motion-47.test.jsx`, `components/icons-47.test.jsx`,
  `components/habr-authorship-47.test.jsx`, `components/habr-float-47.test.jsx`, `components/numbers-47.test.jsx`,
  `settings/avatar-47.test.js`, `visuals/rain-cadence-47.test.js`, `pages/slider-ids-47.test.jsx`,
  `data/figures.test.js`, `data/indicators.test.js`.
- Browser checks in CI on chromium, firefox and webkit: the network editor, the keyboard audit of every slider, the
  frames of issues #39 and #45.
- Experiments in `experiments/issue-47-*.mjs`, with their results in `data/`.
