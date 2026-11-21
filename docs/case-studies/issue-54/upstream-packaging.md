External migration cannot install versioned workspace packages

Observed in link-foundation/ui at f72e97fe2db100d88ea460ee8451bbf63a1b01b6 during konard/konard.github.io#54.

Reproduction outside the monorepo:

```
npm view @link-foundation/ui-settings version
# E404 Not Found
```

The root package is private. Every workspace advertises version 0.0.0 and depends on siblings through ^0.0.0. Installing a Git dependency at the monorepo root does not supply the individually exported packages. Also ui-components' prepack depends on root build scripts and dependencies; bypassing it leaves optional generated icon/network-worker assets absent.

Please publish all runtime workspaces with coherent versions and test an external Vite/React application installed from the published archives. Include generated assets and LICENSE files; avoid requiring a monorepo checkout or devDependencies at consumer runtime.

Current migration workaround: npm-pack the distributable sources at one immutable revision, commit the archives, manifest SHA256 values and reproduction script, and explicitly supply every sibling as a file dependency. The adapter uses synchronous network rendering so it does not depend on missing worker assets. No site code is copied or relicensed into the framework.

Related: #66. Consumer implementation and evidence: https://github.com/konard/konard.github.io/pull/55
