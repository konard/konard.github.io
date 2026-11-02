# Case study: issue #49 — overlapping links at zero turns, new defaults, drop-down lists and menu levels, every border configurable, a faster animations switch, the settings columns and the experience cards

- Issue: https://github.com/konard/konard.github.io/issues/49 (created 2026-11-01T19:59:36Z, no comments)
- Pull request: https://github.com/konard/konard.github.io/pull/50
- Builds on: [issue #47](../issue-47/README.md) (corners of every level, the animations button),
  [issue #45](../issue-45/README.md) (one frame for every bordered element) and the network editor of issues #41 and #43
- Data: [`data/issue-49.json`](data/issue-49.json) (the issue), [`data/pr-50.json`](data/pr-50.json) (the pull request),
  and the measurements named in each section below
- Image of the issue: [`images/issue-screenshot.png`](images/issue-screenshot.png) (the experience cards)

## 1. The issue

The issue lists eleven separate problems, plus the usual request for a case study:

1. https://konard.github.io/network/?code=0201&turns=0+45%2C0+45 is the picture the owner wants. At zero turns,
   https://konard.github.io/network/?code=0201 draws the two links on top of each other. So "0" should be redefined
   as that picture, every similar full overlap should be fixed, and no "perfect arrangement" should break.
2. A block of settings in Links Notation: `motion.mode off`, `sound.on false`, own corners for buttons and menus
   (dotted button edges, accent top-left and bottom-left lines, size 6, square shapes), and no edges for menus.
   "We should add new defaults like this."
3. "These should be renamed to drop down list". The "Menus" level should be called drop-down lists, and the
   top-level menu, the second-level menu "and so on" need their own configuration.
4. "We need to make sure all UI elements with borders are configurable."
5. In `CORNERS OF THE FRAME`, a preview of whatever is being configured must always be visible in that panel.
6. "Configuration of borders on hover, focus, outline and so on."
7. Switching animations on and off must be fast. Changing a border must not redraw the background. Start and stop
   should only start or stop the animation on the next frame, with no re-rendering and no prerendered still version.
   "Make our UI fast and responsive, and do minimum of actions with same visuals."
8. The settings page has a big gap on the left, so the blocks should be rearranged.
9. The markings on the left of the experience cards (screenshot) overlap the border. They must be configurable. By
   default they should be more transparent, or at least 1px away from the border, with an option to be
   semi-transparent.
10. The cards have gaps in the middle of the text. Text should start at the top, and the tags can sit at the bottom,
    or each card can be sized to its content. All of this should be configurable, including keeping the gap.
11. Collect the data into this folder and write a deep case study: timeline, requirements, root causes, solutions and
    plans, and existing libraries. Add debug output where a root cause is unclear, report issues to other
    repositories where relevant, and apply every fix to the whole codebase.

## 2. Timeline

| Time (UTC) | Event |
| --- | --- |
| 2026-11-01 19:59 | Issue #49 is opened |
| 2026-11-02 10:50 | The branch and draft pull request #50 are created (ecde990) |
| 11:27 | [`experiments/issue-49-overlaps.mjs`](../../../experiments/issue-49-overlaps.mjs) records every network of 1–3 links, plus 15 larger seeded ones, at zero turns: 838 of 4,196 have two links on top of each other ([`data/overlaps-before.json`](data/overlaps-before.json)) |
| 11:44 | e80f442: neutral straight references that lie on top of another one are bent by 45°. `code=0201` at zero now draws the old `turns=0 45, 0 45` (R1) |
| 12:18 | 4086d68: the defaults of the issue (R2) |
| 12:18 | 635649e: the background pauses and resumes on the next frame, and a layer gets only the settings it reads (R7) |
| 12:28 | fe30273: "Menus" becomes "Drop-down lists", and the top-level and second-level menus become levels (R3) |
| 13:27 | 33f774b: the corners section keeps a preview of the chosen level in sight, and the settings fill the shorter column in order (R5, R8) |
| 13:44 | ce57ce3: the stripe of the experience cards moves inside the border and becomes a bit transparent, and the text starts at the top with the tags at the bottom; both are configurable (R9, R10) |
| 14:11 | 111ea42: every bordered element is configurable, and so are the borders on hover, when chosen and on focus (R4, R6) |
| later | This case study; the issue #45 browser check sets buttons to follow the controls again (section 4.8) |

## 3. Requirements

| # | Requirement | Solution | Evidence |
| --- | --- | --- | --- |
| R1 | `code=0201` at zero turns must look like `turns=0 45, 0 45`; fix every similar full overlap without breaking the other arrangements | Section 4.1 | `src/links/issue-49.test.js`; [`data/overlaps-before.json`](data/overlaps-before.json), [`data/overlaps-after.json`](data/overlaps-after.json), [`data/geometry-before.json`](data/geometry-before.json), [`data/geometry-after.json`](data/geometry-after.json); [before](screenshots/network-0201-before.png), [the wanted picture](screenshots/network-0201-turns-0-45-before.png), [after](screenshots/network-0201-after.png) |
| R2 | The settings of the issue become the defaults | `src/settings/schema.defaults.js`: `COMFORT_49` (`motion.mode off`, `sound.on false`) and `LOOK_49` (the 18 corner settings, in the order of the issue), merged into `DEFAULT_LOOK`. The "Glass universe" preset restores the old corners, as it already does for the look of issue #45. Motion and sound are comfort settings, so no preset changes them | `src/settings/settings.test.js`, `src/settings/applied.test.js`, `src/components/prefs-motion-47.test.jsx`, `src/skins.issue-47.levels.test.jsx` |
| R3 | Call the "Menus" level drop-down lists; configure the top-level menu, the second-level menu and so on | Section 4.3 | `src/skins.issue-49.levels.test.jsx` |
| R4 | Every UI element with a border is configurable | Section 4.4 | `src/issue-49.borders.test.jsx`; [`experiments/issue-49-bordered.mjs`](../../../experiments/issue-49-bordered.mjs) and its results in `data/bordered-*.txt` |
| R5 | The corners section always shows a preview of what is being configured | `src/pages/LevelPreview.jsx`: a sample of the chosen level, drawn with the real selectors of that level (a button, a field, a tab, a chip, a drop-down list, a menu link, a table, a panel or a block). It is `position: sticky` above the settings of the level, so it stays in sight while they scroll | `src/pages/settings-49.test.jsx`; [`experiments/issue-49-level-preview.mjs`](../../../experiments/issue-49-level-preview.mjs) |
| R6 | Borders on hover, focus, outline and so on are configurable | Section 4.5 | `src/issue-49.borders.test.jsx`; [`experiments/issue-49-states.mjs`](../../../experiments/issue-49-states.mjs); [glass default](screenshots/states-glass-default.png), [glass custom](screenshots/states-glass-custom.png), [futuristic default](screenshots/states-futuristic-default.png), [futuristic custom](screenshots/states-futuristic-custom.png) |
| R7 | Switching animations is fast and only pauses or resumes on the next frame; borders and other settings do not redraw the background | Section 4.2 | `src/components/cosmos-49.test.jsx` |
| R8 | No big gap on the left of the settings page | Section 4.6 | `src/pages/settings-49.test.jsx`; [`data/settings-columns-before.txt`](data/settings-columns-before.txt), [`data/settings-columns-after.txt`](data/settings-columns-after.txt); [before](screenshots/settings-columns-before.png), [after](screenshots/settings-columns-after.png) |
| R9 | The stripe on the left of the experience cards does not overlap the border, is a bit transparent by default, and is configurable | Section 4.7 | `src/issue-49.cards.test.jsx`; [`data/experience-cards-before.txt`](data/experience-cards-before.txt), [`data/experience-cards-after.txt`](data/experience-cards-after.txt); [before](screenshots/experience-cards-before.png), [after](screenshots/experience-cards-after.png) |
| R10 | No gap in the middle of the card text: text at the top, tags at the bottom, or cards sized to their content; configurable, including the old gap | Section 4.7 | `src/issue-49.cards.test.jsx`; [`data/experience-cards-content.txt`](data/experience-cards-content.txt), [screenshot sized by content](screenshots/experience-cards-content.png) |
| R11 | Collect the data and write a deep case study, with research online and existing libraries | This file, `data/`, `images/`, `screenshots/`; sections 5 and 6 | — |
| R12 | Debug output where a root cause is unclear | `localStorage['cosmos.debug'] = '1'` traces what the background is asked to do (start, update, pause, resume), so another redraw would show up in the console (`src/components/Cosmos.jsx`). It is off by default. The other root causes were measured directly by the experiments in `experiments/issue-49-*.mjs` | the code |
| R13 | Report problems that belong to other repositories | None found. Every cause is in this repository's code: the geometry of the network editor, the CSS generators, the settings schema and the background layers. No library was at fault | — |
| R14 | Apply every fix to the whole codebase | R1: all 4,196 measured networks. R4: every page in three skins. R6: every control and panel of the frame lists. R7: all four background layers (nebula, stars, beams, rain). Each section names what it covers | the tests and experiments above |

## 4. Root causes and solutions

### 4.1 Two links drawn on top of each other at zero turns (R1)

**Root cause.** Issue #43 made a reference straight at zero turns when its chord follows the tangent of its own link's
middle. In `0201`, link 1 refers to link 2 and link 2 refers to link 1. Both references are straight, run between the
same two middles, and so form one line. The picture the owner wants, `turns=0 45, 0 45`, is the same pair with the far
end of each reference turned 45°.

**Solution** (`src/links/glyph.js`, e80f442):

- `overlapBends()` finds the neutral straight references that lie on another straight reference.
- It bends each of them by `OVERLAP_BEND = 45°` at the end away from its own middle, all to the same side of travel,
  so the pair becomes a point-symmetric lens. The picture of `turns=0 45, 0 45` is now zero.
- Explicit turns stay offsets from this new neutral, so `turns=0 45, 0 45` now adds another 45° on top.
- The bends depend on the placement and the bulge only, and are cached per placement.
- The gallery and the rain use the "rotate" bending, so their geometry is unchanged.

**Whole codebase.** [`experiments/issue-49-overlaps.mjs`](../../../experiments/issue-49-overlaps.mjs) draws every
network of 1–3 links (4 + 81 + 4,096 = 4,181) plus 15 larger seeded ones at zero turns. For each pair of links, it
measures how much of one curve runs within 0.004 layout units of the other. It does not trust the code being changed.

| | Before | After |
| --- | --- | --- |
| Networks with two links on top of each other | 838 | 52 |
| Networks whose geometry changed | — | 786, all among the 838 |
| Networks with no overlap before whose geometry changed | — | 0 ("we don't break any perfect arrangement") |
| New overlaps | — | 0 |

The 52 that remain were not changed:

- 50 hold the same link twice, such as `11 11` or `33 33`. Identical links share a source and a target and are drawn
  the same way at any turns. Separating them would be a different feature: a spread for duplicate links.
- 2 are larger seeded networks (`03 26 65 11 62 06` and `05 12 64 61 65 60`). They overlapped before as well, and
  none of their references is one of the straight references the fix bends, so they are not the case of the issue.
  Their geometry is unchanged.

A plan if the owner wants these separated too: give the n-th copy of a duplicate link an extra bulge of n × a fixed
step. That is the approach Graphviz and Cytoscape.js use for multi-edges, see section 5.

### 4.2 The animations switch restarted the background, and every setting reached it (R7)

**Root cause** (read from `src/components/Cosmos.jsx` before 635649e):

- The effects that start the layers depended on `animate`. Turning animations on or off therefore stopped every
  layer and started it again with `animate` set to the new value. The nebula compiled its WebGL shader again, and the
  rain drew a new random picture. With animations off, the restarted layers drew one still frame, which is the
  "prerendering of separate background version" in the issue.
- Every change of any setting, a border included, sent the full settings to all layers. They updated, and
  `applySettings` rewrote every CSS variable on `<html>`, which restyles the whole page.

**Solution** (635649e):

- Each layer (`nebula.js`, `stars.js`, `beams.js`, `rain.js`) has `animate(on)`.
- Off cancels the next `requestAnimationFrame`, and the last frame stays on the canvas. On requests the next frame and
  continues from the current time, so nothing is drawn again in between.
- `optionsKey()` describes the options a layer reads as text. A layer gets `update()` only when that text changes, so
  a border, a corner or a colour of the interface never reaches the background.
- `applySettings` and the store write only the settings that changed.
- The trace `localStorage['cosmos.debug'] = '1'` (R12) logs every start, update, pause and resume.

`src/components/cosmos-49.test.jsx` checks the following. The switch calls `animate` and never starts a layer again.
A border setting starts and updates nothing. The rain draws nothing between its stop and its start. Only the changed
settings are written.

### 4.3 The menu level was misnamed, and the menus had no level (R3)

**Root cause.** The level called "Menus" (issue #47) held the drop-down lists, the custom select of the settings. The
real menus, the page links of the top bar and the section links of a page, were in no level. Their borders followed
the tabs or nothing.

**Solution** (fe30273):

- `LEVEL_NAMES.menu` is now "Drop-down lists" / "Выпадающие списки", and keeps its keys (`corner.menu*`), so saved
  settings and share links still work.
- Two new levels: `nav` ("Top-level menu", the pages of the site) and `subnav` ("Second-level menu", the sections of
  a page). Each has the full corner set of a level and a generated stylesheet (`src/skins.frames.level-nav.css`,
  `src/skins.frames.level-subnav.css`).
- Each menu link belongs to exactly one level.
- By default the pages follow all controls and the sections stay plain links, so the look does not change until the
  owner configures them.
- "And so on": the site has two menu depths. A third depth would be one more entry in `CONTROL_TYPES` and
  `LEVEL_NAMES`, because the stylesheets are generated.

### 4.4 Bordered elements that no setting reached (R4)

**Root cause.**

- Issue #45 built the frames from the lists of `src/skins.frames.js` (`PANELS`, `CONTROLS`, `CONTROL_TYPES`).
- The rule of `ui.css` that applies `ui.controlBorder` and `ui.borderStyle` covered buttons and fields only.
- Borders written by hand in component stylesheets were in neither list: the lines between parts of a page, chips,
  tags, tabs, the photo, the CV sheet, the JSON box, the level preview, the career cards and the contributions
  calendar.

[`experiments/issue-49-bordered.mjs`](../../../experiments/issue-49-bordered.mjs) loads every page twice: once as is,
and once with every border setting far from its default. It lists each element that has a visible border or outline
and looks the same both times. Before the change, 29 of 91 kinds of bordered elements in glass were unchanged by any
setting ([`data/bordered-before-glass.txt`](data/bordered-before-glass.txt)), and 25 of 32 in futuristic
([`data/bordered-before-futuristic.txt`](data/bordered-before-futuristic.txt)).

**Solution** (111ea42):

- `src/ui.borders.js` generates `src/ui.borders.css` (`npm run build:frames`) from the lists of `skins.frames.js`, so
  a panel or control added there is covered here too.
- **Lines between the parts of a page** (`LINES`: the nav, the footer, timeline rows, Habr stats, the CV headings,
  post heads, link-card fields, setting rows, the top bar). They follow a new `ui.lines` setting: "as in the skin" by
  default, or own lines with `ui.lineWidth`, `ui.lineStyle`, `ui.lineColor` and `ui.lineOpacity`.
- **Chips, tags, tabs, badges, swatches and segmented controls** (`OTHER_CONTROLS`). Outside the futuristic skin they
  follow the control width and border style. The futuristic skin keeps its own width and the frames of the levels.
- **Boxes that are not panels** (`.settings__json`, `.level-preview`, `.cv-paper`). They follow the panel width and
  style.
- **`.profession` and `.contribution-calendar`** become panels: framed, and cut in futuristic
  ([profession](screenshots/new-panel-profession.png), [calendar](screenshots/new-panel-contribution-calendar.png)).
- **`.hero__kicker` and `.habr__status`** become chips.
- **The photo** has `avatar.photoBorder` (default 2px, as before).

After: 3 kinds remain in each of glass, liquid and futuristic: the three preset mini panels
([`data/bordered-after-glass.txt`](data/bordered-after-glass.txt),
[`data/bordered-after-liquid.txt`](data/bordered-after-liquid.txt),
[`data/bordered-after-futuristic.txt`](data/bordered-after-futuristic.txt)). They are excluded on purpose
(`EXCLUDED` in `src/ui.borders.js`), because they show how another look draws a panel. The experiment exits with an
error if anything else remains.

**Visible changes to the default look.**

- In glass and liquid, chips, tags, tabs and badges now follow `ui.borderStyle`, which is dashed by default, like
  buttons and fields.
- The career cards and the calendar are framed like the other panels.

### 4.5 No settings for the borders of states (R6)

**Root cause.**

- Hover and selection colours were written into each skin.
- The focus ring had settings for its width and offset only. Its style and colour were fixed: `solid var(--accent)`.
- The ring of a chosen colour swatch was a fixed 2px.
- The custom frame of the futuristic skin draws its edges as images in `--fx-ec`, so a plain `border-color` would not
  reach it.

**Solution** (111ea42), a new section "Hover, focus and selection" (`states`):

| Setting | Values | Default |
| --- | --- | --- |
| `ui.hoverEdge`, `ui.activeEdge` | as in the skin, primary accent, secondary accent, text colour, a stronger line | as in the skin |
| `ui.hoverStyle`, `ui.activeStyle` | as the border, solid, dashed, dotted, double | as the border |
| `ui.chosenWidth` | 0–6 px, the ring of a chosen colour in palettes and colour chips | 2 |
| `ui.focusColor` | primary accent, secondary accent, text colour | primary accent |
| `ui.focusStyle` | solid, dashed, dotted, double | solid |
| `ui.focusWidth` | 1–6 px, moved here from the interface section | 2 |
| `ui.focusOffset` | 0–8 px, moved here from the interface section | 3 |

- With the defaults, no state rule applies at all. Every rule is guarded by `:not([data-ui-hover-edge='skin'])` and
  similar guards, so the default look stays the same.
- In the custom frame, the same settings set `--fx-ec` and the edge images of the state.
- **Bug found and fixed while doing this.** In futuristic, a hovered chosen chip showed the hover colour, because
  `:hover:not(:disabled)` was more specific than `.is-active`.
  - Every state selector (hover, active, focus) now ends with `:not(:disabled)`, so all have the same specificity and
    their order decides.
  - The chosen state comes after the hover, so a chosen element under the pointer still shows that it is chosen.
  - The specificity of `:is()` is that of its most specific argument (section 5), which is why the order alone was not
    enough before.

**Limits.**

- In the futuristic skin, accent 2 is a darker shade of the green accent, so the difference between states there is
  subtle.
- A 1px `double` border has no room for two lines and renders as solid.

### 4.6 The big gap on the left of the settings page (R8)

**Root cause.**

- Each section named its own column (issue #15): the background sections on the left, the look on the right.
- As the look sections grew (frames, corners, borders), the right column reached 8,749px and the left one 3,230px.
- That left 5,519px of nothing under the left column
  ([`data/settings-columns-before.txt`](data/settings-columns-before.txt), measured at 1440px with the futuristic skin).

**Solution** (33f774b, `src/pages/settingsColumns.js`):

- The sections are placed in order, each one into the column that is shorter so far.
- Placement uses an estimate of the section's height: the head, the rows, the hints and the previews.
- The estimate depends only on which sections are shown, never on their values, and a section is placed only by the
  sections before it. So a section does not jump between columns while it is being configured, which was the
  complaint of issue #15.
- After: 5,894px and 6,179px, a gap of 285px, less than one section
  ([`data/settings-columns-after.txt`](data/settings-columns-after.txt)).
- The tests check that every skin balances within one section.

Native masonry (`display: grid-lanes`, section 5) would do this without an estimate. Today only Safari 26.4 and later
ship it, so it would leave the other engines with the old gap.

### 4.7 The experience cards: stripe on the border and a gap in the text (R9, R10)

**Root cause** ([`experiments/issue-49-positions.mjs`](../../../experiments/issue-49-positions.mjs),
[`data/experience-cards-before.txt`](data/experience-cards-before.txt)):

- The stripe was a 4px left border, fully opaque, at offset 0, so it lay on the frame of the card.
- The summary of the card had `flex: 1` and took all the free height of a card in a row. The text then had a gap of
  up to 269px between the summary and the meta lines.

**Solution** (ce57ce3, `src/App.sections.css`), a new section "Experience cards" (`cards`):

| Setting | Values | Default |
| --- | --- | --- |
| `cards.stripe` | inside the border, on the border (as before), none | inside the border |
| `cards.stripeWidth` | 1–12 px | 3 |
| `cards.stripeOpacity` | 10–100% | 70% |
| `cards.stripeInset` | 0–16 px from the border | 2 |
| `cards.stripeEnds` | 0–64 px from the corners | 6, past the corners of the frame |
| `cards.layout` | text at the top and tags at the bottom; each card as high as its text; gap after the summary (as before) | text at the top, tags at the bottom |

The defaults follow the issue: "at least 1 px of offset from borders" and "a bit transparent". After, the gap in the
text is 12px in every card (the normal spacing), and the tags stay 16px from the bottom
([`data/experience-cards-after.txt`](data/experience-cards-after.txt)). With "each card as high as its text", the
heights follow the content ([`data/experience-cards-content.txt`](data/experience-cards-content.txt)).

### 4.8 The browser check of issue #45 failed after the new defaults (CI)

The CI step "Verify the frame on every bordered element, the corner layer and the colour palettes" failed on chromium
and firefox (WebKit was cancelled with them) in runs 41443656092, 41444969197, 41453238613 and 41455644189, the
pushes of 635649e to ce57ce3; the first of them brought 4086d68. The logs are in `ci-logs/deploy-*.log`. Its third check sets `corner.controls: border`
and expects the sample button to be a plain rectangle with no edge images. The new defaults of R2 give buttons
corners of their own (`corner.buttonCorners own`), and a level with its own corners does not follow
`corner.controls`, by design since issue #47. So the button kept its 6px dotted corners
(run 41455644189: `"clip-path":"polygon(0px 6px, 6px 0px, …"`). The check now also sets
`corner.buttonCorners: same` (the button follows the controls), which is the case it means to test. It passes
locally on chromium (16 checks).

Once the browser checks passed (run 41460885921), the unit test job ran for the first time on this branch. One test
failed: the issue #47 check `src/components/icons-47.test.jsx` found the `↑` glyph in the sample second-level menu of
R5 (`pages/LevelPreview.jsx:125`). The sample now draws the same Lucide `ArrowUp` SVG as the real menu in
`Layout.jsx`. The log is in `ci-logs/deploy-41460885921.log`.

## 5. Research and existing solutions

- **Contrast of borders and states.** WCAG 2.2 SC 1.4.11 (AA) asks for 3:1 against adjacent colours for the visual
  parts of controls, in all their states (https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast). The new
  state colours are only the skin's own colours (accents, text, the strong border), not free colours. The defaults
  keep the look of the skin.
- **Focus.** SC 2.4.7 asks for a visible focus. SC 2.4.13 (AAA) asks for an indicator at least as large as a 2px
  perimeter, with 3:1 between the focused and unfocused pixels
  (https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance). The focus ring keeps 2px solid accent by default.
  The width and offset, now next to the new colour and style, let the owner make it larger. A dotted or dashed ring covers less area than the
  2px-perimeter rule assumes, so the default stays solid.
- **Configurable focus rings** are commonly built the same way here: one `:focus-visible` rule that reads width,
  colour and offset from custom properties. Examples: the HashiCorp design system's focus-ring tokens
  (https://github.com/hashicorp/design-system/pull/98) and Red Hat's focus indicator guidance
  (https://ux.redhat.com/foundations/interactions/focus-indicators/).
- **Specificity of `:is()`.** `:is()` takes the specificity of its most specific argument, while `:where()` has none
  (https://developer.mozilla.org/en-US/docs/Web/CSS/:where). That is why every state selector of the frame now carries
  the same `:not(:disabled)`, so the order decides between hover and chosen (section 4.5).
- **Pausing an animation.** A `requestAnimationFrame` loop stops when its callback stops requesting the next frame, and
  `cancelAnimationFrame` drops a pending one
  (https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame). Resuming means requesting a frame
  again and measuring time from that point. The layers do this instead of restarting (section 4.2).
- **Masonry.** CSS Grid Lanes (`display: grid-lanes`) places items into the shortest lane natively. It ships in Safari
  26.4 and is behind a flag elsewhere (https://webkit.org/blog/17660/introducing-css-grid-lanes/), so the settings
  page keeps its own placement (section 4.6). It is also the natural replacement once Chrome and Firefox ship it.
- **Multi-edges in graph drawing.** Graphviz and Cytoscape.js separate parallel edges between the same nodes by
  spreading their curvature (Cytoscape.js `curve-style: bezier` with `control-point-step-size`). That is the plan in
  section 4.1 for the duplicate links that still coincide. The network editor has its own geometry (issues #41 and #43),
  so neither library replaces it.
- **Libraries considered and not used.**
  - Masonry.js and similar JavaScript packers: they measure the DOM and move sections while they are being edited,
    which is what issue #15 removed.
  - Headless UI and Radix: their drop-down primitives do not affect the naming or the frame levels.
  - The site generates its CSS from its own lists, so a CSS-in-JS library would add a runtime for nothing.

## 6. Validation

- Unit tests (vitest, jsdom), each failing before its fix:
  - `src/links/issue-49.test.js`
  - `src/components/cosmos-49.test.jsx`
  - `src/skins.issue-49.levels.test.jsx`
  - `src/pages/settings-49.test.jsx`
  - `src/issue-49.cards.test.jsx`
  - `src/issue-49.borders.test.jsx`
  - the updated default tests of R2
- Experiments in `experiments/issue-49-*.mjs`, with their results in `data/` and `screenshots/`:
  - overlaps, geometry
  - level preview, settings columns
  - positions of the cards
  - bordered elements, states, new panels
  - screenshots
- CI runs the full unit suite and the browser checks on chromium, firefox and webkit.
