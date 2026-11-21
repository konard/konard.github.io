ui-themes: build-time CSS output for independent frames (per-level, per-corner lines, edge styles, states, fit, typed custom-property registration)

## Context

Consumer migration konard/konard.github.io#54 (draft PR https://github.com/konard/konard.github.io/pull/55) must delete its own frame engine once the framework can produce the same result. Related: #66, and the unfinished criteria of #211 ("exact consumer parity unverified"). Licensing: konard.github.io has no license and is listed as Denied in `docs/licensing.md`. This issue is a behavior specification only. No site code, generated CSS or tests are copied.

## Current upstream (b4baef4)

- `packages/ui-themes/src/classic/frame-schema.js` (`readFrames`, `resolveFrame`, `frameGeometry`, spec `docs/spec/frames.md`): per-corner shape/size/width/height/stroke/color, per-edge `line` (`none|gap|line|accent|bracket`)/stroke/color/gap, `extends` inheritance, states `hover|active|selected|focus|disabled`, uniform fit factor.
- `frameGeometry(frame, width, height)` returns a path, `clipPath` and a border SVG for **one fixed pixel size**. The host must run JS per element and again on every resize. There is no stylesheet output.
- `frameStyle` (legacy, `frames.js`) emits CSS but has one shared corner, percentage geometry and a 48 px cap.
- `packages/ui-style/src/properties.js`: `clip-path` accepts only literal `polygon(numbers/%)` or `inset(px)`, so `calc()`/`var()` geometry is rejected. `border-style` has no `dotted`. `packages/ui-style/src/conditions.js` `STATE_CSS` names the pressed state `pressed`, but the frame schema calls it `active`. `selected` matches only `[aria-selected='true']`.
- `examples/themes/optical-frames` composes the material layer, the clip and the SVG at runtime with a fixed size of 320×200.

So the schema can describe most of the site's frames, but it cannot yet produce equivalent output that runs on CSS variables and needs no JS at runtime.

## Required behavior

- **Stylesheet generator.** Add `framesCss(frames, options)` beside `readFrames` in `@link-foundation/ui-themes/classic/frames`. It runs in Node without a DOM and gives the same output for the same input. It returns separate chunks: `properties` (registrations), `base`, one chunk per level, and `fit`. A level that only inherits produces no geometry rules of its own.
- **Host selector map.** `options.levels` maps each level to a list of selectors. Each selector is wrapped in its own `:where()`. A scope selector (default `:root`) and a custom property prefix are configurable.
- **Nested panels.** Add a `block` level: a panel inside a panel. An optional boundary attribute restarts nesting, so previews render outer panels as outer.
- **Any size, no JS.** Geometry uses `calc()` with percentages and custom properties, so the clip and strokes are correct at every element size and follow resizes without JS. Cut corners stay transparent on every material, and the parent background shows through.
- **Live parameters.** Every numeric parameter and every enumerated choice can be changed at runtime through one custom property or one data attribute on the scope element. The stylesheet is never regenerated. The generator documents the variable and attribute names.
- **Per-corner line kind**, in addition to the shape:
  - `none`: no stroke at the corner.
  - `gap`: the adjacent edges stop one arm length short of the corner.
  - `line`: the corner uses the edge color.
  - `accent`: a bright stroke. A square corner draws a tick one corner size long along both edges.
  - `bracket`: a bright stroke with arms along both edges.

  Corner stroke width is 0–12 px in steps of 0.5. `auto` means the edge width.
