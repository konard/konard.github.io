ui-components/links-view: default doublet-network renderer with one cubic curve per link, symmetric loops, turns/gaps and nine parametric markers

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to remove all general-purpose UI code from the site. Related upstream work is #66, and this issue follows up the renderer criteria that #211 left unfinished ("continuous cubic links, own-middle anchors, double loops, nine markers, compensated tips, turns, four gaps, ... fit margins, caption notations, cards, borders, dimensions"). #217 added the provider bridge, but the site still has to supply all geometry and SVG itself. Licensing: the site has no license, so this issue is a behavior specification only. No site code is copied here.

## Current upstream

At b4baef4:

- `packages/ui-components/src/links-view/geometry.js` provides `linkGeometry({source, target, bend, selfLoop, loopRadius})`: nine Catmull-Rom points converted to cubics, a parabolic `bend` and one teardrop `selfLoopPoints` (`DEFAULT_LOOP_RADIUS` 24).
- `network-scene.js` `networkGeometry(link, positions)` draws two curves (source to an allocated centre, then centre to target) and uses loop radius 16. It has no turns, gaps, tension, mirroring or loop symmetry.
- `markers.js` has five shapes (`bar`, `arrow`, `cross`, `dot`, `none`) as fixed 100-unit `svgMarkerDefs`. They have no size, angle, offset or rotation parameters, and there is no middle marker.
- `export.js` `networkToSvg(network, positions, style)` has no background, card, border or caption.
- `layouts/` provides circle, grid, hex, spiral, force, layered and regular. It has no dice or cards layout and no `order` or aspect option.
- The bridge in `presentation.js` and `docs/spec/network-providers.md` already handles jobs, options, frames and export. It is not requested again here.

## Required behavior

Add a built-in default provider (for example `createDoubletProvider()` returning `geometry`/`svg` for `createNetworkPresentation`). Also extend `MARKERS`/`networkToSvg`, or add equivalents.

- **Input:** links `[[s, t], ...]` with 1-based ids. `0` is a free end and `i` on link `i` is a self-reference. Every id must be in `0..n`.
- **Links:** each link is one continuous path of two cubic segments that share a tangent at the link's own middle. The middle is the anchor other links refer to.
- **Layout units:** neighbouring middles are 1 unit apart and are fitted into a 100-unit box.
- **Free ends:** a free end has length 0.42 × `free` (0.9 × `free` for a lone link).
- **Self-loops:** a self-loop leaves the middle sideways and returns through it. Its size is 0.8 × `loop` (1.25 × `loop` for a lone link).
- **Double self-loop:** `(1: 1 1)` draws a figure-eight whose two loops are point-symmetric about the middle.
- **Middle direction:**
  - With two references it is the bisector of the incoming and outgoing chords.
  - With one reference it is the chord rotated by `bulge`.
  - With no references it is the outward direction of the place.
- **End angles:**
  - `angles: fixed` rotates the chord by `sourceAngle`/`targetAngle`. The default is 30°, the range is −180..180, and an aligned chord stays straight at zero turns.
  - `angles: mirror` reflects the middle tangent across the chord. Two references to the same link meet it at 45° and form a lens.
- **Handles and turns:**
  - Handle length is `tension` × chord length. The default is 0.4 and the range is 0..2.
  - Per-link `turns` `[source, target]` are integer degrees in −180..180 and are added to the end directions.
- **Overlap bends:** two neutral straight references that overlap on one line are each bent 45° at the far end. This gives a point-symmetric lens.
- **Loop bend:** loop width is `exp((bulge + loopBend)/180)`.
- **Four gaps per link:** start gap, end gap, cut before middle and cut after middle.
  - Start and end gaps are in layout units (0..1, default 0.08).
  - Cuts are arc length in box units (0..30).
  - `null` inherits the global value.
  - A cut that consumes a whole half omits that half.
