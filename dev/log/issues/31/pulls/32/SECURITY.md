# Full-scan security findings

Run 40675994571 at dfb1f91 completed its workflow successfully, but the separate
GitHub Advanced Security CodeQL check 122774900583 failed. Its three annotations
covered changed lines; the complete PR-merge alert API returned ten open findings.
`security-alerts-before.json`, `security-annotations-before.json` and
`checkruns-before-security-review.json` preserve that distinction. A successful
workflow is not sufficient evidence of a successful security check.

All ten alerts are addressed in code, with all default queries retained. No
findings are dismissed, no maintained source is excluded, and full scans remain
enabled for JavaScript, Python and Actions.

| Alert | Original location | Classification and implementation | Verification |
| --- | --- | --- | --- |
| 1, js/redos | experiments/archive-posts.cjs:167 | Confirmed exponential HTML-tag regex. Replace regex HTML recognition with parse5, already installed through jsdom and now declared as a direct exact-version development dependency. Iterative traversal preserves formatting and drops active content. | The original implementation exceeds the bounded child-process deadline on a finite 206-character input; the replacement completes. Formatting, links, emoji, malformed tags and all 63 archived posts are covered. |
| 2, js/redos | src/links/edit.js:169 | Confirmed exponential separator regex reachable from the network editor. Validate the already extracted pair separators using split and trim, preserving the existing notation grammar. | The original implementation exceeds the bounded deadline on 287 characters; the fix rejects it promptly. All supported separators and invalid boundary/extra punctuation cases are tested. Existing notation round trips remain enabled. |
| 3, js/incomplete-multi-character-sanitization | experiments/archive-posts.cjs:297–302 | Incomplete regex tag stripping; its callers use plain text, so the alert alone does not demonstrate website HTML execution. Read text from parsed HTML nodes instead, preserving encoded literal markup, line breaks and expanded shortened links. | A dangling `<script` survives the original stripper and is handled by the parser. Encoded literal script markup remains plain text. Corpus comparison verifies content preservation. |
| 4 and 5, js/incomplete-sanitization | experiments/collect-registries.cjs:275 and :292 | Both metadata URL builders replace only the first slash and leave URL metacharacters untouched. Use one shared npmMetadataUrl helper with encodeURIComponent for the complete package-name component. | Scoped/unscoped names, multiple slashes, query/fragment punctuation and existing percent escapes round-trip as exactly one component without changing origin. |
| 6, js/incomplete-sanitization | src/pages/pages.test.jsx:115 | Test assertion escaping only slash/dot is incomplete for arbitrary labels; no production injection sink. Use the native RegExp.escape in both dynamic label assertions and the preset-label assertion in presets.test.jsx. | Existing position and layer assertions pass for every actual label; the hosted runtime is Node 24, which supports RegExp.escape. |
| 7, js/bad-code-sanitization | experiments/rain-scale.mjs:42 | JSON quoting does not prevent an HTML script end tag in the delayed stylesheet href. Share a context-specific inlineJSON helper; retain the original delayed-CSS race reproduction. | The original output parses as two script elements. The fix yields exactly one and recreates the complete href through its scheduled callback after 300 ms. |
| 8, js/bad-code-sanitization | vite.config.js:25 | The same embedded-JSON encoding gap, currently fed by trusted repository settings rules. Use the same inlineJSON helper rather than suppressing the alert. | Script end tags, quotes, backslashes, line breaks, ampersands and Unicode separators round-trip as data; settings-before-first-paint tests continue to pass. |
| 9 and 10, js/incomplete-hostname-regexp | experiments/issue-19-browser.mjs:137 and issue-21-browser.mjs:46 | Unescaped hostname dots match unintended hosts. Both browser suites now use one strict extraction helper with escaped dots and Markdown boundaries. | The two expected URLs are retained, near-miss and suffix hosts are rejected, and both original browser suites remain in every engine's CI command list. |

## Reproductions and compatibility

`security-regressions-before.log` records 20 initial tests: nine failures and
eleven passes. Both adversarial cases run in disposable Node processes with
128 MiB V8 heap, a 512 KiB stack, finite inputs, a 64 KiB output cap and a
two-second deadline. The deadline kills a stalled child and does not leave a
background process consuming memory. The script is retained as
experiments/issue-31-security-probe.mjs.

`security-regressions-after.log` records the first passing focused run: 192 tests
across security, settings, math/placement and page suites. The subsequent full
suite also covers a corpus-wide idempotence/content-preservation regression.

`security-html-compatibility-initial.json` retains the first comparison against
dfb1f91: two of 63 posts contain literal NULs that HTML5 parsing ignores, as
browsers already do. `security-html-compatibility.json` explicitly identifies
those two normalizations and verifies no other text change. Source archive JSON
and media files are unchanged. This is a parser/tooling correction, not a visual
redesign. The comparison experiment runs offline with a 128 MiB V8 heap.

The final hosted review must inspect every exact-head check, including the
Advanced Security check, plus every raw platform log and the complete open-alert
list for refs/pull/32/merge. Merely observing a green workflow is insufficient.

## Workflow result gate

The analyze action uploads security results but can complete successfully while
GitHub's separate CodeQL check fails. The aggregate workflow previously inspected
only job outcomes, producing a false green. Every language job now writes SARIF
to an explicit directory and runs scripts/check-codeql-results.mjs after analysis.
This rejects findings of every severity, missing/invalid reports and failed tool
invocations. It retains the upload, separate check, complete scan and all queries.

security-gate-before.log reproduces the missing workflow gate. The real downloaded
ten-finding JavaScript report fails the new command; the actual clean Python
report passes. Both command outputs are preserved in security-gate-real-*.log.
The parser's 12 tests cover every run/report, suppressed findings, malformed or
missing results, tool failure and the actual CLI exit code. The combined focused
run passes 49 tests; unit-security-final.log passes all 833 tests in 55 suites.
A fresh npm ci has no warnings or vulnerabilities. No data/media changed.

The same aggregate-gate limitation was verified in both pinned templates and
reported as JavaScript issue 266 and Python issue 122. Their current scans are
not claimed to contain findings; the shared defect is the outcome contract.

## Hosted security verification

At head 67ca6ef0cda668aea13cb1460b4bc7c56ec904e8, run 40681082933
passes all three full language analyses and their new report gates. The separate
Advanced Security CodeQL check 122792092688 succeeds with zero annotations.
The complete paginated open-alert API for refs/pull/32/merge returns zero alerts
(security-alerts-after.json). Analysis IDs 2044460113 (JavaScript), 2044456719
(Python) and 2044456506 (Actions) each report zero results and no extraction error;
all use the current PR merge SHA ecc981c9125fcdd755e8ca1386265874a36bee3a.
Each raw language job log is preserved in ci-logs/security-fixed-*-40681082933.log.
JavaScript's gate reports no findings at line 2947, Python at 1889 and Actions at
1721. These prove the ten fixes without query exclusions or alert dismissals.
