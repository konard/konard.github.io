The network notations in `@link-foundation/ui-components@0.1.1` cover the core enumeration and editor operations from #229 and #230. A few inputs accepted by consumers of Links Notation, and by the established network editor, still fail. One malformed nested record is accepted.

## Reproduce

Call the functions from `@link-foundation/ui-components/links-view/configurations` with the following strings. Every valid string below represents `[[0,1],[2,0]]`.

| Function      | Input                                             | Actual                                           |
| ------------- | ------------------------------------------------- | ------------------------------------------------ |
| `parseLinks`  | `((1: 0 1))`                                      | Accepts one link. The nested record should fail. |
| `parseLinks`  | `(1: 0, 1) (2: 2, 0)`                             | `configurations.reference`                       |
| `parseLinks`  | `1:\n  0\n  1\n2:\n  2\n  0\n` (real line breaks) | `configurations.reference`                       |
| `parseNumber` | `0120`                                            | `configurations.base`                            |
| `parseNumber` | `[0, 1, 2, 0]_3`                                  | `configurations.syntax`                          |
| `parseTheory` | `N² = {1 ↦ (0, 1), 2 ↦ (2, 0)}`                   | `configurations.syntax`                          |
| `parseTheory` | `1 -> (0 1), 2 -> (2 0)`                          | `configurations.syntax`                          |
| `parseTheory` | `{(0, 1), (2, 0)}`                                | `configurations.syntax`                          |

## Acceptance

Parse the flat link records through the official Links Notation parser and do numeric reference validation afterward. Explicitly reject the extra nesting above. Preserve compatible separators and an inferred base while still rejecting an incorrect explicit base. Offer a formatter or options for the historic one-line parenthesized export and both associative notation labels. Expose structured validation parameters (such as actual base and link count) for localized field errors.

The consumer retains parser adapters and regression tests while using the released codecs, enumeration and edit functions. See [PR 55](https://github.com/konard/konard.github.io/pull/55).
