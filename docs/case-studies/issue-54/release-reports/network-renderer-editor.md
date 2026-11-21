The released doublet and editor APIs cover much of #227 and #230. Remaining behavior prevents this consumer from rendering its existing diagrams and moving the entire editor onto the shared implementation.

## Geometry and style

- On `@link-foundation/ui-components@0.1.1`, call `readDoubletOptions('(linejoin: bevel)', 2)` and `readDoubletOptions('(forceCharge: 1)', 2)`. Both throw "Unknown doublet option." The contract also needs configurable spring distance and collision padding in force placement.
- Support a palette and per-link colors for every rendering target, including reusable glyphs and gallery thumbnails. The editor provider currently applies per-link color during SVG generation. The geometry and standalone doublet path need a common way to carry the same overrides.
- Make preview, standalone SVG, raster, background glyph and gallery paths share a fitted geometry and a template for the marker paths, joins, captions, frame, and artwork. The PNG/JPEG/WebP encoder shipped in 0.1.1 is already used by the consumer. The differences concern the SVG fed to it and the published editor's raster call omitting quality.
- Permit the consumer's existing rectangular sizing, caption placement and title, dark/light color inheritance, and its legacy URL vocabulary. The fixture matrix in #227 covers zero ends, self-loops, asymmetric turns and gaps, per-link colors, backgrounds, frames and captions. Compare through the same prepared frame at both desktop and thumbnail sizes.

## Editor host integration

- Allow a host to mount the notation, link-card, styles and actions panels into its own semantic HTML or drive them from a public headless model. Supply a message catalog for **all** action labels and status/errors, including `Share`, `Done`, download labels and link names in `network-editor/share.js`.
- Let URL synchronization skip unchanged URLs and release its hold when a focused continuous input loses focus before its keyup, including when the input is removed. Keep deferred persistence during pointer, touch and keyboard input and preserve unknown query parameters. Test held slider key → focusout → state change with no keyup, and repeated publication of an unchanged snapshot.
- Expose share labels and destination templates as data, including the email body and a user-selected Mastodon instance. The low-level `networkShareTargets` currently hardcodes the instance and puts only the URL in the email body.

The consumer keeps its existing styled panels, URL synchronization, glyph geometry and share UI while adopting individual released primitives. See [PR 55](https://github.com/konard/konard.github.io/pull/55).
