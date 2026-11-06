Konard migration: preserve configurable network geometry, transparent frames and optical layers

Observed at f72e97fe2db100d88ea460ee8451bbf63a1b01b6 during #66 / konard/konard.github.io#54. These are reusable visualization/theming features, not personal site content.

Network renderer gaps versus current konard.github.io:

- One continuous cubic curve per link, its own middle as a reference point, symmetric double self-loops and independent start/end/middle markers (nine shapes) with sizes/angles/offsets/rotations, sharp arrow joins and compensated painted tips.
- Independent per-link turns and four gaps, anchored curve bending, exact neutral geometry at zero turns, fixed-angle/mirrored ends, free ends, loop bends, aspect/order/spacing, fit margins and exported solver-pinned frames.
- Collision scoring/solver that prioritizes turns over gaps and uses painted marker clearance; traversing network sizes keeps user inputs, URL/history and saved styles consistent.
- Exact preview/export parity including SVG, PNG, JPEG/WebP backgrounds/cards/borders, captions in four notations, font choices, dimensions and decimal indexes beyond safe Number range.

`links-view/networkGeometry` and its fixed loop/marker options do not currently implement this surface. For example compare default `11 22 12`, a doubly self-referencing link and a zero-turn two-link network with independent start/end gaps. Existing consumer geometry/solver/export/browser tests provide executable cases. This prevents deleting the custom geometry/solver/export backend in #66 without regressions.

Theme/frame gaps:

`ui-themes/classic/frames.frameStyle` supports one corner and one size shared across all corners, with sizes capped at 48. Cut/tall/wide sizes are emitted as percentages despite the API describing pixels. The site requires independently configured corner shapes, sizes, widths and strokes on four corners and four edges; all hover/active/selected states; independent inheritance at panel/control/button/field/tab/chip/menu/nav/subnav/table levels; fit constraints for tiny elements; and genuinely transparent cuts on every material. Bracket/gap/line/accent combinations must remain independent of the underlying surface. Current single clipped-border implementation cannot represent these controls.

The shipped konard theme packs also omit the current site's twelve complete dark/light palettes, optical noise/refraction/material opacity and transparent surface inheritance; presets must not override the viewer's motion/sound/volume/transparency choices. Site-specific artwork may remain a host renderer, but the reusable frame/material/animation governor and sound-control contracts should be framework extensions.

Proposed solution: public network geometry/export/solver provider interfaces and declarative per-corner/per-edge/state/level frame schemas, plus material shader/noise hooks. Migrate the consumer only after the existing pixel/geometry contracts pass. The draft keeps these backends as explicit compatibility adapters, while using the framework token resolver for all twelve palettes and its settings/controls/i18n/devmode infrastructure. No unlicensed site code is copied upstream.

Consumer evidence and draft: https://github.com/konard/konard.github.io/pull/55
