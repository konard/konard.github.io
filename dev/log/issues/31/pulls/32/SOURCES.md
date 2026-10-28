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
| [CodeQL incremental analysis](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/scan-from-the-command-line/incremental-analysis), [action feature](https://github.com/github/codeql-action/blob/9b3254085494b55a0f7c4c2b3d2d52cc712ce370/src/feature-flags.ts#L243) and [diff limit](https://github.com/github/codeql-action/blob/9b3254085494b55a0f7c4c2b3d2d52cc712ce370/src/diff-informed-analysis-utils.ts#L157) | GitHub's compare API truncates at 300 changed files; requested evidence crossed that boundary. Select full analysis with CODEQL_ACTION_DIFF_INFORMED_QUERIES=false for all three languages. This broadens query scope rather than filtering warnings or dropping evidence; the upstream test explicitly verifies the flag. Both templates use the same default v4 configuration. |
| [Archiver upstream glob update](https://github.com/actions/toolkit/pull/2460) | The current SDK's archiver-utils dependency still resolves deprecated glob 10. Use a narrow glob 14 override; a real SDK ZIP round-trip test protects compatibility. npm ci and npm audit must both be clean. |
| [npm script reviews](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/) and [fsevents 2.3.3 source manifest](https://github.com/fsevents/fsevents/blob/v2.3.3/package.json) | macOS npm 11.19 warns for a lockfile-marked install script. Registry metadata advertises node-gyp rebuild while the integrity-matching published package ships a prebuilt binary. Review both manifests and record only fsevents@2.3.3 in allowScripts; an offline macOS-targeted npm install demonstrates the warning before review and its absence afterward. The regression checks all locked platforms, even on Linux. |

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
- [JS template issue 265](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/265) and [Python template issue 121](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/121) report the separate CodeQL compare-API limit, with exact source/configuration and hosted warning evidence.

Both reports include pinned source locations, the original failed run, the SDK's
network-error path and the distinction between transport failures and permanent
policy refusals. These are reports of the same defect, not required sub-issues;
this PR fixes the website without waiting for upstream changes.

## Security parser and encoding components

- [parse5 fragment parser](https://parse5.js.org/functions/parse5.parseFragment.html) and [source locations](https://parse5.js.org/interfaces/parse5.ParserOptions.html): use HTML5 tokenization and tree construction for source extraction and text conversion. parse5 8.0.1 was already locked via jsdom; declare it directly instead of relying on transitive availability. It is a parser, so the archive still rebuilds only its explicit formatting allowlist and HTTP(S) href attributes. No page scripts execute.
- [CodeQL inefficient-regex guidance](https://codeql.github.com/codeql-query-help/javascript/js-redos/): ambiguous repetition causes exponential backtracking. Replacing the math separator regex with a linear split/trim check preserves syntax; replacing HTML recognition with a parser handles quoting and malformed markup together. Native RE2 or disabling the query would add compatibility constraints or conceal the problem.
- [CodeQL script-construction guidance](https://codeql.github.com/codeql-query-help/javascript/js-bad-code-sanitization/): JSON.stringify alone does not protect an HTML script boundary. The shared encoder replaces HTML-significant characters and Unicode line separators after JSON quoting; tests verify exact JSON round trips and actual HTML parsing. The settings rules are trusted repository data, while the delayed-CSS experiment reads a fetched href; the same robust encoding handles both contexts.
- [ECMAScript RegExp.escape](https://tc39.es/ecma262/multipage/text-processing.html#sec-regexp.escape): use the runtime's literal-pattern encoder in dynamic page-label tests instead of maintaining a partial custom escape regex.
- [DOMPurify](https://github.com/cure53/DOMPurify) and [sanitize-html](https://github.com/apostrophecms/sanitize-html) are existing sanitizer alternatives. The archive also needs original-source element boundaries and plain text with specific line-break/shortened-link behavior, so parse5 plus the existing narrow formatting policy avoids a second HTML parser or DOM implementation. The real archived corpus and malicious markup fixtures verify that policy.

## CodeQL outcome contract

- [Pinned analyze-action output and upload contract](https://github.com/github/codeql-action/blob/9b3254085494b55a0f7c4c2b3d2d52cc712ce370/analyze/action.yml): preserve analysis/upload, then inspect the resulting SARIF rather than assuming successful execution means no findings.
- [JavaScript template report 266](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/266) and [Python template report 122](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/122): both terminal gates inspect job outcomes and inherit the same false-green possibility. The actual ten-finding website report and a clean Python report verify the proposed result gate. Duplicate searches, recent related merged PRs, pinned template coverage and complete issue bodies are archived here.
