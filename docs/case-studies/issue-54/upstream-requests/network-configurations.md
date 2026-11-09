ui-links: doublet-network enumeration, renaming classes, notations and a configurations gallery

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to remove all general-purpose UI code from the site. Related upstream work is #66. This issue follows up #211, whose bridge already accepts decimal indexes beyond the safe `Number` range but leaves it to the consumer to enumerate networks and convert notations. Licensing: the site has no license, so this issue is a behavior specification only. No site code is copied here.

## Current upstream

At b4baef4:

- `packages/ui-core` `parseLinks` parses LiNo. The site already uses it for `(1: 0 1) (2: 2 0)`.
- `packages/ui-components/src/links-view/network-model.js` `buildNetwork`/`networkInput` converts item lists. Id `0` is reserved there.
- `presentation.js` carries `index` as a lossless decimal string.
- Nothing upstream enumerates networks by index, computes renaming classes, parses or formats the numeric notations, or renders a gallery of all small networks.

## Required behavior

Add a pure module (suggested `@link-foundation/ui-links/configurations`, or `links-view/configurations.js`). Add a `<links-gallery>` component (or framework-adapter equivalents) built on the existing `<links-network>` thumbnail rendering.

- **Model:** a network of `n` links is `2n` digits in base `n + 1`, as source then target for each link. That gives `(n+1)^(2n)` networks: 4, 81, 4096 and 390625 for n = 1..4. Real-only networks use digits `1..n` only, giving `n^(2n)` = 1, 16, 729 and 65536.
- **Indexing:**
  - `codeAt(n, index, {real})` and `indexOf(links, {real})` are exact inverses.
  - Both use `BigInt` or a decimal string, so they are lossless beyond 2^53.
  - `randomCode(n, {real, random})` must not lose precision for large n.
- **Codes:**
  - For n ≤ 9, `encode`/`decode` use digit pairs separated by spaces, for example `01 20`. For n > 9 they use `s,t;s,t`.
  - The parser also accepts `0120`, `01-20` and `01.20`.
- **Notations, each with a parser and a formatter:**
  - Theory: `λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}`. The parser also accepts `->`, `→`, `=>` and `:`, and an optional `N²=`. L/R notation switches the set name.
  - Pairs: `01₃ 20₃`. For n > 9 use `(s,t)₁₁`.
  - Number: `0120₃`. The parser also accepts `0120_3`, and `[d d ...]₁₁` for n > 9. The base must equal n + 1.
  - Decimal index: from 0 to count − 1.
  - Links: `(1: 0 1) (2: 2 0)`. Names are optional, but either all links are named `1..n` exactly once or none are.
- **Errors:** parsers return `{links}` or `{error}`. The error is a localisable message key (en/ru) that says why the input is invalid: a reference outside `0..n`, a wrong base, the wrong digit count, an index out of range, or a duplicate or missing name.
- **Editing helpers:**
  - `addLink` appends `[0, 0]`.
  - `removeLink(k)` drops link k. It sets references to k to 0, renumbers references above k, and returns the index map so per-link options can follow. It is a no-op when only one link remains.
  - `setReference` changes one end.
  - `step(links, ±1)` walks counting order across sizes. It starts at `00`, and after the last network of n links comes the first network of n + 1 links.
- **Renaming classes:**
  - `relabel(links, permutation)` keeps 0 as 0.
  - `canonical(links)` returns the smallest code over all renamings. It is practical up to n = 7.
  - `representatives(n, {real})` lists one network per class.
  - `classCount(n, {real})` counts classes by Burnside's lemma.
- **Gallery:**
  - Tabs for 1..4 links show their counts. Toggles select classes only and real-only.
  - A formula line reads "first ... last: base^(2n) = count".
  - Thumbnails are 64 px and are rendered in pages of 243 with a "show more" control.
  - Each thumbnail links to a host-supplied URL, for example `/network/?code=0120`. Theme-dependent extra parameters are allowed.
  - Counts use locale-aware plurals.

## Acceptance criteria

- [ ] `codeAt(2, 0)` is `00 00` and `codeAt(2, 80)` is `22 22`. `indexOf(decode('11 22 12'))` round-trips.
- [ ] For n = 12, `codeAt(12, '1' + '0'.repeat(20))` round-trips exactly through `indexOf`.
- [ ] `classCount` for n = 1..4 is `[4, 45, 720, 16900]`. With `{real: true}` it is `[1, 10, 129, 2836]`.
- [ ] The length of `representatives(n)` equals `classCount(n)` for n ≤ 4. All of n = 4 completes in under 1 s.
- [ ] `0120₃`, `0120_3`, `01 20`, `λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}` and `(1: 0 1) (2: 2 0)` all parse to `[[0,1],[2,0]]`.
- [ ] `0120₄` returns a base error. `(1: 0 3)` returns a reference error. `(1: 0 1) (3: 2 0)` returns a naming error.
- [ ] `step(decode('22 22'), 1)` is `00 00 00`, and stepping back returns `22 22`.
- [ ] `removeLink([[0,1],[2,0],[3,2]], 2)` gives `[[0,1],[2,0]]`. A single-link network is returned unchanged.
- [ ] The gallery shows 81 cards for 2 links, 45 with classes on and 10 with classes and real-only on.

## Consumer code that becomes deletable

| Path | Lines |
|---|---|
| `src/links/configurations.js` | 227 |
| `src/links/edit.js` | 249 |
| `src/components/NetworkGallery.jsx` | 149 |
