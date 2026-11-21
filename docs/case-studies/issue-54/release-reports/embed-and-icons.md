Two published adapters in `@link-foundation/ui-components@0.1.1` need additional behavior to replace existing consumer widgets. Related issues are #234 and #235.

## Responsive post embeds

- Invoke `telegramProvider.render` with a valid post and then send a normal `load` event to the created iframe. The provider sets a fixed `600px` and calls `ready()` with no provider signal. A browser can also fire `load` when a cross-origin iframe fails to render a post. Short posts get a large blank area, tall posts can be cut off, and an error document can suppress the archive.
- Use the provider's official responsive widget or offer a provider sizing hook. Verify short and long posts, confirm blocked/deleted posts lead to archive fallback, and cancel old widget generations when locale, theme or post changes. Keep cross-origin access inside the official provider.
- Let X and VK receive host widget options. A consumer must be able to request X width 550 and centered alignment, and VK width `100%`, while retaining their SDK resize/cleanup behavior.
- Allow the controller to render a host archive without duplicating its wrapper and toggles. Support custom labels and preserve keyboard focus during fallback and retries.

The consumer already uses the shared script loader and retains provider-specific rendering and archive behavior.

## Tree-shakable brand assets

The generated `@link-foundation/ui-components/dist/icons/brand.js` contains only GitHub. The adapter's declared names are also limited to GitHub. Offer browser-ready per-icon exports or a documented build-time mapping that imports selected marks from an installed version of Simple Icons, plus an extension point for approved local glyphs. This avoids shipping or fetching the whole catalog. Include representative Telegram, X, YouTube, VK, Discord, Stack Overflow and Habr fixtures. Keep the accessible decorative/semantic labeling choices and respect withdrawn marks.

The consumer imports its existing SVG marks by name to preserve visual and bundle parity. See [PR 55](https://github.com/konard/konard.github.io/pull/55).
