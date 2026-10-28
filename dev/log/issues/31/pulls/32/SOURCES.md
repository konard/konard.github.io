# Research and component decisions

Research date: 2026-10-28. The original issue, all comment types, historical run
logs, template revisions and source inventories are preserved alongside this file.

| Primary source | Finding and consequence |
| --- | --- |
| [Official artifact action](https://github.com/actions/upload-artifact) and [artifact SDK transport](https://github.com/actions/toolkit/blob/main/packages/artifact/src/internal/shared/artifact-twirp-client.ts) | The current action uses the artifact SDK. Its Twirp client has HTTP retries but throws recognized network errors immediately. The installed 6.3.1 source confirms ENOTFOUND takes that path. Add a bounded outer operation retry, rather than assuming internal HTTP retries cover DNS failures. |
| [Pages artifact format](https://github.com/actions/upload-pages-artifact) | Preserve the official artifact.tar layout, dereference links, omit Git metadata, retain .nojekyll and wrap the tar in the artifact ZIP. Test both tar content and the actual SDK ZIP stream. |
| [Runner commands and JavaScript action environment](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-javascript-action) | Run the uploader as a local JavaScript action so the runner supplies artifact runtime credentials. A shell retry command cannot assume that environment. No separately bundled copy of the SDK is needed after npm ci. |
| [nick-fields/retry](https://github.com/nick-fields/retry) | Existing general retry component takes shell commands, not a uses step. Broad retries also repeat permanent refusals. Retain the official SDK and classify transport errors in a small tested adapter. |
| [Vite CLI configuration loading](https://vite.dev/guide/cli) | Native config loading follows Node ESM resolution. Add explicit .js extensions throughout the imported settings-schema graph, rather than hiding warnings with a bundled loader. Native import is the regression check. |
| [ESLint configuration resolution](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-resolution) | File-relative discovery can select an archived template's configuration when lint-staged supplies explicit paths. Select the root ESLint configuration and root lint-staged package.json explicitly; behavioral tests exercise failing nested configurations. |
| [actionlint](https://github.com/rhysd/actionlint) | Keep the pinned Docker image with its bundled shellcheck. The sandbox daemon cannot start containers because its cgroup controller configuration is invalid; local verification extracted the exact image's binary and ran it with shellcheck on PATH. Hosted CI runs the actual image. |
| [zizmor usage](https://docs.zizmor.sh/usage/) | Use annotations, low-confidence auditing and a separate pedantic high-confidence image-pin pass. Scope the self-repository syntax exception to this workflow and record removal conditions. Offline local scans supplement the online hosted check. |
| [Ruff configuration](https://docs.astral.sh/ruff/configuration/) | Standalone Python experiments need syntax, unused-name/import lint and formatting. There is no Python package/type contract; package publishing, dependency-environment resolution and strict mypy of a nonexistent package do not apply. |
| [lychee](https://github.com/lycheeverse/lychee) | Use the existing link-checking component with finite retries, concurrency and cache. Scan maintained README links, not immutable historical snapshots containing intentionally obsolete external paths. Bot/login-only social endpoints have explicit exclusions. A Web Archive snapshot is not proof that a live URL works. |
| [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) and [required checks](https://docs.github.com/en/enterprise-cloud%40latest/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks) | Keep the workflow present on every PR, move optional work behind explicit change detection and use a terminal gate to reject missing/failed jobs. Serialize publishing separately from cancellable reads. |
| [CodeQL languages](https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/) | Check JavaScript, Python and Actions, excluding preserved evidence and generated output. This complements the committed-lock dependency audit. |
| [Archiver upstream glob update](https://github.com/actions/toolkit/pull/2460) | The current SDK's archiver-utils dependency still resolves deprecated glob 10. Use a narrow glob 14 override; a real SDK ZIP round-trip test protects compatibility. npm ci and npm audit must both be clean. |

## Failure classification

The original main run failed after successful browser assertions, at the evidence
upload (`ci-logs/github-pages-40662150605.log:1288`). The prepared branch's initial
run 40664909496 passed at the same application behavior, confirming an intermittent
transport failure rather than a repeatable browser defect. Neither result alone
verifies a fix: injected transport failures prove the retry path, and fresh hosted
uploads verify integration with the runner and Pages protocol.
The offline `issue-31-artifact-network-repro.mjs` also reproduces the exact
CreateArtifact error through the pinned SDK and verifies adapter recovery;
`artifact-sdk-network-repro.log` preserves the request counts and outcome.

The old deployment script accepted HTTP 200 for stale content and for HTML served
at a PDF URL. The reproducer failed before changes. The replacement checks a build
commit manifest, an actual JavaScript response and the PDF signature, and rejects
missing assets and stale commits. The new local HTTP-server tests exercise these
cases without depending on a live deployment or external DNS.

## Shared defects reported

- [JS template issue 264](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/264).
- [Python template issue 120](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/120).

Both reports include pinned source locations, the original failed run, the SDK's
network-error path and the distinction between transport failures and permanent
policy refusals. These are reports of the same defect, not required sub-issues;
this PR fixes the website without waiting for upstream changes.
