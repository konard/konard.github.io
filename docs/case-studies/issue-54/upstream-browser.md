# Browser entry points and inspector assets fail in an external Vite build

Source: link-foundation/ui f72e97fe2db100d88ea460ee8451bbf63a1b01b6.
Consumer: konard/konard.github.io PR 55, Vite 8.3.5, React 19.

Reproduction:

1. Install the workspace packages as local npm tarballs in an external Vite app.
2. Dynamically import `@link-foundation/ui-devmode/foreign`.
3. Build and serve the production output, then call `mountForeignDevMode()`.

The foreign adapter imports `importDom` from the ui-convert root barrel. That
barrel also exports Node conversion targets, their filesystem imports and `.lino?url`
assets. A consumer must alias the root to `src/html/import.js` to avoid bundling
unrelated Node exporters; there is no public browser/DOM-import export.

After that workaround, opening the inspector fails with HTTP 404 for
`assets/agent-instruction.txt`. `loadAgentTemplate()` and `loadLayout()` use
`new globalThis.URL('./asset', import.meta.url)`, which Vite does not recognize as
an asset reference. The same applies to `inspector.lino`. The package files are
present, but are not emitted into the production output.

The site currently rewrites just those two constructor expressions to
`new URL(...)` in a targeted Vite transform, leaving the tarballs unmodified.
The inspector then opens and shows the React DOM outline. This should work
without a consumer source transform: provide a browser export for importDom,
bundler-compatible asset references (or embedded strings), and an external
production-build smoke test. The ui-i18n root barrel also causes Node filesystem
externalization warnings even though its runtime localizer uses lino-i18n/browser;
a browser entry point would avoid these diagnostics.

Primary Vite documentation: https://vite.dev/guide/assets.html#new-url-url-import-meta-url
