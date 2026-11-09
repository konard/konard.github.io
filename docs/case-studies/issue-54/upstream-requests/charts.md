ui-components/charts: calendar heatmap, range timeline, tag cloud, composition bar, log scale and unclipped rich tooltips

## Context

konard/konard.github.io#54 migrates the personal site fully onto link-foundation/ui, and the draft is https://github.com/konard/konard.github.io/pull/55. The site still draws its own activity charts because the chart kinds and options below do not exist upstream. This request follows #66 and #210. The site has no licence, so this is a behaviour specification only and no site code is copied. Data fetching and texts stay in the site.

## Current upstream (b4baef4)

- `packages/ui-components/src/charts/` (`chart.js`, `chart-model.js`, `scales.js`, `svg-renderer.js`, `summary.js`, `echarts-adapter.js`) implements a ChartSpec with these features:
  - line/area/bar/point/arc marks and horizontal and stacked bars;
  - a legend, a summary and a table toggle;
  - Left/Right point navigation, an `aria-live` announcement and a pointer nearest-point tooltip.
- `scales.js` supports nominal/ordinal/temporal/quantitative, all linear. There is no log scale.
- The tooltip is a plain-text `div` inside the chart canvas, so `overflow`/`clip-path` ancestors cut it off. `overlays/position.js` (`positionFloating`, `virtualAnchor`) already exists for the top layer.
- `stat-tile.js` has label/value/unit/delta/trend; `sparkline.js` and `gauge.js` also exist.

## Required behavior

- **Log scale.** Quantitative encodings accept `scale: {type: 'log', base: 10}`, with sensible ticks (1, 10, 100…) and zero/negative values clamped and reported.
- **Bars.** Add `cornerRadius` for the value end of bars. `labels: 'peaks'` direct-labels local maxima, and `labels: 'last'` labels the final point.
- **Rich tooltip outside clipping.**
  - `tooltip: {content: (datum) => ({title, value, rows: [[label, value]]}), layer: 'top'}` renders in the top layer through `positionFloating`.
  - For pointers it anchors at the pointer, and for keyboard focus at the top centre of the focused mark. It flips to the left when the anchor is in the rightmost 40% of the plot.
- **Composition bar.** A single 100% stacked bar of shares with a legend of name + percentage. Add `topN: n` with "Other" aggregation, where Other is drawn muted and placed last.
- **Row emphasis.** `emphasis: field` marks chosen rows (for example favourites) with an icon or label that is not conveyed by colour alone.
- **Calendar heatmap** (`mark: 'calendar'`).
  - Layout: week columns × weekday rows, with a configurable week start, month labels on the first week of each month and Mon/Wed/Fri row labels.
  - Colour: 5 levels from thresholds or quantiles and a "less → more" legend.
  - Accessibility: each cell has an accessible title (date + value). The plot is a focusable, horizontally scrollable region that opens at the newest week, has arrow-key grid navigation and a table twin.
- **Range timeline** (`mark: 'range'`, Gantt-like).
  - Each row has start/end and an "ongoing" end. There are year ticks on a temporal axis.
  - The category is encoded by pattern (solid/hatched/dotted) as well as colour, with a legend.
  - Bars are focusable and show the rich tooltip, and there is a table twin.
- **Tag cloud** (`kind: 'tag-cloud'`).
  - Items are sized by log-weighted count between `minSize` and `maxSize` and can carry a per-item colour.
  - Items can be emphasized. Extra items without counts render at the minimum size.
  - The output is a semantic list with counts in the accessible name.
- **Stat tile.**
  - `notation: 'compact'` applies from a threshold (default 10000), and the exact value appears in `title` and the accessible name.
  - Add `hint` text and an optional `footnote` link.

## Acceptance criteria

- [ ] With a log y scale, values 1…100000 render evenly spaced decades, and 0 produces a diagnostic, not NaN.
- [ ] A tooltip inside a `clip-path` container is fully visible and flips at the right edge. Keyboard and pointer anchors follow the rules above.
- [ ] A composition bar with `topN: 5` sums to 100%, and Other is last and muted.
- [ ] The calendar renders 53 week columns for a year, its legend has 5 steps, arrow keys move by day/week, and the table twin lists every non-empty day.
- [ ] Range rows with no end render as ongoing, and the legend distinguishes categories in greyscale.
- [ ] Tag-cloud size is monotonic in count, and items without counts render.
- [ ] A stat tile with 123456 shows "123K" and exposes "123456".
- [ ] Every new kind passes the existing chart axe and keyboard tests.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| src/components/ContributionCalendar.jsx | 143 |
| src/components/ContributionsChart.jsx | 213 |
| src/components/LanguagesChart.jsx | 98 |
| src/components/LanguageCloud.jsx | 71 |
| src/components/Timeline.jsx | 136 |
| src/components/StatTiles.jsx | 159 (most of it) |
| src/components/Tooltip.jsx | 47 |

Not requested (site-specific):
- `src/data/calendar.js` (83): fetching contribution data and checking it against the snapshot.
- `src/components/ProblemSolvingDiagram.jsx` (254): artwork.
- `src/components/EcosystemMap.jsx` (109): the repository orbit.
- `src/components/Cosmos.jsx` (220): the background layer, already covered by the rendering request.

No unlicensed site code is copied upstream.
