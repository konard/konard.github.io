ui-components/icons: brand icon set (Simple Icons), static builds of app-chosen names, filled/stroke variants and inline icons in localized messages

## Context

konard/konard.github.io#54 migrates the personal site fully onto link-foundation/ui, and the draft is https://github.com/konard/konard.github.io/pull/55. Its icon module still imports `simple-icons` and `lucide-react` directly. This request follows #66 and #210. The site has no licence, so this is a behaviour specification only and no site code is copied. Which icon belongs to which contact or skill is site data and stays in the site.

## Current upstream (b4baef4)

- `packages/ui-components/src/icons/icon.js` defines `ui-icon` / `(icon ...)`. Its attributes are `name`, `set`, `label` and `mirror`.
  - It draws in `currentColor` at a size set by `--ui-icon-size`. Without a label it is decorative, and with one it gets `role="img"`.
- `icon-registry.js` provides `registerIconSet`, `createStaticSource`, licence records and the own-set → placeholder fallback.
- `adapters/lucide.js`, `tabler.js` and `material-symbols.js` exist. `createAdapterSource` passes unmapped names through, so `lucide:flame` already resolves at runtime.
- `scripts/build-icons.mjs` writes `dist/icons/<set>.js`, sprites, NOTICE and ATTRIBUTION, but only for the logical names in `names.js` (`ICON_NAMES`, 32 names).
- `ui-i18n` message params (`message.js`) are strings, numbers or messages, with no element or icon slots.

## Required behavior

- **Brand set adapter.** Add `adapters/simple-icons.js` with `createSimpleIconsSource()` for the `simple-icons` package (CC0-1.0), registered as set `brand`.
  - `brand:github` resolves to a fill-based 24×24 mark in `currentColor`.
  - The default accessible name is the brand title when `label` is `true`, otherwise the icon is decorative.
  - Records carry CC0 plus a trademark notice in ATTRIBUTION. Marks the library has withdrawn resolve to the placeholder, and a diagnostic names the missing brand.
- **App-chosen static subsets.** `build-icons.mjs --names <file.lino>` (or a `names` option of the adapter source) adds extra library names beyond `ICON_NAMES`.
  - The output is a static module and sprite with exactly those icons and their records, so a static site needs no runtime package resolver and ships only the icons it uses.
  - Unknown names fail the build and the error lists them.
- **Presentation variants.**
  - `fill="current"` fills stroke icons (solid star, dot, heart, flame).
  - `stroke-width` takes a number from 0.5 to 3 (default: the library's own). `size` takes a token or length as a shorthand for `--ui-icon-size`, for example `1em` to match the text.
  - Values outside the ranges are reported and ignored.
- **Inline icons in messages.** Add a `ui-i18n` param type `(icon SET:NAME (label (t KEY)))`, or a helper that returns text and icon parts for `{token}` placeholders.
  - Each icon gets `role="img"` and a localized label. An unknown token stays as literal text.
  - Screen readers read the label in place of the icon, so emoji and symbol glyphs can be dropped.

## Acceptance criteria

- [ ] `(icon (set brand) (name github) (label true))` renders a filled mark named "GitHub". Without a label it has `aria-hidden="true"`.
- [ ] Removing `simple-icons` falls back to the placeholder and emits a diagnostic, never an empty element.
- [ ] `build-icons --names` with 20 names writes exactly 20 icons, plus their records, NOTICE and licence files.
- [ ] `fill="current"` on `lucide:star` produces a solid star in the text colour in light and dark themes.
- [ ] A message `I {love} links` renders text + icon + text, and the accessible name reads the localized word in both locales.
- [ ] An unknown `{token}` renders literally.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| src/components/icons.jsx | 143 (all but the site's id → icon map, about 30 lines) |

Not requested:
- `src/components/Glyph.jsx` (27) draws a link-network glyph. It depends on the network geometry already covered by the rendering request, not on the icon pipeline.
- The hand-drawn LinkedIn fallback stays a consumer-registered set through the existing `registerIconSet`.

No unlicensed site code is copied upstream.
