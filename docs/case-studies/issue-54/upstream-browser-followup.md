Consumer verification for https://github.com/link-foundation/ui/issues/212

https://github.com/konard/konard.github.io/pull/55 now uses unmodified packed
ui-i18n, ui-convert and ui-devmode from PR 214 at
`e37935ea195fca55cb2ee6a5d2c1723858cd7f81` alongside the control/settings
packages from PR 213 at `45645979bb91d99f7a308d3b9168f3757294a184`.
Each archive records its actual source revision and SHA-256 digest.

Both consumer packaging workarounds have been deleted: the exact converter
alias and the two-file asset-reference Vite transform. The production Vite
build passes. All six Chromium migration smoke checks pass with no page errors,
including opening the real foreign-DOM inspector, closing it and reopening
with Alt+Shift+D. An additional Playwright MCP check confirms the same behavior
and saves the current inspector screenshot for the consumer case study.

This verifies the original reported browser boundary in the external consumer.
The consumer's full CI remains the final integration gate. Unpublished package
distribution remains tracked separately by issue 209.
