The published `@link-foundation/ui-components@0.1.1` implements the initial requests in #231–#233. The consumer needs the following host hooks to remove duplicate UI implementation while preserving current markup, theme and interactions.

## Settings and quick preferences

- Export the panel's presentation model, row rendering and section ordering independently enough for an existing host. A section with tabs and levels must be able to estimate its height using its _initial_ visible fields. Changing a setting must not move the active section to a different column. Test a short left column and a long right column, independent corner ownership by level, and the control that first reveals a new section.
- Make section/tab indicators and per-field label/control/value/reset/hint slots replaceable without replacing validation or keyboard behavior. Keep stable control IDs and label associations when mounted inside rich previews, and allow the host's asset and play-preview controls.
- `createPrefSwitches` cycles motion `auto → on → off` and writes text to the motion and theme buttons. Hosts need a binary override from the _effective_ preference, custom SVG and tooltip content, and existing locale text and persistence. Test on a reduced-motion system where the saved value is `auto`.
- Verify the pre-paint projection and shared/saved-look import with both older JSON and existing Links Notation. The host needs to keep current palette variables, material derivations, per-corner inheritance and viewer comfort values. Allow injecting these projections without reimplementing the import flow.

## Scroll navigation and chart tooltips

- Provide a navigation behavior attachment for a host-owned scrolling container and links. The registered strip currently constructs and scrolls an inner `nav`, and the section strip renders its own top link. Existing scroll layouts need custom DOM and an SVG top control while retaining accessible page/section links, focus on anchor navigation, logical fades and late browser layout handling.
- Allow chart layout and data-table access through a host drawing that retains native values, labels and keyboard focus. Let the host place and style one shared tooltip outside a clipped frame, with a custom overlay root, pointer/focus anchor and live accessible description. Test keyboard focus and pointer against right-hand and lower clipped edges, a contribution calendar with its own date formatting, and a timeline with a fixed ongoing range.
- Offer the same single document theme/tooltip integration for multiple chart kinds and stat tiles, including domain formatting, existing footnote locations and tap behavior.

See [PR 55](https://github.com/konard/konard.github.io/pull/55) and the linked consumer tests and screenshots.
