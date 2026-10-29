# Visual review of the unchanged seeded sample

Reviewed both complete before sheets and both final after sheets, alongside the
independent dense-curve tests. Each cell shows original / automatic geometry.
All final results have zero measured residual; no own-shaft crossings or new
middle cuts were observed. Deliberate shaft attachment at an own middle is part
of the drawing grammar.

| Network | Inspection and resulting action |
| --- | --- |
| `01` | Free source and closed target loop remain distinct; preserve |
| `10` | Closed source loop and free target remain distinct; preserve |
| `11` | Two closed halves retain the expected two lobes and endpoint gaps |
| `00` | Free straight link remains continuous and unchanged |
| `2111` | Paired reference ends separate symmetrically around the closed loop |
| `2012` | Old residual near the closed purple half; compact Automatic placement removes crowding |
| `1222` | Incoming cyan endpoint separates from the purple closed-loop markers |
| `0100` | Closed cyan half and independent free purple link stay clear |
| `032113` | Old fitted-loop/reference residual; compact and reorder the automatic layout |
| `133111` | Three referencing links separate around the cyan closed half without crossing |
| `100321` | Purple/pink references separate at both middles; cyan closed half retained |
| `111300` | References separate from the closed cyan figure; no middle cuts |
| `132001` | Paired cyan/pink references remain clear; free purple half preserved |
| `013302` | Purple/pink paired references separate; independent cyan half unaffected |
| `42414220` | Old small residual on the upper paired arcs; finer clearance priority eliminates it |
| `43434143` | Old crossed four-link drawing; reorder and compact, retaining the yellow closed half |
| `33044224` | Old multiple crossings; change automatic order and endpoint angles within bounds |
| `31324042` | Old cyan/pink crossing; reorder and compact while retaining both closed lobes |
| `04210010` | Closely attached free/reference ends separate without changing their topology |
| `32103141` | References around the cyan and pink middles separate; yellow closed half retained |

The reported `2222` additionally has a dense regression for the old folded lens;
the final symmetric lens has no crossing. The reported `34442132` has a separate
preview, Apply, shared-URL and SVG-download equality check, including the suggested
`.05 / 180 / 13` search settings in the unit regression and measurement script.

This review covers every sampled image, rather than inferring visual correctness
from the old incomplete collision score. See [README](README.md) for complete
before/after sheets and the limits of this finite sample.
