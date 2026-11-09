ui-themes: complete optical materials (filter chain, highlights, noise layer, refraction provider, backdrop budget) and palette packs with alpha channels

## Context

Consumer migration konard/konard.github.io#54 (draft PR https://github.com/konard/konard.github.io/pull/55) keeps its own glass/liquid/futuristic surface code because the framework material contract only covers part of it. Related: #66, and the unfinished criteria of #211 ("consumer shader parity unverified", "exact palette import/parity unfinished"). Licensing: konard.github.io has no license and is listed as Denied in `docs/licensing.md`. This issue is a behavior specification only. No site code, CSS, presets or palette values are copied. Palette color values are site content and are not requested.

## Current upstream (b4baef4)

- `packages/ui-themes/src/classic/materials.js`:
  - `readMaterial` reads `color`, `opacity`, `blur`, `noise` and `refraction`.
  - `materialStyle` returns a color-mix background, `backdrop-filter: blur()` and `--material-noise` / `--material-refraction` numbers for a host hook.
  - `applyAppearancePreset` keeps the viewer's preferences.
  - `createEffectGovernor` schedules JS effects only when motion is on and the surface is visible.
  - No noise image or refraction filter ships (`docs/spec/frames.md`).
- `packages/ui-style/src/materials.js` `materialCss`: opaque by default, `@supports` and `prefers-reduced-transparency` gating, and `data-transparency="off"`.
- `packages/ui-style/src/properties.js`: `blur` emits only `blur()`. `glow` is limited to 0–1 (× 24 px). `scanline` exists.
- `packages/ui-tokens/src/export/css.js` `toCss` (`selector`, `modeSelector`, `modeMedia`). Multi-theme packs already exist (`themes/classic/immortality/palettes.lino`).

## Required behavior

- **Optical parameters.** Extend `readMaterial` / `materialStyle` and add a static CSS equivalent driven by custom properties. All parameters are optional. The defaults are neutral, so existing materials render unchanged.

  | Parameter | Range | Neutral default |
  | --- | --- | --- |
  | blur | 0–48 px | 0 |
  | saturation | 100–300 % | 100 |
  | brightness | 70–150 % | 100 |
  | contrast | 50–200 % | 100 |
  | tint color | `theme` or a color | `theme` |
  | tint level | 0–1 | 0 |
  | highlight (inset light lines: top full, side 35 %, bottom 25 %) | 0–1 | 0 |
  | depth (inner glow) | 0–1, with blur 0–80 px | 0 |
  | drop shadow | strength 0–1; blur 0–100 px; distance 0–60 px; spread −20–30 px | 0 |
  | sheen | strength 0–0.8; angle 0–360°; light angle 0–360° | 0 |
  | border | width 0–8 px; border light 0–1 | 0 |

  The `backdrop-filter` order is: refraction (if active), then blur, saturate, brightness, contrast. Raise the cap of ui-style `glow` (at least 0–4).
- **Uniform opacity.** Tint, noise, sheen and highlights scale with material opacity. Content opacity is never changed. At opacity 0 the surface emits no backdrop filter, gradients or noise, and frame strokes remain.
- **Noise layer.** When `noise > 0`, provide a built-in, deterministic grain image: a 128 px seamless fractal-noise tile, desaturated, with alpha = noise × opacity. It is generated without canvas (for example an SVG data URI) and is regenerated only when noise or opacity changes. It sits between the surface tint and the content and is clipped by the frame contour. At `noise = 0` there is no image.
- **Refraction provider.** Provide an opt-in, built-in displacement filter that bends the backdrop. Turbulence noise is smoothed, then used as a displacement map. Parameters: scale 0–150 (default 40), detail 2–60 (base frequency = detail / 1000, default 12), octaves 1–4 (default 2), smoothing 0–10 (default 2), seed 0–100 (default 13). Document how `refraction` 0–1 maps to scale. One inert, hidden filter element per document.

  Emit the filter reference only when the engine applies SVG filters inside `backdrop-filter`. Elsewhere, an unsupported reference would cancel the whole filter, so the chain without it must keep blurring. The filter turns off when transparency is off or reduced (setting, or `auto` plus the media query), when opacity is 0, or when refraction is disabled.
- **Sheen motion.** The animated sheen and hover sweep stop under `prefers-reduced-motion` unless the viewer explicitly turned motion on. They always stop when motion is off.
- **Backdrop budget.** Provide an opt-in helper, `observeMaterialVisibility(root, selector, { margin })`:
  - It removes `backdrop-filter` from matching elements outside the viewport plus the margin (default 200 px vertically). Background, frame, size and accessible content stay the same.
  - It overrides every material rule, including hover and refraction.
  - It applies to screen media only; print is unchanged.
  - It handles thousands of dynamically added items and releases removed ones.
  - Without IntersectionObserver it does nothing. `dispose()` restores everything.
  - It can share visibility state with `createEffectGovernor`.
- **Preset scope.** `applyAppearancePreset` accepts a key scope, for example optical keys only. A material preset then changes optical values while keeping geometry (corners, radii, frames) as well as preferences.
- **Palette packs with alpha.** Extend `toCss` / `compileThemeCss` with:
  - A pack mode: N palettes × modes (dark/light) in one call, scoped by a palette attribute selector plus the mode selector.
  - An option to also emit color tokens as RGB channel triplets (`r g b`), so CSS can composite any alpha without JS.
  - A matching runtime helper for user-picked colors (hex to channels) in the settings applier.

  If upstream prefers `color-mix()` only, document it as the supported alpha pattern instead.

## Acceptance criteria

- [ ] With all new parameters absent, `materialStyle` output equals today's output.
- [ ] Each parameter is validated against its range. The filter chain order is tested.
- [ ] At opacity 0, no backdrop filter, gradients or noise are emitted, and frame strokes stay visible.
- [ ] Noise 0 gives no image. Noise > 0 gives a deterministic image whose alpha follows noise × opacity.
- [ ] The refraction filter changes the backdrop in Chromium. In WebKit and Firefox the blur still applies and no filter reference is emitted. Reduced transparency disables it.
- [ ] With 5,000 observed items, backdrop filters are active only on items within the viewport plus the margin. Print output is unchanged. `dispose()` restores the original state.
- [ ] A scoped material preset keeps geometry and viewer preferences.
- [ ] One call compiles a 12-palette × 2-mode pack to scoped CSS with optional channel triplets. Tests use an original fixture pack, not consumer values.

## Consumer code that becomes deletable

- `src/components/panelVisibility.js` (55), `src/panels.css` (9), `src/components/LiquidRefraction.jsx` (59).
- `src/skins.materials.css` (355), `src/skins.liquid.css` (298), `src/skins.glass.css` (105). The generic surface rules go; skin-specific decoration stays.
- The material part of `src/skins.future.css` (713 in total; the HUD artwork stays).
- The mechanism in `src/settings/schema.materials.js` (93; the preset values stay as content).
- The noise, channel and invisible-surface code in `src/settings/apply.js` (about 35 of 110 lines).
- `scripts/build-ui-palettes.mjs` (25) and the generated `src/skins.palettes.css` (217). The palette source `src/ui/palettes.lino` (288) stays as content.
