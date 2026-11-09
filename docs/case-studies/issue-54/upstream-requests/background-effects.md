ui-animation: reusable canvas/WebGL background effect layers (starfield, shader backdrop, grid beams, glyph rain, grid pattern)

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to move every general-purpose UI mechanism upstream. Related upstream work: #66 and the #211 follow-up. #211 notes "consumer shader parity unverified" and keeps artwork as host hooks. The site's animated page background is built from generic layers. Only the glyph artwork of the rain (link-network symbols) and the default looks are site content. Licensing: the site has no license, so this is a behavior specification only. No site code or shader source is copied. Upstream needs its own original implementation, and a shader preset should be original work.

## Current upstream (b4baef4)

- `packages/ui-animation/src/effects.js` registers pure progress→value effects for timelines (`decipher`). It has no canvas or WebGL layer primitive.
- `packages/ui-themes/src/classic/materials.js` `createEffectGovernor` schedules host draw callbacks and gates them on motion, reduced motion and visibility. Sizing, DPR, resize observation, context creation and fallback are left to the host. Adaptive quality is requested separately (quality-governor issue).
- DPR handling exists only inside `packages/ui-components/src/links-view` (`link-view.js`, `network-renderer.js`), not as a shared helper.
- `examples/` has no animated background. `examples/themes/classic.js` only shows a "graph canvas" placeholder.

## Required behavior

### Common layer contract

- `mount(canvas, options)` returns `{update(partial), animate(on), dispose()}`.
- `update` applies any option live without restarting. An option that does not affect the picture causes no redraw. Only geometry-changing options (grid size, direction set) reseed the layer.
- `animate(false)` freezes the current picture with no redraw. `animate(true)` continues from the same state and clocks.
- Backing store = CSS size × min(devicePixelRatio, cap). The cap defaults to 2. WebGL layers additionally use a resolution share from 0.2 to 1.
- Resize is observed with a ResizeObserver on the canvas plus window `resize` (for DPR changes from zoom or a monitor move).
  - The initial 300×150 size from a stylesheet applied after module execution (WebKit 261655) must be corrected without a window resize event.
  - A resize to identical dimensions keeps the picture.
- Every layer integrates with `createEffectGovernor`: per-layer fps (5..60), frames skipped while hidden, still repaint while paused, and resolution/fps degradation.
- A missing Canvas 2D, WebGL, Path2D or shader compile/link failure returns a no-op handle and leaves the host's CSS fallback visible. Nothing throws.
- Layers are `aria-hidden` and `pointer-events: none`, and they are hidden in print.
- An optional light-scheme treatment per layer: invert while keeping hues, plus an opacity factor.
- Each effect is a separate entry point, so unused layers are never downloaded.
- Each layer has a level (opacity) of 0..2 and can be ordered within a fixed stack.
- With reduced motion each layer shows one still frame: stars in place, beams placed along their paths, rain as a static field of glyphs with random alpha 0.2..0.8.

### Effects and parameters (site ranges; upstream may choose its own defaults)

- **Sprite starfield**: up to 4 stacked layers. Per layer:
  - count 0..3000, defined per 1920×1080 and scaled by area, capped at 6000;
  - shape: dot, soft dot, ring, square, diamond, cross +, cross ×, 4/5/6-pointed star, sparkle, telescope flare;
  - size 0.5..24 px and size spread 0..1;
  - colour, hue spread 0..180° and brightness 0..1;
  - glow 0..40 px and glow colour;
  - twinkle rate 0..5× and twinkle depth 0..1;
  - rotation 0..180° and spin −180..180 °/s;
  - motion: still, drift (direction 0..360°), warp toward the viewer, or orbit around the centre; speed 0..400 px/s, with nearer stars moving faster;
  - motion streak 0..20×;
  - blend: normal, add or screen.

  Stars are pre-rendered sprites per look, which are rebuilt only when the look or DPR changes. Star positions use a seeded sequence and are kept when the count is unchanged.
- **Fragment-shader backdrop**: a full-screen WebGL layer that takes host shader source and a uniform map (numbers, colours as `#rrggbb`, angles in degrees converted to radians).
  - It provides resolution, time and pixel-ratio uniforms, a low-power context with no alpha, and no antialiasing.
  - It keeps independent clocks for named time uniforms, so speed changes never jump. The start time can be random.
  - An original upstream nebula preset would cover the site's controls: drift speed 0..8, gas 0..2.5, hue −180..180°, star density 0..4, star brightness 0..2.5, twinkle 0..5, vignette 0..1, zoom 0.3..3, four gas colours, star colour and star size 0.5..3.
