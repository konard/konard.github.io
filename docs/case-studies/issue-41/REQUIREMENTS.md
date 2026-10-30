# Requirement inventory

Source: the full [issue 41](https://github.com/konard/konard.github.io/issues/41)
and archived issue/PR API responses in `data/`. There are no required sub-issues,
issue comments, PR conversation comments, inline comments or reviews at the
initial read. The final feedback refresh is part of the completion checklist.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Default `0222` must match `turns=0 -30` | Resolve aligned reference turns before rendering | Geometry test and native browser SVG equality |
| Default `0112` must match `turns=,-30 0` | The same rule handles a reference beside a closed half | Geometry test and native browser SVG equality |
| Default `0001` must match `turns=,0 -30` | Symmetric target-half treatment | Geometry test and native browser SVG equality |
| Default `2002` must match `turns=-30 0` | Symmetric source-half treatment | Geometry test and native browser SVG equality |
| Prefer the simplest feasible arrangements everywhere applicable | A shared geometric rule cancels a nominal angle only on aligned reference tangents; reciprocal routes retain their distinct curves | All 4,181 topologies of 1–3 links, eight placements, rotation/aspect/order and collinear through-link tests |
| Check twenty additional random 1–3-link cases | Fixed `0x41c0de` sample: four one-link, eight two-link, eight three-link cases, without result-based replacement | Native screenshots, comparison sheets, raw browser data and measurements |
| Change turns/default placement only; leave gap configuration to gap reduction | Return ordinary per-link turns; keep placement, closed halves, gap fields, cuts and gap algorithm unchanged | Exhaustive layout-coordinate/gap invariants and Apply/worker checks |
| Preserve previous perfect behavior | Skip lenses, non-aligned references, reciprocal routes, deliberate angle/bend settings and legacy gallery/rain geometry; explicit turn lists override inferred turns | Existing full unit/browser suites; historical gallery digest; manual/zero-turn and reset regressions |
| Download relevant logs and data into the case-study directory | Archive issue, PR, empty feedback/sub-issue responses, related PR history, CI and local logs | `data/`, `logs/` and final CI metadata/logs |
| Deep case study: timeline, requirements, root causes, solutions, online research and components | README, this inventory, plan, research data and reciprocal-route experiment | Linked evidence and reproducible commands |
| Add diagnostics if evidence is insufficient | Root cause is reproducible; existing opt-in `solveDebug` remains available, off by default | Before failures and before/after geometry/visual data provide sufficient evidence |
| Report related upstream defects if found | Investigation identifies a local default-selection defect; no upstream defect found | Research decision recorded in `data/research.json` |
| One complete PR with tests and visual evidence | Update PR 42 on the prepared branch, preserve positive closing reference, check current-head CI and mark ready | Final PR description and status |
