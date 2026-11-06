# Framework source snapshot

These eleven npm tarballs contain the unmodified distributable source of
[link-foundation/ui at 2efd7e23df9df5312cac6d45611aa67e10529715](https://github.com/link-foundation/ui/tree/2efd7e23df9df5312cac6d45611aa67e10529715).
Each retains its upstream `LICENSE`. The manifest records source permalinks and
SHA-256 digests; the lockfile additionally pins npm integrity hashes.

This is an immutable revision of upstream draft [PR 213](https://github.com/link-foundation/ui/pull/213),
not an upstream release. It supplies the select and normalization contracts
reported during this migration, allowing their consumer workarounds to be
removed. Upstream CI still has failures outside those adopted contracts;
the case study records them. This site's complete CI remains the integration
gate. The initial `f72e97f` snapshot is preserved in this branch's history.

The workspace packages are not published to npm. Keeping the actual archives
allows `npm ci` to work without an upstream monorepo checkout, install scripts,
Git dependency resolution, or a moving branch. Only packages required by the
current integration are included. Optional icon/worker build products are not
used. See upstream [publication report 209](https://github.com/link-foundation/ui/issues/209).

To reproduce, check out that exact source revision and run:

```sh
SOURCE=/path/to/ui node experiments/framework-migration/vendor.mjs
```

Replace these file dependencies with versioned npm dependencies once upstream
publishes externally installable packages. Do not edit the archives: the two
browser packaging workarounds live in `vite.config.js` and
`scripts/framework-assets.mjs`. This snapshot does not change the license of the
site or grant permission to copy site source into another repository.
