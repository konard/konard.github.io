ui-components: deferred third-party post embed with provider adapters, timeout fallback and archived content

## Context

konard/konard.github.io#54 migrates the personal site fully onto link-foundation/ui, and the draft is https://github.com/konard/konard.github.io/pull/55. The blog page shows original social posts (X, Telegram, VK) through official provider widgets, and falls back to an archived copy when a provider is blocked or a post was deleted. This request follows #66 and #210. The site has no licence, so this is a behaviour specification only and no site code is copied. The archived posts themselves are site content and are not requested.

## Current upstream (b4baef4)

- Nothing in `packages/ui-components/src` renders third-party embeds.
- `packages/ui-convert/src/html/security.js` drops `script`, `iframe`, `object` and `embed` (`DROPPED_TAGS`), which is correct for converted HTML. A host therefore has no sanctioned way to show an allow-listed provider post.
- `a11y/focus.js` treats `iframe` as focusable. `controls/link.js` already rejects unsafe URLs.

## Required behavior

- **`ui-embed` element / `(embed (provider x) (id ...) (hash ...))` kind.** Providers come from an allow-list registry: `registerEmbedProvider(name, {script, render, url, validate})`. Built-in adapters for X, Telegram and VK are optional modules.
- **Validation first.**
  - Provider ids are checked against the provider's pattern (for example digits only for X, `channel/number` for Telegram, `owner_post` plus a required hash for VK).
  - An invalid id renders the fallback and never loads a script. The fallback iframe URL is built only from validated parts.
- **Deferred loading.** Nothing loads until the host is within `rootMargin` of the viewport (default 400px). Without IntersectionObserver it starts at once.
- **Script loader.** Each provider script is loaded once per page and shared. A failed or timed-out (default 10 s) request is removed from the cache so a later retry can reload it.
- **Readiness and timeout.**
  - The embed is ready when the provider reports success or an iframe with a positive height appears. It then gets `data-loaded`, and an iframe without a `title` gets a localized one.
  - It fails if it is not ready within `timeout` (default 12 s) or when the provider reports an unavailable post. It then emits `ui-embed-error` and shows the fallback.
- **Theme and language.**
  - Embeds follow the resolved theme (light/dark) and the locale. A change re-renders into a fresh container, and a late result from the old generation is discarded without clearing the new one.
  - Cleanup cancels timers and observers and removes the container.
- **Privacy and security.** Use do-not-track options where the provider has them. Never read cross-origin documents, and never act on unvalidated `postMessage` height messages (only the provider's own script resizes).
- **Fallback slot and toggle.**
  - Archived content (sanitized HTML, media) sits in a `<details>` under a live embed, or is shown directly when the embed is off or has failed.
  - An optional "show embed / show archive" button switches modes and resets the failure state.
- **Diagnostics.** With a debug flag, each state change is logged (loading, ready, fallback with reason).

## Acceptance criteria

- [ ] An embed far below the fold loads no script until it is scrolled near.
- [ ] Two embeds of one provider cause one script request. After a failed request, a retry issues a new one.
- [ ] A post that never renders shows the fallback after the timeout and emits one error event.
- [ ] Switching the theme while loading leaves exactly one widget, in the new theme.
- [ ] Ids such as `42&x=1` or `//host` are rejected with no network request.
- [ ] Rendered iframes have a title, and axe passes in both the embed and fallback states.
- [ ] Unmounting removes every timer, observer and container.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| src/components/SocialEmbed.jsx | 125 |
| src/components/socialWidgets.js | 38 |
| src/pages/BlogPage.jsx | 257 (the embed/fallback toggle part, about 60 lines) |

No unlicensed site code is copied upstream.
