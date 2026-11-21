Release: first npm publication is still blocked on main after #209 closed

## Context

The consumer migration in konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) still installs eleven framework packages from vendored `npm pack` archives of `b4baef4d56eacc9c05d033e3e33a895e540b40ac`, because no `@link-foundation/ui-*` package exists on the registry. #209 closed with PR 218, which prepared and verified the release archives. PR 218 explicitly left one criterion unchecked: "Publish all runtime packages to npm and verify a consumer installed from registry archives". No open issue tracks that remaining criterion.

## Current state (checked 2026-11-09)

- `npm view @link-foundation/ui-settings version`, `@link-foundation/ui-core` and `@link-foundation/ui-sound` all return `E404`.
- The `release.yml` run on main [42325573807](https://github.com/link-foundation/ui/actions/runs/42325573807) (`b4baef4`) fails in Release Preflight. In `gh run view --log-failed` output (lines 146–169), the step reports that `NPM_TOKEN` is empty, and for every package the run reports "npm has no package … yet, and npm configures trusted publishing only for published packages. Add an NPM_TOKEN repository secret …".
- Every release run on main since PR 218 (42313474630, 42324606763, 42325573807) fails at this step.

## Required action (maintainer)

1. Add a granular `NPM_TOKEN` repository secret that may create the `@link-foundation/ui-*` packages, and authorize the initial 0.1.0 release.
2. After the first publish, configure a trusted publisher (`link-foundation/ui`, workflow `release.yml`) for each package, then delete the secret.

No code change can complete this, because it needs maintainer credentials.

## Acceptance criteria

- [ ] All runtime workspaces resolve with `npm view @link-foundation/<name> version`.
- [ ] `release.yml` on main passes Release Preflight and publishes with provenance.
- [ ] An external consumer installs from the registry with no file or Git dependencies and builds, as the PR 218 archive consumer does.

## Consumer code that becomes deletable

- `vendor/link-ui/*.tgz` (11 archives), `vendor/link-ui/manifest.json` and `experiments/framework-migration/vendor.mjs`. The `file:` dependencies in `package.json` become semver ranges.
