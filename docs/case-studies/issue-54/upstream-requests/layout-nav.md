ui-components/layout: scrolling link navigation with centred current item and edge fades, section nav, link-card grid, titled section, and quick preference switches

## Context

konard/konard.github.io#54 migrates the personal site fully onto link-foundation/ui, and the draft is https://github.com/konard/konard.github.io/pull/55. The site shell (top bar, page navigation, section navigation, page cards) is still custom because upstream has no page-link navigation. This request follows #66 and #210. The site has no licence, so this is a behaviour specification only and no site code is copied. The brand, footer content and page texts stay in the site.

## Current upstream (b4baef4)

- `packages/ui-components/src/layout/app-shell.js` provides a bottom bar, rail or drawer by breakpoint.
- `layout/tab-strip.js` is a `tablist` with an overflow "More tabs" menu. It is meant for tabs, not for page links with `aria-current`.
- `layout/surfaces.js` has `app-bar` (`position sticky`) and `card`. `layout/grid.js` takes CSS-grid track lists, and `controls/link.js` handles safe links and `ui-navigate`.
- `ui-i18n` `setLocale`, the `ui-sound` comfort fields (`sound.enabled`, `sound.volume`) and `ui-animation` reduced-motion variants exist, but none of them has a ready header switch.
- Viewport marking of costly panels is requested separately in materials.md (`observeMaterialVisibility`), so it is not repeated here.

## Required behavior

- **`nav-strip` (page links).**
  - Markup is `<nav aria-label>` → list → links, and the current item gets `aria-current="page"`.
  - Narrow widths scroll horizontally, with the scrollbar hidden and the keyboard and touch scrolling kept.
  - When the strip overflows, the current link is scrolled to the centre on mount and on route change.
  - A side with hidden content gets `data-more="start|end"` with a 1px tolerance, updated on passive scroll and resize. The token-driven fade (default 2rem mask) appears only on sides that have more content. Direction is logical (RTL aware).
  - An option `wrap-below: <breakpoint>` moves the strip onto its own full-width row under the bar.
- **`section-nav`.** A second strip that has the same edge behaviour and links to in-page anchors. It starts with an optional back-to-top icon link that has an accessible label.
- **`titled-section`.** A `<section aria-labelledby>` with an optional kicker line above an `h2`. The heading level is configurable.
- **`link-cards`.**
  - The grid is `auto-fill` with `minmax(--min, 1fr)` (default 240px). Each card is a single link with an icon or glyph slot, a title and a summary.
  - Hover/focus lift respects reduced motion, and the whole card is the target with one accessible name.
- **`pref-switches` (app-bar slot).**
  - The language group uses buttons with `aria-pressed` and a `lang` attribute on each label, and calls `setLocale`.
  - The sound toggle has two icons and binds `sound.enabled`.
  - The motion toggle (auto/on/off) follows `prefers-reduced-motion` in auto.
  - The theme cycle goes system → light → dark, and its accessible name gives the current theme and the next one.
  - Everything persists through `bindConfig` comfort fields.

## Acceptance criteria

- [ ] In a 320px viewport, the current link is centred and only the overflowing sides show `data-more` and the fade. Scrolling to an end removes that side's fade.
- [ ] RTL mirrors `start`/`end`.
- [ ] Only one link has `aria-current="page"`, and Tab order equals DOM order.
- [ ] Below the `wrap-below` breakpoint the strip takes a full row without overlapping the bar.
- [ ] The back-to-top link has an accessible name, and section links move focus to their targets.
- [ ] Each link card exposes one link, and reduced motion disables the lift.
- [ ] The theme cycle announces "system, next light" (localized), and choices survive a reload.
- [ ] axe reports no violations for any new element.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| src/components/Layout.jsx | 128 (most of it; brand and footer remain) |
| src/Layout.css | 887 (about 160 lines of nav rules, roughly 186-345) |
| src/components/edges.js | 31 |
| src/components/Section.jsx | 17 |
| src/components/PageCards.jsx | 21 |
| src/components/PrefSwitches.jsx | 75 |

No unlicensed site code is copied upstream.