- **Grid-line beams**: light travels along the lines of a grid with a shared cell size.
  - styles: comet with tail, segment, pulse, or full-screen scan line;
  - direction: horizontal, vertical or both, with an option for both senses;
  - count 1..40, speed 20..1500 px/s (each beam at 0.75..1.25×), length 10..800 px, width 0.5..8 px, colour, glow 0..40 px (in device pixels);
  - pause 0..10 s between runs;
  - snap to grid lines, or place freely.
- **Glyph rain** (matrix-style) with a pluggable painter `paint(ctx, glyph, x, y, size, glow)` and a glyph source `pick()`:
  - columns half a grid cell wide, two per cell, aligned to the grid lines;
  - step 20..400 ms, quantized to whole display frames (frame time = median of 30 measured gaps under 100 ms), so steps are evenly spaced and there is never more than one per frame;
  - each column moves every 1..N steps (N 1..8). Density 0.05..1 is the share of active columns. A column restarts with a chance of 0.005..0.5 per step;
  - the trail fades by 0.01..0.5 per step using destination-out, so the canvas stays transparent;
  - about once per second a cleanup pass removes the faint alpha levels that 8-bit fading never clears. It uses an SVG alpha filter, with a pixel pass as fallback;
  - the head glows (0..40 px). The previous head is redrawn without glow and becomes the trail. Symbol padding is 0..16 px, capped at 3/8 of a cell;
  - `visible: false` keeps only the drift.
- **Grid drift and pattern**: a CSS grid of lines, dashed lines, crosses or dots.
  - cell size 32..128 px, line width 0.5..4 px, mark length 0.05..1, level 0..4;
  - tint: theme line, accent, second accent or custom colour; optional radial fade mask;
  - drift one cell down per period (0..120 s, 0 = still), with an `onDrift(px)` callback so rain, beams and grid stay registered.
  - The layer is one cell taller than the screen. On wrap the picture is shifted by exactly one cell.

## Acceptance criteria

- [ ] With fake canvas/WebGL contexts, each effect sizes its backing store to CSS × min(DPR, 2) and resizes when a ResizeObserver reports 300×150 → full size.
- [ ] `update()` of a non-visual option and an identical resize cause zero draw calls. Changing beam direction reseeds the beams. Changing star colour rebuilds sprites but keeps star positions.
- [ ] `animate(false)` cancels frames and keeps the canvas. `animate(true)` resumes with no time jump.
- [ ] Hidden page or reduced motion → no frames, with one still frame shown.
- [ ] Missing WebGL or a failing shader returns a no-op handle and no exception.
- [ ] At 60 Hz, a step of 105 ms is drawn exactly every 6 frames. At 120 Hz it is drawn every 13 frames.
- [ ] After 1000 rain steps with fade 0.075, no pixel keeps an alpha ≤ 9/255 from a glyph drawn more than 2 s earlier.
- [ ] A grid drift wrap keeps glyphs on the grid lines (the offset after the wrap equals the offset before it, minus one cell).
- [ ] Each effect is importable on its own. Importing one does not pull in the others.
- [ ] A documented example page mounts all layers, and the browser checks cover the reduced-motion and no-WebGL fallbacks.

## Consumer code that becomes deletable

- `src/visuals/stars.js` (440 lines), `src/visuals/beams.js` (211), `src/visuals/nebula.js` (246) except its consumer shader, `src/visuals/size.js` (22)
- `src/visuals/rain.js` (347), except the glyph painter/picker adapter (the link-network glyphs stay site content)
- `src/components/Cosmos.jsx` (220), reduced to layer wiring
- the background block of `src/Layout.css` (lines 1–185 of 887)
- generated parts of `src/settings/schema.background.js` (120) and `src/settings/schema.layers.js` (172), if upstream ships settings schema fragments for these parameters
- tests: `src/components/visuals.test.jsx` (515), `src/visuals/layers.test.jsx` (262), `src/components/cosmos-49.test.jsx` (176), `src/visuals/rain-cadence-47.test.js` (149)
