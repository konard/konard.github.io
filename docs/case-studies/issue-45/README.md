# Case study: issue #45 — the Matrix universe look as the default, one frame for every bordered element, and colour palettes

- Issue: https://github.com/konard/konard.github.io/issues/45 (created 2026-10-31T11:38:02Z, no comments)
- Pull request: https://github.com/konard/konard.github.io/pull/46
- Builds on: [issue #15](../issue-15/README.md) (the futuristic skin and its custom frame) and
  [issue #39](../issue-39/README.md) (the settings page)
- Data: [`data/issue.json`](data/issue.json) (the full issue), [`data/matrix-universe.json`](data/matrix-universe.json)
  (the look given in the issue), [`data/pr-initial.json`](data/pr-initial.json) (the pull request as it was opened)

## 1. The issue

The issue gives a full settings JSON ([`data/matrix-universe.json`](data/matrix-universe.json)) and says "That is
defaults." Then, in short:

> We also need to double check that outer panels, inner blocks and buttons and other bordered elements have the same
> each side border configuration we have for outer panels.
>
> Also not all border configurations correctly slice content inside the block if it does not fit, and not all of
> configuration correctly handle transparent background, selection and so on. That is visible on settings page, so we
> should have more configuration.
>
> It is also important to have more configuration for width of highlight on top, more configuration about width of
> borders on corners and on sides separately.
>
> Also it should be possible to configure layout of border corners (by default on top), but they should cover
> highlights on the left side for positions and so on.
>
> Double check also where we can add more configuration and also make this preset even more perfect to eye.
>
> Meaning we should catch glitches and fix them […] for that we should be able to render small samples of each UI/UX
> elements and so on.
>
> For color configuration we should have ability to select palettes of colors, not only use sliders to select colors,
> for user to select best neon and pastel colors and so on. So it fast and easy to use.
>
> We need to collect data related about the issue to this repository […] deep case study analysis (also make sure to
> search online for additional facts and data), list of each and all requirements […] propose possible solutions and
> solution plans for each requirement (we should also check known existing components/libraries […]).

## 2. Requirements

| # | Requirement (from the issue) | Solution | Evidence |
| --- | --- | --- | --- |
| R1 | The given JSON is the default look; a preset named "Matrix universe" | `src/settings/schema.defaults.js` overrides the defaults with the JSON. `src/settings/presets.js` has "Matrix universe" (the defaults) and "Glass universe" (the old defaults, so nothing is lost) | `settings.test.js`: "uses the look of issue #45 as the defaults, so that look saves as no changes"; `presets.test.js`: "keeps the defaults before issue #45 as the Glass universe…" |
| R2 | Outer panels, inner blocks, buttons and other bordered elements have the same per-side and per-corner frame | `src/skins.frames.js` draws the custom frame on `PANELS` (32 selectors), `BLOCKS` (panels in panels, list items) and `CONTROLS` (buttons, fields, chips, tags, selects, menus). Each group has its own corner scale: `corner.blockScale` (0.6) and `corner.controlScale` (0.35) | `skins.issue-45.test.jsx`: "frames outer panels, inner blocks and controls", "scales the corners down…", "cuts the controls by the frame…"; screenshot [after/samples/dark/custom.png](screenshots/after/samples/dark/custom.png) |
| R2a | The old look of blocks and controls is still possible | `corner.blocks` = frame / line, `corner.controls` = frame / border | "can draw inner blocks with a plain line instead"; [after/samples/dark/border-controls.png](screenshots/after/samples/dark/border-controls.png) |
| R3 | Content that does not fit is cut at the frame | `ui.overflow` = clip (default) / visible: `overflow: clip` on every panel except those with a tooltip, plus `clip-path` on every panel of the futuristic skin | "cuts the content that does not fit at the frame of every panel"; the "overflow" sample |
| R4 | Transparent backgrounds and selection | `ui.selection` = accent / accent2 / system and `ui.selectionOpacity`. The colour chooser and the menu stay readable with a fully transparent surface | "selects text in the accent unless the system colour is chosen"; [after/samples/dark/transparent.png](screenshots/after/samples/dark/transparent.png) |
| R5 | Width of the top highlight | `future.accentWidth` (−1 = automatic), `future.accentMax` (longest share of the panel), `future.accentStyle` (solid / center / glow). The stat strip uses `height`, so its width setting works | "sizes the accent strip…", "draws the strip of a stat along its top…" |
| R6 | Widths of corners and sides, set separately | `corner.{tl,tr,br,bl}Width` and `corner.{top,right,bottom,left}Width` (−1 = the frame width), plus `corner.edgeStyle` (solid / dashed / dotted). "Make all corners like this one" also copies the width | "has a width for every side and every corner…", "puts a chosen width on <html>…", "copies the line width of the corner too" |
| R7 | The corner layer, on top by default, covering the left colour bar of positions | `corner.layer` = top (default) / below. On top, the frame is drawn by a `::after` overlay (`pointer-events: none`) above the content, so the bar of `.position` is cut by the corner | "draws the frame above the content by default…"; `experiments/issue-45-positions.mjs` checks that this moves no positioned element on 11 pages; [after/zoom/position.png](screenshots/after/zoom/position.png) |
| R8 | Find more places for configuration and make the preset better to the eye | R2a and R4–R7 add 20 settings. Glitches found with the samples are fixed (see section 4) | sections 4 and 5 |
| R9 | Small samples of every element to catch glitches | `src/pages/UiSamples.jsx` on the settings page: panel, inner block, position, stat, overflow, buttons, fields, select, colour, textarea, chips, tags, segmented control, tabs, table | `pages/issue-45.test.jsx`: "renders a small sample of every bordered element…"; `experiments/issue-45-samples.mjs` |
| R10 | Palettes of neon and pastel colours, not only sliders | `src/components/colorPalettes.js` holds Neon (10), Pastel (10) and Matrix (8) groups, shown in every colour chooser (`ColorInput`) as named buttons | `ColorInput.test.jsx`: "offers palettes…", "keeps every palette colour a valid, unique hex value"; [after/picker/default-chooser.png](screenshots/after/picker/default-chooser.png) |
| R11 | Collect the data, write a deep case study with online research and existing libraries | this file, `data/`, `screenshots/` | — |
| R12 | Everything in one pull request | pull request #46 | — |

## 3. Research: existing libraries and platform features

| Option | What it offers | Why it is or is not used |
| --- | --- | --- |
| [Arwes](https://github.com/arwes/arwes) (MIT, about 7.5k stars, still alpha on the `next` branch) | Sci-fi React framework. `@arwes/frames` draws SVG frames (`createFrameOctagonSettings`, `…Corners…`, `…Kranox…`, `…Lines…`, `…Underline…`, `…Nefrex…`) and has `styleFrameClipOctagon` / `styleFrameClipKranox` clip-path helpers | The site's frame names (octagon, kranox, lines, underline, corners) already follow Arwes. An SVG frame for every button and field would add a DOM node and a resize observer per element. Our frame is pure CSS (clip-path polygon plus background layers), so it scales to hundreds of controls |
| [augmented-ui](https://augmented-ui.com/docs/) (BSD-2-Clause) | `data-augmented-ui="tl-clip br-clip border"` cuts corners with clip-path. Per-side border widths `--aug-border-top/right/bottom/left` override `--aug-border-all` | Closest prior art for R2 and R6. Its docs say nested augmented elements need a reset layer. We solve the same problem with a block scale and a `[data-frame-root]` reset (section 4). We do not use it, because our frame has per-corner shapes, line styles and an accent strip it does not have, and it is driven by settings attributes on `<html>` |
| CSS [`corner-shape`](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape) (`bevel`, `notch`, `scoop`, `squircle`, `superellipse()`) | Native cut and notched corners that also shape the border and the shadow | MDN: "Experimental… not Baseline because it does not work in some of the most widely-used browsers". The clip-path frame stays. `corner-shape` is a later option behind `@supports` |
| CSS `border-image` | Nine-slice frames from an image or gradient | It cannot give each corner its own shape and size from settings, and it does not clip the content. Not used |
| [`overflow: clip`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) | Like `hidden`, but the box is not a scroll container, so it does not break `position: sticky` or scroll anchoring | Used for R3, because `hidden` would turn every panel into a scroll container |
| [`::selection`](https://developer.mozilla.org/en-US/docs/Web/CSS/::selection) | Only `color`, `background-color`, text decorations and `text-shadow` apply; background images are ignored. MDN asks to keep the contrast | R4 uses `background-color: color-mix(…accent… var(--ui-selection-opacity))` and keeps the text colour. "System" restores the browser colours |
| Named colour lists: [Wikipedia "List of colors: N–Z"](https://en.wikipedia.org/wiki/List_of_colors:_N%E2%80%93Z), [A–F](https://en.wikipedia.org/wiki/List_of_colors:_A%E2%80%93F), [htmlcolorcodes.com](https://htmlcolorcodes.com/colors/) (for example [Neon pink #FF10F0](https://htmlcolorcodes.com/colors/neon-pink/)) | Named neon and pastel colours | Sources of the palettes (R10). There is no official standard: sources disagree (neon green is #39FF14 on Wikipedia and #0FFF50 on htmlcolorcodes; [Pastel (color)](https://en.wikipedia.org/wiki/Pastel_(color)) says "There are no official listing of colors' hex codes"). Every value in `colorPalettes.js` is marked W (Wikipedia), H (htmlcolorcodes) or C (CSS named colour) |
| "Digital rain" greens #00FF41, #008F11, #003B00, #0D0208 | Common in design palettes (for example [colorpickercode.com](https://www.colorpickercode.com/color-palette/dark-mode-palettes/matrix-digital/)) | No authoritative source ties them to the film. They are used as a "Matrix" group next to the greens of the issue's JSON (#17de1d, #00ff66) |

### Palette values and sources

| Group | Colours |
| --- | --- |
| Neon | Neon green #39ff14 (W), Electric lime #ccff00 (W), Bright yellow #ffea00 (H), Neon orange #ff5f1f (H), Neon red #ff3131 (H), Neon pink #ff10f0 (H), Electric purple #bf00ff (W), Neon blue #1f51ff (H), Electric blue #7df9ff (H), Cyan #00ffff (C, H) |
| Pastel | Pastel green #c1e1c1 (H), Mint green #98fb98 (H, C `palegreen`), Pastel yellow #fffaa0 (H), Pastel orange #fac898 (H), Pastel red #faa0a0 (H), Pastel pink #f8c8dc (H), Pastel purple #c3b1e1 (H), Periwinkle #ccccff (W, H), Pastel blue #a7c7e7 (H), Celeste #b2ffff (W) |
| Matrix | #00ff41, #00ff66 (issue's rain glow), #17de1d (issue's star colour), #1d873f, #008f11, #003b00, #0d0208, #d1ffd6 |

## 4. Glitches found with the samples, and their root causes

Each one has a test that failed before the fix.

1. **Controls had square dashed boxes inside framed panels** ([before](screenshots/before/samples/dark/custom.png),
   [after](screenshots/after/samples/dark/custom.png)). The custom frame was only generated for outer panels. Fix: the
   `BLOCKS` and `CONTROLS` rules in `src/skins.frames.js`, each with its own corner scale.
2. **Colour swatches turned into the control fill.** The `ui.css` control rules (specificity 0,3,0) set the `background`
   shorthand, which reset the swatch colour of `.palettes__chip`. Fix: the swatch is a child `<i class="swatch">`, so no
   control background can paint over it.
3. **The stat accent strip ignored its size.** `.stat::before` is a horizontal strip, but the size went to `width`. Fix:
   `height: var(--ui-accent-size)`.
4. **Selected text was system blue on the green look** ([before](screenshots/before/samples/dark/custom.png)). Fix:
   `ui.selection`.
5. **The left colour bar of a position ran through the cut corner** ([before](screenshots/before/zoom/position.png),
   [after](screenshots/after/zoom/position.png)). The frame was a background of the panel, below its children. Fix:
   `corner.layer`. On top, the frame is a `::after` overlay; the panel then leaves it out of its own background
   (`--fx-frame-under`). `experiments/issue-45-positions.mjs` compares every absolutely positioned element with both
   layers on 11 pages. Only the animated cosmos layers differ, because of time, so they are skipped.
6. **The samples of outer panels looked like inner blocks.** The samples sit inside `.settings__group`, which is a panel,
   so the "panel in a panel" rule gave them the block scale, and `corner.blocks = line` took their frame away. Fix:
   `INNER` in `src/skins.frames.js`. Inside a `[data-frame-root]` element only panels inside that element count. A
   first attempt with `:not(:has([data-frame-root]))` was wrong: it also dropped panels that are siblings of the marker,
   and the jsdom test caught that.
7. **Long content spilled over the frame** (the "overflow" sample). Fix: R3.

## 5. Settings added

| Section | Settings |
| --- | --- |
| Corners | `corner.{tl,tr,br,bl}Width`, `corner.{top,right,bottom,left}Width`, `corner.edgeStyle`, `corner.layer`, `corner.blocks`, `corner.blockScale`, `corner.controls`, `corner.controlScale` |
| Futuristic skin | `future.accentWidth`, `future.accentMax`, `future.accentStyle` |
| Interface | `ui.selection`, `ui.selectionOpacity`, `ui.overflow` |

Widths of −1 follow the skin: `applySettings` (`src/settings/apply.js`) removes the CSS variable, so the stylesheet
fallback applies.

Size: `src/skins.frames.css` grew from 24.9 KB to 81.6 KB (4.7 KB gzipped), because the frame variables are now declared
for blocks and controls too.

## 6. Validation

- Unit tests: `src/skins.issue-45.test.jsx` (14 tests), `src/components/ColorInput.test.jsx`,
  `src/pages/issue-45.test.jsx`, `src/settings/settings.test.js`, `src/settings/presets.test.js`, and the existing
  skins and applied-settings tests. These check, for example, that every non-default choice has a CSS rule and every
  range is read by the CSS.
- Browser experiments (need `npm run build` and `npx vite preview --port 4173`):
  - `experiments/issue-45-samples.mjs <dir> [name=json …]` screenshots the samples in several looks and checks for
    glitches;
  - `experiments/issue-45-zoom.mjs` takes close looks at single elements;
  - `experiments/issue-45-picker.mjs` checks that the colour chooser stays in view and that choosing a palette colour
    sets the value;
  - `experiments/issue-45-positions.mjs` checks that the corner layer moves nothing;
  - `experiments/issue-45-computed.mjs` prints computed styles.
- Screenshots:
  - before: [`screenshots/before`](screenshots/before);
  - after: [`screenshots/after`](screenshots/after), with samples for the custom, lines, plain, below, border-controls,
    transparent, glass and default looks, and the light theme.

![After: samples of every element, custom frame](screenshots/after/samples/dark/custom.png)
