# Issue 33: current, attributable public-work indicators

Issue: https://github.com/konard/konard.github.io/issues/33

Implementation: https://github.com/konard/konard.github.io/pull/34

## Problem and root cause

The site reported languages by GitHub bytes/repository count and contributions by year. Neither measures source lines or individual authorship. The blog initially showed saved HTML and offered the original X widget only after a click. Different indicators came from October 16–27 snapshots without a shared explanation of their effective dates. This was missing functionality rather than a faulty existing LOC algorithm.

The initial three regression tests failed on the original implementation: no daily calendar/personal source total, no per-language repository lines, and archive-first messages. The captured failure output is in `red-tests.log`; `screenshots/before-*.png` records the original UI. Historical case studies remain intact; this issue has its own refreshed evidence.

## Complete requirement inventory and implementation plan

| Requirement from the issue | Options considered | Selected implementation and verification |
| --- | --- | --- |
| Show lines in every repository, per language | GitHub language bytes; download default-branch archive and run cloc; clone full history | Pinned cloc 2.10 at a recorded public SHA, language code/comment/blank counts and expandable repository UI. Git history also supports the next requirement. Production-data coverage checks ensure every displayed repository has a measurement. |
| Show personal open-source lines per language and total, including non-owned projects | Sum commit additions; git-fame; git-blame of current files | GitHub-verified author identities, surviving nonblank source lines, global original-commit/path/line deduplication. Discover historical public contribution repositories and all public PR repositories, not only owned projects. Show language totals, overall total and public repository/SHA evidence. Local Git fixtures verify authorship and mirror deduplication. |
| Exclude private repositories, explain wider closed-source experience and link CV | Authenticated full-account export; public-only allowlist | Re-check public visibility before each clone. Persist counts and public SHAs, not emails, tokens or private repository names. Display public-only scope and the explicit CV explanation. A mocked private repository is rejected before clone. |
| Same iconic GitHub contributions matrix, including private activity | Annual chart only; react-github-calendar; first-party public-profile snapshot plus validated public CORS refresh | Keep the annual chart and add an accessible Sunday-first grid using GitHub daily contribution levels and green light/dark palettes. The calendar includes the profile's shared anonymized private totals. Source measurements never use private code. Preserve the actual public graph; compare both first-party sources with the public service and reject a refresh that disagrees on completed historical days. Test daily levels, dates, weeks and fallback. |
| Exact discipline slogan with habit explanation, conditional on active work | Permanent text; time since any activity; uninterrupted recent habit | Require activity on each of the previous 30 completed UTC days and evidence no older than 48 hours. Today is still in progress. Hide after a missed day, missing data or stale evidence, including long-lived tabs. This is a measurable activity condition, not a claim to determine whether someone is alive. Tests cover fresh/missed/stale/future/incomplete data and successful live refresh timing. |
| Live data where possible, effective dates with (*) otherwise | Expose GitHub credentials in the browser; third-party counters without validation; dated snapshots | Validate a complete live public calendar before replacing the first-party fallback. Keep the existing live Habr refresh. Use dated snapshots for expensive source/history scans, registry/community/profile counts and archive fallback. Add (*) links, a notice on every page and a footer source/date table. Never ship an API credential. |
| Update dependencies and applicable associative stack | Keep older versions because they were tested; add every ecosystem package regardless of use; update actual dependencies and curated catalog | Upgrade all outdated direct npm dependencies, refresh lockfile and check `npm outdated` plus audit. Update pinned Ruff, zizmor, zizmor-action and the cache action against their latest stable releases; retain already-current ShellCheck, actionlint and action major versions. Preserve the macOS WebKit renderer used by existing CI. Add the newly collected `link-assistant/law` project to the associative applications layer. The site is a static React application; Formal AI's Rust, database and agent dependencies are not runtime requirements here. |
| All website data current | Update only the new indicators; rebuild all dynamic-source snapshots | Refresh public profile, organizations, repositories/languages/stars, repository health, all existing registry collectors, Stack Overflow, Habr and social archive. Rebuild generated data from issue 33. Manually maintained CV events remain event records; career durations remain calculated today. Retain past case-study snapshots for reproducibility. |
| Prefer social-network embeds over historical extracts | Archive first; remove archives; provider widgets with fallback | X embeds first, matching the resolved theme, lazy loaded. Public Telegram embeds and VK widgets with a provider-issued export hash are supported. Original public links and dated, readable archives remain available even if a cross-origin provider is blocked or deleted. Network-error fallback/retry, unsupported IDs and the existing multilingual/cross-post deduplication have tests. |
| Audit all personal/organization repositories against Formal AI's guide; report omissions | Assume all associative-looking repositories belong in the guide; audit actual integrations and wider candidates | `associative-audit.json` inventories every collected repository against the guide and labels candidates for review. Compare the guide to current `rust/Cargo.toml`, `package.json` and actual integration source. Report the three demonstrated runtime omissions and list additional candidates without presenting them as integrated dependencies. |
| Deep case study, preserved data, online facts, libraries and plans, one PR | Narrative only; preserve reproducible evidence and implementation | This document, raw public snapshots, collector scripts, regression tests, before/after browser captures, and a final validation report in the same PR. Keep issue-closing language in the PR and leave the upstream documentation report open for its maintainers. |