- **Edge style.** Add a `style` property (`solid|dashed|dotted|double`) to each edge or level, independent of the `line` kind. `dotted` dots are as long as the stroke (at least 1 px). `double` draws two lines across the stroke width. Edge widths are set per side, 0–12 px, or `auto`.
- **Scaled inheritance.** `extends` takes an optional `scale` from 0.1 to 1. It multiplies the inherited corner sizes and arm lengths, not the stroke widths. Typical defaults are 0.6 for nested blocks and 0.35 for controls. Corner sizes range from 0 to 128 px or more (no cap). A level's per-corner value can be `auto`, which means inherited and scaled.
- **Level mode.** Each level chooses `frame` (inherit the parent frame), `own` (its own corners and edges) or `border` (a plain border with no clip). `border` still uses the border width/style tokens and the state overrides.
- **Corner layer.** Each level puts its corner strokes `above` the content (they cover child decorations such as color bars) or `below` it. Content opacity is never changed.
- **Frame opacity** from 0 to 1. It applies to strokes only.
- **Colors and alpha.** Colors can be token references with an alpha factor, for example "primary at 30%". The faint-edge look depends on this.
- **States in CSS.** States compile to selectors in a fixed order:
  - `hover` excludes disabled elements.
  - `active` and `selected` come after `hover` and win over it.
  - `selected` uses a configurable selector list. Default: `[aria-selected='true']`, `[aria-pressed='true']`, `[aria-current='page']`.
  - `focus` uses `:focus-visible`.

  The state names in `frame-schema.js` and `STATE_CSS` need to agree.
- **Typed registration.** Generate `@property` rules:
  - Numbers that only the scope element reads: `inherits: false`.
  - Lengths, colors and images that framed elements read: typed (`<length>`, `<color>`, `<image> | none`), so they are computed once on the scope.
  - Values drawn per element: `inherits: false`.

  Typed lengths and colors can be transitioned on state changes. Browsers without `@property` must render the same result.
- **Fit, part 1 (no JS).** The CSS clamps adjacent corner extents so they never overlap at any element size.
- **Fit, part 2 (opt-in thresholds).** Per level, set min/max width and min/max height (0–1600 px; 0 means no limit) and `fitScale` (0–1, default 0.5). An element outside its limits draws corners multiplied by `fitScale`; 0 gives a plain rectangle. CSS cannot query an element's own size, so provide an opt-in helper (for example in ui-dom) with these rules:
  - Attach a single ResizeObserver only while some level has limits.
  - Write the marker attribute only when it changes.
  - Pick up added nodes.
  - Make it disposable.
- **ui-style support.** Extend the `clip-path` validator to accept bounded `calc()`/`var()` polygon terms (still no `url()` or arbitrary functions). Add `dotted` to `border-style`.

## Acceptance criteria

- [ ] `framesCss` output for the spec example renders the same contour and strokes as `frameGeometry` at 320×200, 80×24 and 1200×40, with no runtime JS.
- [ ] Resizing a framed element keeps its clip and strokes correct without script.
- [ ] Changing one corner size or shape on the scope element updates every framed element without regenerating the stylesheet.
- [ ] All seven shapes × five corner line kinds × four edge styles render on each of the four corners and four edges independently.
- [ ] `block`, scaled `extends`, and `frame|own|border` modes work for all ten levels plus `block`. An inheriting level emits no geometry rules.
- [ ] Hover, active, selected and focus overrides apply in the documented order. Disabled elements ignore hover. The `selected` selector list is configurable.
- [ ] The corner layer can be above or below the content. Content opacity is unchanged, and the background is visible through the cuts.
- [ ] `@property` registrations are emitted. A browser without `@property` renders identically.
- [ ] Adjacent corners never overlap at any size ≥ 1×1 px. With threshold fit, elements outside their limits draw corners × `fitScale`, and no observer exists while no level has limits.
- [ ] ui-style accepts the generated `clip-path` values and `border-style dotted`.

## Consumer code that becomes deletable

- `src/skins.frames.js` (693), `src/skins.frames.levels.js` (179), `src/skins.frames.fit.js` (101), `src/frameFit.js` (152), `src/ui.borders.js` (201), `scripts/build-frames-css.mjs` (24).
- Generated: `src/skins.frames.css` (1225), `src/skins.frames.corners.css` (1200), `src/skins.frames.properties.css` (572), `src/skins.frames.fit.css` (158), nine `src/skins.frames.level-*.css` (5188 in total), `src/ui.borders.css` (236). About 1.1 MB of unminified CSS.
- The frame-to-CSS-variable mapping in `src/settings/schema.skins.js` (570 lines in total; the frame part becomes framework settings).
