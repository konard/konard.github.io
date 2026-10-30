# Visual review of the unchanged seeded sample

Reviewed both complete `random-preserved` contact sheets on October 30. Each
cell shows original / automatic geometry. The same twenty codes and colors
are retained, and actual middle coordinates and all closed-half control points
are independently compared in automated tests. No own-shaft crossing or new
middle cut was observed. Original inter-link crossings remain in three of the
four-link examples: preserving the drawing takes priority over zero cost.

| Network | Residual cost | Inspection and action under fixed placement |
| --- | ---: | --- |
| `01` | 0 | Free source and closed target loop stay distinct and unchanged |
| `10` | 0 | Closed source and free target stay distinct and unchanged |
| `11` | 0 | Both closed lobes and endpoint gaps remain unchanged |
| `00` | 0 | Free straight link remains continuous and unchanged |
| `2111` | 0 | Small symmetric reference adjustments separate the ends around the closed loop |
| `2012` | .102 | Cyan/purple ends separate locally; residual own-marker clearance remains within original bounds; closed purple half preserved |
| `1222` | 0 | Cyan incoming end separates from purple closed-loop markers without moving either middle |
| `0100` | 0 | Closed cyan half and independent purple link stay unchanged |
| `032113` | .178 | Reference tips separate near the upper cyan middle; residual pink own-marker clearance remains, with closed lobe unchanged |
| `133111` | 0 | Three referencing links separate around the fixed cyan closed half |
| `100321` | 0 | Purple/pink references separate at both fixed middles; cyan closed half unchanged |
| `111300` | 0 | Purple reference leaves the closed cyan figure clear; no middle cut |
| `132001` | 0 | Cyan/pink paired references separate; free purple half preserved |
| `013302` | 0 | Purple/pink paired tips separate; independent cyan half unchanged |
| `42414220` | 0 | Small local bends and gaps separate the upper paired arcs; all four middle positions and closed halves retained |
| `43434143` | 6.629 | Reference-end crowding improves; existing inter-link crossings remain; fixed yellow closed lobe retained |
| `33044224` | 7.564 | Reference markers separate locally; fixed-order crossings and small closed-half clearance residual remain |
| `31324042` | 2.333 | Yellow/purple and cyan/pink reference tips separate locally; existing cyan/yellow crossing and own-marker residuals remain |
| `04210010` | 0 | Free/reference ends separate without moving middles or changing topology |
| `32103141` | 0 | Reference tips separate at fixed cyan/pink middles; yellow closed half preserved |

Fifteen examples reach zero painted residual; the other five retain explicitly
recorded costs. `data/residual-witnesses.json` decomposes each residual into
own-link and inter-link contributions. The additional probe for immutable
closed-marker versus middle-marker collisions found none; it does **not** prove
that every residual is mathematically unavoidable. The result is a bounded
local improvement, not a global optimum or a planar rerouting claim. Increasing
search range, moving nodes or changing closed halves would change the requested
constraint or the drawing; none happens automatically.

The reported `2222` keeps its original centers and colors and produces a nearby
symmetric lens without the old own-reference crossing. `34442132` retains the
original cyclic order `1 2 3 4`, colors and rendered coordinates; its remaining
cost is 13.285 from inter-link contributions. The rejected reordered result is
retained separately as `chromium-rejected-34442132.png`, not as final evidence.
Both reported examples have before/after screenshots, plus exact preview,
Apply, shared-URL and actual SVG-download checks. The explicit proposed
`.05 / 180 / 13` settings and a manually ordered/pastel arrangement are also
checked without moving or recoloring any link.

See [README](README.md) for the contact sheets, commands and evidence labels.