Execution order: preserve requirements and baseline → research and audit → independent public-data collection → repository/history measurement → UI and focused regression tests → rebuild all generated data → full checks/build/browser evidence → review PR/CI at its final commit → mark ready.

## Measurement method and limits

### Repository source lines

`experiments/collect-source-lines.py` visits public default branches sequentially. It keeps complete, single-branch, tag-free commit history; a shallow clone would incorrectly attribute boundary commits. Histories over 100,000 KiB use partial clones to fetch blobs on demand, while ordinary repositories use full clones to avoid many small network requests during blame. cloc's tracked-file list excludes untracked dependencies. The directory exclusion list is `node_modules,vendor,third_party,third-party,dist,build,target,.git,packages_cache`. Each repository retains the measured commit SHA, collection time and each detected language's `code`, `comment` and `blank` counts. The displayed repository total is the sum of **code** lines; expanding it shows the other counts separately. An unavailable measurement is never silently displayed as zero.

Whole-repository language counts are collected for the existing project catalog. Outside repositories and additional public forks supply personal attribution: only possible authored paths need to be materialized there. `sourceLinesScope` distinguishes whole-repository counts from this internal candidate subset; the latter is never presented as a repository's complete size. Before cloning outside projects, an account-filtered public default-branch history query can establish that the recorded SHA has no commits mapped to the GitHub user. This yields a checked zero attribution without downloading unrelated upstream code. Identical already-measured public revisions can reuse whole-repository counts, while granting no duplicate personal credit. Fixtures verify both shortcuts.

GitHub's repository size is expressed in KiB and can be zero for a nonempty tree. Empty measurements therefore require an absent public HEAD verified with `git ls-remote`; a zero size alone cannot suppress the checkout or its source lines. A one-line local Git fixture reproduces that mistake, and legacy size-only empty checkpoints are re-measured before the census is finalized.

Repository totals describe the whole public repository, including other people's work. They must not be added together and called personal authorship.

### Personal source lines

Personal totals use `git blame --line-porcelain` for the current tracked programming/markup source files. A tree-only name/status history pass restricts blame to paths touched by a verified identity. When a candidate is deleted in a commit that adds paths, all those additions become candidates, transitively across moves; this conservative filter can add work but cannot manufacture attribution. The local fixture covers moves by another author and rejects unrelated additions. Historical author names/emails resembling the profile's known names are resolved against GitHub's commit-to-account mapping; merely choosing the same display name does not grant credit. The identity cache stays outside the repository. Documentation and data languages are excluded from personal totals: Markdown, JSON, YAML, Text, CSV, XML, SVG, TOML, INI, reStructuredText and Jupyter Notebook; saved diff/patch text is also excluded. Patches remain visible in whole-repository language counts, but storing a patch must not grant a second copy of its source as personal programming work. Comments in source files count, blank lines do not. The UI states this distinction explicitly.

