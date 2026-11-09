# Framework source snapshot

These eleven npm tarballs contain the unmodified distributable source of
[link-foundation/ui](https://github.com/link-foundation/ui) at one immutable revision,
`b4baef4d56eacc9c05d033e3e33a895e540b40ac` (upstream `main` on 2026-11-07).
Each retains its upstream `LICENSE`. The manifest records source permalinks and
SHA-256 digests; the lockfile additionally pins npm integrity hashes.

This snapshot contains every fix merged for this migration:
[PR 213](https://github.com/link-foundation/ui/pull/213) (select, continuous typed
normalization, directional stepping),
[PR 214](https://github.com/link-foundation/ui/pull/214) (external browser consumers),
[PR 216](https://github.com/link-foundation/ui/pull/216) (optional WASM kept out of DOM builds),
[PR 217](https://github.com/link-foundation/ui/pull/217) (network providers, optical frames) and
[PR 218](https://github.com/link-foundation/ui/pull/218) (release preparation). It is not a release.
The case study distinguishes historical failures from later upstream fixes. This site's
complete CI remains the integration gate. Earlier `f72e97f`, `2efd7e2`, `4564597`,
`27d580f`/`e37935e` snapshots remain in history.

The workspace packages are not published to npm. Keeping the actual archives
allows `npm ci` to work without an upstream monorepo checkout, install scripts,
Git dependency resolution, or a moving branch. Only packages required by the
current integration are included. Optional icon/worker build products are not
used. See upstream [publication report 209](https://github.com/link-foundation/ui/issues/209).

To reproduce, check out that exact revision and run:

```sh
SOURCE=/path/to/link-foundation-ui node experiments/framework-migration/vendor.mjs
```

Replace these file dependencies with versioned npm dependencies once upstream
publishes externally installable packages. Do not edit the archives. The
converter alias and asset-reference transform have been deleted after adopting
the upstream browser fixes. This snapshot does not change the license of the
site or grant permission to copy site source into another repository.
