# Framework source snapshot

These eleven npm tarballs contain the unmodified distributable source of
[link-foundation/ui](https://github.com/link-foundation/ui) at two immutable revisions:
`27d580f4bac4ebb4e70de3f78671153c2ef5dab9` for eight control/settings packages,
and `e37935ea195fca55cb2ee6a5d2c1723858cd7f81` for ui-i18n, ui-convert and
ui-devmode browser packaging.
Each retains its upstream `LICENSE`. The manifest records source permalinks and
SHA-256 digests; the lockfile additionally pins npm integrity hashes.

These are unmodified packages from upstream draft
[PR 213](https://github.com/link-foundation/ui/pull/213) and
[PR 214](https://github.com/link-foundation/ui/pull/214), not releases. They supply
select, continuous typed normalization, directional stepping and browser contracts reported
during this migration. The case study distinguishes historical failures from
later upstream fixes. This site's complete CI remains the integration gate.
The initial `f72e97f` and intermediate `2efd7e2` and `4564597` snapshots remain in history.

The workspace packages are not published to npm. Keeping the actual archives
allows `npm ci` to work without an upstream monorepo checkout, install scripts,
Git dependency resolution, or a moving branch. Only packages required by the
current integration are included. Optional icon/worker build products are not
used. See upstream [publication report 209](https://github.com/link-foundation/ui/issues/209).

To reproduce, check out those exact revisions in separate source directories:

```sh
SOURCE=/path/to/controls BROWSER_SOURCE=/path/to/browser-fixes node experiments/framework-migration/vendor.mjs
```

Replace these file dependencies with versioned npm dependencies once upstream
publishes externally installable packages. Do not edit the archives. The
converter alias and asset-reference transform have been deleted after adopting
the upstream browser fixes. This snapshot does not change the license of the
site or grant permission to copy site source into another repository.