The result is **surviving source attributed by Git**, including tool-assisted work committed under the verified account. It is not an assertion of manual typing, all historical additions, deleted work or a division of coauthored effort. GitHub language bytes are neither lines nor authorship. Summing historical additions instead would repeatedly count rewrites, format changes, copied/generated content and deleted code. Current-line attribution is conservative and inspectable at public SHAs.

A disk-backed set deduplicates the tuple `(original commit, original path, original line)` across mirrored history. The same original line appearing in an upstream and a mirror gets one unit of personal credit. Independent new commits with identical text remain independent history; content deduplication would incorrectly collapse common statements and license headers. The total and language table are built from the same per-repository results, with a consistency test.

Discovery combines all public repositories (including forks) of the personal account, the site's established organization catalog and every public organization membership, recursively split historical contribution collections below GitHub's 100-repository calendar cap, paginated recent public contributed repositories, and paginated PR history. The public-membership REST endpoint is used rather than an authenticated list that could include hidden memberships. Generated temporary log repositories remain in the ecosystem audit but are excluded from source indicators under the existing noise policy. GitHub may make deleted/inaccessible PR nodes unavailable; no private record is persisted and inaccessible history cannot be cloned. Proposed PR contributions are measured only if their surviving lines appear on the repository's current default branch. The method does not claim all branches or inaccessible/deleted history.

Memory-heavy work is sequential. Clone, cloc and blame subprocesses have finite memory and stack limits; the deduplication index is stored on disk. Each completed measurement and its line identities commit in one SQLite transaction before the JSON checkpoint is written. If that write is interrupted, the next run restores the committed measurement instead of losing its credit to the already-populated deduplication index. A real local-repository interruption fixture reproduces the former zero-count result and verifies recovery. Failures are recorded explicitly and retried before finalizing coverage. Detailed diagnostics are opt-in, and authenticated API exceptions are sanitized to avoid leaking private repository names through logs.

The refreshed catalog also exposed `konard/public-logs`: its public tree contains 117,743,125,559 bytes of generated log text/chunks and no programming-language files. Downloading the compressed Git data would expand to more than this workspace's free disk. The scan was stopped before checkout. The existing generated-log exclusion now explicitly covers this shared log archive, with a focused failing/passing classification regression. This is a source-data exclusion, not an inaccessible software project: its tree/SHA/extension evidence is preserved in `generated-log-archive.json`, and the complete associative audit still includes the repository.

The initial bounded scan exposed cloc's large-JSON regular-expression memory cost and Git's pack-mapping/index-thread limits. JSON files over 1 MiB use a 64 KiB streaming physical-line counter matching cloc 2.10's JSON rule (JSON has no comments); they remain in repository totals and are not silently dropped. A fixture checks the streaming result together with cloc's ordinary code/comment/blank output. Git pack windows and worker counts are bounded, index preloading and automatic maintenance are disabled during temporary clones, and partial-clone blobs are fetched in batches for current candidate files and their history. A 2,500-file, 128 MiB fixture reproduces the original threaded-lstat error and verifies the configured checkout. Local partial-clone fixtures verify that unrelated source blobs, binary assets and excluded prose/data remain unfetched. All processes retain finite memory and stack limits.

### Daily contributions and privacy

The profile REST response is collected anonymously with an explicit public-field allowlist. An authenticated self-profile response includes private account settings even at the `/users/konard` URL; the collector rejects its private view instead of publishing it. The failing/passing profile privacy regression covers this distinction, request headers and unknown-field filtering. Repository discovery uses only public organization memberships and checks repository visibility separately.

