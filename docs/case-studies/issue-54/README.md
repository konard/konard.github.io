# Issue 54: framework migration draft and parity study

Work: [issue 54](https://github.com/konard/konard.github.io/issues/54),
[PR 55](https://github.com/konard/konard.github.io/pull/55).
Research date: 2026-11-05. Baseline site: `f169665` (main).
Framework snapshot: `f72e97fe2db100d88ea460ee8451bbf63a1b01b6`.

The draft integrates framework settings validation/defaults/differences,
select rendering and behavior, floating color-picker positioning, translation
catalogs, palette tokens, the official notation parser, and the DOM inspector.
The original rich settings panel, transparent frames, network geometry and
optical/audio backends remain necessary compatibility implementations.
**Full upstream support for every reusable feature is still blocked by the
gaps reported below. This is not a completed replacement of all site UI.**

## Complete requirement inventory

The issue body is preserved in `data/issue-54.json`. It has no comments or
required child issues. All three PR feedback channels were read: conversation
comments, inline review comments and submitted reviews; none contained feedback
at the initial audit. Upstream issue 66 is related design guidance based on an
older site revision; its full body and comments are preserved separately.

| Original requirement | Considered solution and executed plan | Verification / status |
| --- | --- | --- |
| Fully draft migration to link-foundation/ui | Install a reproducible source snapshot; integrate current supported APIs; retain explicit adapters at unsupported boundaries | Eleven pinned packages; `src/ui/framework.test.js`; production build and browser migration smoke |
| Double-check similar or close rendering | Freeze old settings/looks, capture before and after using identical seeded browser inputs, compare themes, sizes, pages and presets | `renderings.mjs`, committed representative screenshots and comparison data |
| More polished behavior wins | Preserve the existing rich previews, frames, live editing and geometry; adopt framework controls, collision-safe placement and inspector where usable | Existing feature/browser suites plus migration checks; no blanket replacement with less capable widgets |
| Report every framework missing feature or bug blocking full use | Reproduce actual failures and compare source APIs with current contracts; file grouped, actionable upstream reports | Reports 209–212, exact report bodies retained here |
| Draft with workarounds at the same time | Compatibility schema projection, control events/styles, legacy storage/CSS boundary, source archives and Vite asset transform | Public-contract tests, palette/default fixtures, production inspector and keyboard checks |
| Ensure all reusable features are fully supported upstream, making this site's UI as short as possible | Prefer framework engines; identify APIs required to remove each remaining generic backend; propose provider/schema extension points | **Blocked:** the current upstream release cannot express the complete control/panel/frame/network/material contracts. Reports alone do not satisfy this criterion |
| Collect all data in docs/case-studies/issue-54 | Preserve issue/feedback/source metadata, frozen schemas/looks/palettes, upstream reports, verification records and screenshots | This directory and its relative links; source archives and manifest are under `vendor/link-ui` |
| Deep analysis, online facts, existing components/libraries, solutions and plans for every requirement | Inspect current framework code and recent related PRs; consult primary npm, Vite, WAI and Floating UI documentation; compare alternatives below | Source links and reasoning below; plans per requirement and per remaining backend |
| Execute in this single PR until every criterion is addressed | Keep the draft, adapters, tests, evidence and findings together in PR 55; retain positive closing reference | PR remains unmerged; the full-support criterion above must remain explicitly unfinished |

## What moved into the framework

| Area | Framework implementation | Consumer boundary that remains |
| --- | --- | --- |
| 608 settings in 20 sections | `ui-settings` readSchema/defaults/merge/diff and shared-look comfort metadata | Existing metadata is projected to a framework schema. Reject wrong JSON primitive types, preserve continuous imported values, legacy transparent-surface migration |
| Select controls throughout settings/editor | `ui-components/controls` mountControls, official LiNo behavior machine, ui-dom/store and Floating UI | React event/label/skin bridge, disabled-option click guard, Tab commit, ten-option page keys, configurable menu bounds, Safari focus |
| Color picker position and channel parsing | `ui-components/overlays.positionFloating`, controls.parseHex | Preserve live hex drafts, RGB sliders and named palettes; observers exist only while open |
| Static English/Russian messages | `ui-i18n` readCatalogs/createLocalizer/message; 808 entries in each locale catalog | Lazy bilingual getters keep CV exports, stable keys and existing language switch compatible. Dynamic domain messages and external data retain their existing representation |
| Twelve palettes, dark and light | `ui-tokens` readTokens/resolveTokens/toCss over `src/ui/palettes.lino` | One RGB-channel CSS bridge preserves alpha compositing and existing surfaces exactly |
| Links Notation network input | `ui-core.parseLinks`, backed by official links-notation | Numeric network semantic validation, comma compatibility and historical adjacent-pair line separation; other mathematical/base representations are domain code |
| Optional development UI | `ui-devmode/foreign` over the whole React document | Lazy URL/hotkey activation; browser import alias and asset-reference transform until report 212 is fixed |

No new general-purpose widget library was introduced alongside the framework.
The archives contain upstream code and license files; they are not a local
reimplementation under the framework's name. Node-only generation keeps the
catalog and token sources usable by build tools, CV export and browser code.
The site retains its existing React entry points and all ten real page URLs.

## Upstream reports and deletion gates

| Report | Evidence and workaround | What must happen before deleting the consumer implementation |
| --- | --- | --- |
| [209: package publication](https://github.com/link-foundation/ui/issues/209) | npm E404 for the workspace package; siblings are 0.0.0. Ship immutable local npm archives with manifest hashes | Publish coordinated, versioned packages and test installation/build in an external consumer |
| [210: controls and settings](https://github.com/link-foundation/ui/issues/210) | Disabled-option click closes the list; Tab/page behavior and configurable sizing differ; rich settings has 349 conditional fields and preview/tab/level semantics | Add the reported behavior and declarative panel/codec/coercion hooks; pass current select, numeric, color, presets, before-paint and browser suites |
| [211: rendering and materials](https://github.com/link-foundation/ui/issues/211) | Network geometry/export/solver and independently configurable transparent frames cannot be represented by current APIs | Introduce geometry/export/solver providers and per-corner/edge/state/level schemas with fit/material hooks; match the existing geometry and visual contracts |
| [212: browser packaging](https://github.com/link-foundation/ui/issues/212) | Foreign inspector root import traverses Node exporters; globalThis.URL asset references produce production 404s | Supply a browser-safe converter export and bundler-compatible inspector assets; pass the production smoke test without consumer transforms |

Exact report bodies: `upstream-packaging.md`, `upstream-controls.md`,
`upstream-rendering.md`, `upstream-browser.md`. These reports describe reusable
requirements without copying site implementations into the upstream project.

Remaining generic code is deliberately inventoried, rather than hidden behind
the word “adapter”:

| Remaining consumer code | Why the framework cannot replace it today | Follow-through plan |
| --- | --- | --- |
| `SettingsPage`, previews, section placement, preset UI | Live coupled fields, conditional previews, levels/tabs, section columns, saved/imported/randomized looks | Extend the generic panel, then replace custom presentation while retaining current schema and tests (210) |
| `NumberInput`, `numericKeys`, color editor | Nullable inheritance, live invalid drafts, directional step snapping, native text-navigation shortcuts, pointer step controls and RGB palettes | Add editable-draft/value policy hooks; migrate after identical keyboard and live-preview results (210) |
| `settings/notation`, `apply`, before-paint script and storage bridge | Historical format/keys, strict JSON input, changed-only CSS, inheritance sentinels and derived values | Add codec/normalization/paint hooks; preserve old saved/share URLs and comfort choices (210) |
| `skins.frames*`, frame CSS generator, fit rules, refraction/noise/material surfaces | Four independent corners/edges, many element levels/states, transparent masks and optical layers | Framework schema/provider implementation plus the existing frame tests at every level and state (211) |
| `links` geometry, marker placement, collision solver, SVG/raster export, history UI | Continuous self-referential cubics, nine markers, independently editable turns/gaps, pinned solutions and exact preview/export parity | Implement provider hooks and migrate one backend at a time against existing editor/browser suites (211) |
| Sound bus/player and event governor | Configurable room/tone/reverb, non-repeating random selection, live gain/pan/humanization and current patches | Extend framework audio contracts; preserve no-autoplay, suspension and existing fake-audio tests (211) |
| Shader/canvas backgrounds, chart tooltip and chart-specific renderers | Existing artwork/interaction and accessible data renderers do not all have equivalent framework primitives | Keep domain data/artwork; upstream reusable governor/material/anchoring primitives before replacing generic pieces (211) |

The site's repository contains no license grant permitting transplantation of
its implementation upstream. Related upstream issue 66 explicitly calls for
an owner licensing decision before copying code. This migration neither picks
a license for the owner nor copies unlicensed source to another repository.
New upstream implementations or owner-authorized contributions are needed to
meet the full-support criterion; preserving functionality here is not proof
that upstream already supports it.

## Alternatives and primary-source research

The npm documentation permits local file dependencies and notes the installation
requirements for them. Immutable packed archives avoid depending on a live
monorepo layout while publication is unavailable. All eleven package digests
are tested, and npm's lockfile supplies integrity checks during installation.
[npm package.json documentation](https://docs.npmjs.com/cli/configuring-npm/package-json/).

Using native HTML select would reduce event code, but would lose the site's
configurable framed popup and styling. The framework select is the chosen
shared implementation. Its keyboard behavior was compared with WAI's
select-only combobox example, which describes committing on Tab and retaining
the previous selection on Escape. Existing regression tests protect those
behaviors; these tests do not constitute a screen-reader certification.
[WAI example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).

Floating UI already underlies the framework's controls. Its autoUpdate utility
handles scroll/resize anchoring and requires cleanup when an overlay closes.
The color picker now calls the framework positioner only while mounted, removing
its hand-written resize/scroll position calculation. Adding another popover
dependency would duplicate an existing framework facility.
[Floating UI autoUpdate](https://floating-ui.com/docs/autoupdate).

Vite statically analyzes the standard new URL pattern for asset bundling. The
upstream globalThis.URL variant is not recognized in the observed production
build. A two-file transform enables normal asset handling, while an exact
converter alias avoids unrelated Node conversion targets. The source archives
stay unmodified, making both workarounds removable and auditable.
[Vite static assets](https://vite.dev/guide/assets.html#new-url-url-import-meta-url).

The existing React 19 host already supports the site's data-heavy content and
CV generators. Replacing it wholesale before frame/panel/network parity would
increase risk without eliminating the unsupported backends. A framework-owned
island for each select, shared settings engines and a foreign-DOM inspector
provide actual framework behavior now. CodeMirror/Monaco, ECharts and Mermaid
are optional framework adapters for other use cases; adding them would not
solve these frame, storage or network geometry requirements. The current D3
and official Links Notation dependencies remain useful for domain rendering
and notation rather than a second competing UI stack.

## Verification protocol and limitations

Baseline artifacts were recorded before replacement in their own commit.
`src/settings/contracts.test.js` freezes saved JSON, shared-look comfort and
recovery, new share links, before-paint behavior and network URLs.
`src/ui/framework.test.js` checks every original rule/default, complete palette
CSS, generated locale data and source archive hashes. Existing select/color
tests check disabled options, keyboard navigation, focus, drafts and palettes.

`npm run test:ui:migration` runs the production integration smoke in each CI
browser job: legacy JSON, menu bounds, Tab commit and persistence, English/Russian
switching, historical/indented notation with malformed-record rejection,
mobile overflow, and opening/closing/reopening the real lazy inspector.
The repository's existing editor, geometry, slider, frame, export and CV
coverage remains in the workflow; it must pass on the final PR commit.

Rendering samples use frozen default/calm/fast presets, light/dark themes,
1280×800 and 390×844 viewports, and home/settings/network/art routes. Randomness
is seeded, motion disabled, fonts awaited and remote content blocked in both
phases. Each sample starts a fresh browser to bound canvas/GPU memory. Pixel
differences are evidence for review, not an excuse to replace more polished
features. Representative before/after PNGs are in `screenshots/`.

An initial Linux WebKit matrix probe was killed under this container's 2.92 GiB
memory limit when browser and other work overlapped. It is not recorded as a
pass. Subsequent local browser work runs sequentially; CI's macOS WebKit job
provides the platform-specific editor/frame coverage. No timeout or memory
budget was raised to conceal this limitation.

The comparison discovered an actual draft regression: palette CSS omitted
all RGB channels because a closing-brace replacement ignored the generated
trailing newline. That failure removed neon frames. The corrected generator
now has a complete 24-palette fixture comparison, and the final screenshots
must be regenerated after that correction.