- **Markers:** independent `start`, `end` and `middle` markers, each one of `bar`, `arrow`, `triangle`, `tail`, `dot`, `circle` (ring), `square`, `diamond` or `none`.
  - `size` is 0.5..15.
  - `angle` is 5..85° and applies to arrow, triangle and tail only.
  - `offset` is −20..20 along the arc. Past an end it continues along the tangent, and positive values move inward.
  - `across` is −20..20 and moves the marker sideways.
  - `rotation` is −180..180 and does not apply to none, circle or dot.
  - Defaults:
    - start: bar 2.5 with offset 2.5 (angle 70)
    - end: arrow 3.5 at 45°
    - middle: dot 2
- **Arrow join and tip compensation:**
  - Arrows use `arrowJoin` miter, round or bevel. The miter limit is at least `1/sin(angle)`, so tips are never clipped.
  - With `balanceArrows`, the painted tip of an end arrow, triangle or start tail lands on the geometric end: the stroke is shortened by `strokeWidth/2/sin(angle)` plus the cap.
  - Markers with an explicit offset, across or rotation are not compensated.
- **Fit:**
  - The fit margin is min(48, max(`padding` (default 9), the largest marker extent + `strokeWidth`/2)), and the scale is capped at 60.
  - An optional pinned `frame` `"scale x y"` skips fitting. It needs three finite numbers with |v| ≤ 1e6 and a scale in (1e-9, 60].
- **Placements:**
  - Add `dice` (pips for 1–6, tiled) and `cards` (two columns at ±0.7) layouts.
  - Add circle `order`, which is a permutation of all ids.
  - Add `layoutAspect` (0.3..3), `columns` (0..30, 0 = auto), `spread` and `rotation` for all layouts.
  - `auto` uses circle for 1–4 links and hex otherwise.
- **SVG output:**
  - Line style: stroke width 0.5..10, dash solid/dashed/dotted/dashdot/long relative to the width, and linecap. Opacity is 0.1..1 and glow is 0..12 (Gaussian blur).
  - Background: transparent, solid, linear or radial (two colours and an angle).
  - Card: colour and opacity, border solid/dashed/dotted/double/none with width 0.1..6, radius 0..50 and inset 0..30.
  - Caption: none, theory, pairs, number, links or custom text (≤ 80 characters), in a mono, sans or serif font with size 3..14. The caption gets reserved room and is compressed with `textLength` when it would overflow.
  - Output size is width and height from 64 to 4096 px.
  - The shorter side of the viewBox is 100, so preview and export use identical markup.
  - Accessibility: `aria-label`/`title` read "Links network 11 22 12".
- **Availability helper:** export a helper that reports whether an option can affect a given network. For example, `loop` matters only with a self-reference and `free` only with a `0` end. This lets editors hide inert controls.

## Acceptance criteria

- [ ] `11 22 12` renders three links, each as one `path` of exactly two cubic segments. Each link's tangent is continuous at its own middle.
- [ ] `11` renders a figure-eight whose two loops map onto each other under a 180° rotation about the middle (within 1e-6).
- [ ] `00` (a lone link) renders a straight neutral link with both free ends 0.9 units long. In `11 22 10`, link 3's free end is 0.42 units long.
- [ ] Turns `30 -30` on link 1 of `22 11` change only link 1's end directions by exactly those angles.
- [ ] Gaps `0.2 ~ 5 ~` on link 1 shorten the start by 0.2 units and cut 5 box units before the middle. The end inherits the global value.
- [ ] Each of the nine marker shapes renders at sizes 0.5 and 15. An end arrow's painted tip sits on the curve end within 0.01 for miter, round and bevel joins.
- [ ] A pinned frame `2 10 -5` is used verbatim, and `0 0 0` or `61 0 0` is rejected.
- [ ] A circle `order` of `3 1 2` permutes the places. A non-permutation is rejected.
- [ ] Every caption mode renders within the card for 1, 9 and 12 links.
- [ ] Each background and card variant appears in both `toSvg` and `toRaster` output.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| `src/links/glyph.js` | 556 |
| `src/links/render.js` | 171 |
| `src/links/style-geometry.js` | 263 |
| `src/links/curve-tools.js` | 90 |
| `src/links/gaps.js` | 30 |
| `src/links/notation.js` | 25 |
| `src/links/placement.js` | 190 |
| `src/components/Glyph.jsx` | 27 |

The renderer parts of `src/links/style.js` (597 lines total) also become deletable: the schema and defaults for lines, background, card, caption and size.