The website fallback is the actual anonymous GitHub profile graph: all 368 dates, tooltip counts and `data-level` values captured in the real browser, with a sum checked against GitHub’s heading. The separate first-party GraphQL research snapshot preserves daily counts/levels and `restrictedContributionsCount`. The public profile, GraphQL response and public CORS service were not identical: 325 of 367 completed days differed between the service and GraphQL, and 306 differed between the service and the freshly captured public profile. Counts can be rebuilt and the service documents a one-hour cache; this investigation does not establish a single cause for every difference. All three datasets and the comparison are preserved. Do not claim they were equal. The anonymous daily/private aggregate is an exception to the code inventory's public-only scope, as explicitly requested. No private repository, language, issue, commit or code record is part of the calendar dataset.

The live public calendar response is accepted only if it contains a full consecutive daily window ending today, unique real dates, nonnegative safe integer counts and levels 0–4, and agrees with the first-party snapshot on at least 300 overlapping completed days (today may increase). A disagreeing mirror must not silently replace the exact first-party graph. Today’s count may increase but cannot decrease; after midnight the snapshot’s former last day is checked as completed history too. At collection time the real public service disagreed, so the dated GitHub-profile fallback is used. This intentionally prioritizes a reproducible first-party graph over an unverified claim of live accuracy; future compatible responses can refresh it. An error, partial response, stale calendar or invalid count leaves the dated fallback in place. A public CORS service avoids exposing GitHub credentials in a static website. It adds an availability/trust dependency, so it is not used for repository visibility or code measurement. Its public response was checked in the browser against both first-party sources. The disagreement regression verifies that the saved profile graph remains unchanged; ongoing work can independently increase today's count between requests.

The 30-day and 48-hour discipline thresholds are explicit implementation choices for the issue's otherwise unquantified “alive or actively working” condition. A missed day hides the slogan immediately after current data arrives; if refresh is unavailable the slogan expires with the snapshot. No external service can infer life status from a GitHub graph.

### Social embeds and archive fallback

X's original public-message iframe is tried first. Its cross-origin document cannot reliably be inspected by the host page to distinguish a deleted post from a provider error page. Therefore an archive disclosure and explicit “Show archived copy” control are always available, in addition to network-error fallback and retry. Lazy loading avoids loading the entire feed of third-party frames immediately. No access token is passed to frames.

VK post widgets need an export/security hash in addition to the wall/post IDs. The collected public crawler markup contains post content but no usable widget hash; an anonymous widget request redirected to the VK login/mobile application instead of returning a post. These records therefore show the dated archive and original link, rather than a known-invalid iframe. The implementation accepts a public export hash when provided and validates both it and the IDs. Telegram's configured address is a personal account without a public channel, so the collector correctly discovers no public Telegram messages. The component supports public channel message IDs if that changes.

The original archive remains useful for inaccessible/deleted posts and offline review. Four new public VK messages/images were collected. Existing archive images and multilingual deduplication were retained.

Habr's article and profile endpoints can succeed independently. A partial refresh previously labeled unchanged snapshot figures as live. The new regression covers missing profile data, missing articles and an empty refresh; partial results retain the dated snapshot explanation, and only a complete refresh receives the live label.

## Online research and existing components

Primary sources consulted on 2026-10-28:

