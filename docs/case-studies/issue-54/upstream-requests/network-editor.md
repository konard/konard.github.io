ui-components/links-view: network editor panels with live notations, per-link controls, looks, sharing and URL sync

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to remove all general-purpose UI code from the site. Related upstream work is #66. This issue follows up the #211 criteria that were left unfinished: "traversing network sizes keeps user inputs, URL/history and saved styles consistent" and "exact preview/export". It builds on the issues for the renderer (`network-renderer.md`), the solver (`network-solver.md`) and the notations (`network-configurations.md`). Licensing: the site has no license, so this issue is a behavior specification only. No site code is copied here.

## Current upstream

At b4baef4:

- `packages/ui-components/src/links-view/presentation.js` already provides the parts the site would otherwise write itself:
  - `update`
  - `subscribe`, a URL/history hook
  - `toSvg`
  - `toRaster`, for PNG/JPEG/WebP with matte, a 16,777,216-pixel cap and MIME checking
  - `toLino`
  - `<links-network>.presentation`
- `packages/ui-components/src/editor/` has a LiNo code editor (`code-editor`, `validate-lino`, `lino-highlight`).
- `packages/ui-store/src/history.js` (`createHistory`) provides undo/redo for store transactions.

None of these are requested again. What is missing is an editor surface: no options schema, no controls bound to it, no share helpers and no URL serialisation of network options.

## Required behavior

Add a declarative option schema with URL round-trip, plus a `<links-network-editor>` (or adapter components) that renders these panels for a `createNetworkPresentation` instance.

- **Option schema:**
  - Every renderer and solver option is described with its key, type, range, step, default, section and availability predicate.
  - `normalize` clamps and validates options.
  - `toParams` writes only non-default values to the URL. `fromParams` restores them. Unknown parameters are ignored.
  - Legacy `gap` maps to both the start and end gaps. Colours without a palette imply `custom`.
- **Notations panel:**
  - Shows the theory, pairs, number, decimal and links notations as editable fields.
  - Each valid keystroke updates the network at once. An invalid one shows the localised reason with `role="alert"` and `aria-invalid`, and does not change the network.
  - The text being typed is kept until the network changes elsewhere.
  - A summary line gives n, the base, the digit count and "one of N networks".
- **Links table:**
  - One card per link with a source select and a target select (0 = nothing, self, or another link). Above 50 links these switch to numeric inputs.
  - Each card has a colour, start/end turns with reset-to-default, four gap fields where an empty value means inherit, and a remove button that is disabled for the last link.
  - Removing link k renames references and drops that link's turns, gaps and colour.
  - Actions:
    - add link
    - previous/next in counting order across sizes
    - random
    - random using real links only
    - canonical renaming, disabled above 7 links
- **Style panel:**
  - Sections follow the schema. Controls that cannot affect the current network are hidden.
  - Each section has a reset that is disabled when nothing changed.
  - Looks presets (card, black, transparent, paper, blueprint, neon, social 1200×630) replace the style but keep the notation, turns, gaps and solver options.
  - Size presets: 512, 1024, 2048, 1080, 1200×630, 1600×900 and 1080×1920.
  - Named styles can be saved and loaded from local storage.
- **Pinned frame:** editing geometry clears a pinned `frame`. Editing colours keeps it. Changing the link count clears circle `order`.
- **Solver UI:**
  - "Apply" runs the solver job and applies only its turns, gaps and frame.
  - It shows a busy state, errors and "collisions before → after".
  - Export buttons are disabled while the solver runs.
- **Share panel:**
  - Downloads SVG, PNG, JPEG, WebP and `.lino` (one link per line), named `links-network-<code>.<ext>` with at most 160 characters.
  - Copy actions: link, SVG and image. The image `ClipboardItem` is created synchronously inside the click so WebKit user activation holds.
  - Web Share uses a PNG prepared ahead of time (200 ms debounce), with a fallback to sharing the link.
  - A read-only URL field and share-target links (X, Telegram, VK, Facebook, LinkedIn, Reddit, Bluesky, Mastodon, WhatsApp, e-mail).
  - Results are announced through `aria-live`.
- **URL sync** (a helper on `subscribe`):
  - Uses `history.replaceState`, debounced by 400 ms. No back/forward entries are added.
  - Writes are deferred while a range or colour input is held by pointer, touch or slider keys.
  - Failed writes are retried with backoff of 1 s·2^k, giving up after 5 failures. A `SecurityError` is survived.
  - Debug logging is opt-in.
- **Optional undo/redo:** reuse `ui-store` `createHistory` for undo and redo. The site does not have this today.

## Acceptance criteria

- [ ] Typing `0120₃` into the number field updates all other fields to `01 20`, `λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}` and `(1: 0 1) (2: 2 0)`.
- [ ] Typing `0120₄` shows a base error and leaves the drawing unchanged.
- [ ] `toParams(normalize({}))` is empty. A round-trip of every option at its minimum and maximum is lossless.
- [ ] Removing link 2 of `01 20 32` gives `01 20`, and link 3's turns and colour move to link 2.
- [ ] Next from `22 22` gives `00 00 00`.
- [ ] Dragging a slider for 2 s produces no `replaceState` call until release, and then exactly one after 400 ms.
- [ ] A `replaceState` that throws `SecurityError` does not break editing.
- [ ] After a colour edit the pinned frame is still present in the URL. After a tension edit it is gone.
- [ ] The downloaded PNG has the same pixels as `toRaster` for the same options. The JPEG uses the background colour as matte.
- [ ] The `loop` control is hidden for `02 10` and shown for `11`.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| `src/pages/NetworkEditor.jsx` | 316 |
| `src/pages/NetworkPage.jsx` | 267 |
| `src/pages/NetworkStyle.jsx` | 259 |
| `src/pages/NetworkShare.jsx` | 195 |
| `src/pages/NetworkGaps.jsx` | 47 |
| `src/pages/useNetworkHistory.js` | 85 |
| `src/links/export.js` | 118 |
| `src/links/style.js` (schema, looks and sizes) | 597 |
| `src/pages/network.css` | 405 |

`src/pages/network.jsx` (4 lines) would remain as the host page.