- [GitHub GraphQL user/contribution objects](https://docs.github.com/en/graphql/reference/objects): daily levels/counts and shared restricted contribution totals. Historical contribution collections have a per-repository limit, requiring split discovery instead of one capped yearly request.
- [cloc](https://github.com/AlDanial/cloc), version 2.10: language-aware code/comment/blank counting. Chosen over converting GitHub bytes to lines. The collector uses the pinned release script; its checksum and retrieval command are recorded in `VALIDATION.md`.
- [git-fame](https://github.com/casperdcl/git-fame): an existing blame-based attribution alternative. A narrow collector was selected to combine public-visibility guards, language-aware counting, explicit global deduplication, checkpointing and this site's existing snapshots without adding a website runtime dependency.
- [tokei](https://github.com/XAMPPRocky/tokei): an alternative fast language counter. cloc's by-file report plus readily available pinned Perl implementation fits this environment and exposes code/comments/blanks directly.
- [react-github-calendar](https://github.com/grubersjoe/react-github-calendar) and its [public calendar API](https://github.com/grubersjoe/github-contributions-api): existing calendar components/data service. The service is used with strict validation. A small SVG was chosen to retain the existing chart styles, bilingual labels, theme controls, horizontal keyboard scrolling, detailed day titles and accessible table without another rendering dependency.
- [X's embedded feed documentation](https://help.x.com/en/using-x/embed-x-feed): provider-hosted content instead of assuming saved text remains current. Existing per-message IDs are retained because anonymous timeline discovery is limited.
- [Telegram post widget](https://core.telegram.org/widgets/post): public-channel message embedding; a personal account link is not a channel feed.
- [VK post widget documentation](https://dev.vk.com/widgets/post) and [AMP's VK component](https://amp.dev/documentation/components/amp-vk): a post widget's owner/post IDs and security hash. The latter is also an existing component implementation confirming the hash requirement.
- [Formal AI associative stack](https://github.com/link-assistant/formal-ai/blob/main/docs/associative-tech-stack.md), current manifests and integration source: audited against the collected public catalog. Exact guide and manifest snapshots are preserved under `data/`.

The public calendar service was successfully exercised through the real browser. A direct CLI request intermittently returned “GitHub: Bad gateway.” This is why the UI validates responses and keeps a visible dated first-party fallback. No availability claim depends on a single successful external request.

## Associative ecosystem audit

`experiments/audit-associative-stack.cjs` compares the full public personal/organization inventory in `public-inventory.json`, including forks and temporary repositories, with the guide. It preserves every repository, whether it is an associative candidate under the site's existing field classifier, whether it is a generated temporary repository, and whether its full name or package name is explicitly mentioned. Candidate classification is deliberately broad and is not itself evidence of a documentation defect. The exact final coverage counts are recorded in `VALIDATION.md`.

The concrete omission is stronger: Formal AI's current manifests already depend on `command-stream`, `web-capture`, Rust `web-search`, and `@link-assistant/web-search`; its JavaScript search entry imports and invokes the package. The guide describes adjacent associative libraries but omits those actual integrations. The evidence, manifest versions and suggested placement were reported in [formal-ai#1455](https://github.com/link-assistant/formal-ai/issues/1455). The complete report text is preserved in `formal-ai-report.md`. Additional ecosystem candidates are listed separately and are not represented as already integrated.

## Reproduction and refresh

Run from the repository root with Node 24+, Python, Perl, Git and an authenticated GitHub CLI. Authentication is used only by collectors; never expose tokens to the website or commit them.

```sh
npm ci
node experiments/collect-public-profile.mjs
node experiments/collect-repositories.cjs docs/case-studies/issue-33/data
node experiments/collect-organizations.cjs docs/case-studies/issue-33/data
node experiments/collect-repository-health.cjs docs/case-studies/issue-33/data/repository-health.json --verbose
node experiments/collect-indicators.cjs
node experiments/collect-public-calendar.mjs
node experiments/collect-stackoverflow.mjs
node experiments/collect-public-inventory.cjs
python experiments/collect-source-lines.py --cloc /path/to/cloc-2.10.pl --fresh
python experiments/verify-source-checkpoint.py
node experiments/audit-associative-stack.cjs
npm run build:data
npm run check
npm run test:ci
CLOC_PATH=/path/to/cloc-2.10.pl python experiments/test_source_lines.py
npm run build
npm run test:indicators:browser
```

Use `--fresh` for a new checkout without the matching private attribution cache; omit it to resume an interrupted census with that cache intact. The verification command runs after collection finishes and publishes only aggregate checks against the durable database.

The existing Habr, registry and archive collectors also produce the snapshots in `data/`; their exact commands and outcome are recorded in `VALIDATION.md`. Historical evidence directories are not overwritten by the final refresh. The screenshots are generated by `experiments/issue-33-browser.mjs`; the pre-fix capture used `--before` before the implementation. The final browser test exercises the committed fallback deterministically and separately verifies live replacement/failure behavior without relying on an external provider being available in CI.

See `VALIDATION.md` for the final coverage counts, test/build outcomes, CI commit/run evidence and review screenshots.
