# Issue 29 work plan

Objective: complete all requirements of issue 29 and the inherited requirements from issue 27 and earlier issues in PR 30. Prefer newer requirements where they conflict.

- [x] Read and archive the full issue chain, comments, PR conversation/inline comments and reviews; download and inspect supplied images.
- [x] Inventory every acceptance criterion, identify existing coverage and inherited gaps, and review recent related implementations.
- [x] Reproduce the controls and automatic-spacing failures with bounded scripts and before screenshots. Write failing regression tests before fixes.
- [x] Research native range keyboard behavior and relevant geometry/optimization components using primary online sources; record root causes and alternatives.
- [x] Implement paired turn sliders, individual resets, one-degree changes, keyboard controls and reference-gap sliders throughout affected controls.
- [x] Improve automatic spacing to preserve valid manual configurations, respect symmetry, and prefer uniform close gaps using one-degree searches. Retain experimental labeling and default-off diagnostics.
- [x] Add targeted unit and real-browser regression coverage, shared-URL/history checks, mobile checks and before/after screenshots. Retain reusable probes under experiments/.
- [x] Run all available local checks and tests sequentially within the container memory budget; save lengthy output and inspect logs.
- [x] Review changes for preservation of existing behavior, merge main if needed, commit atomic steps and push only issue-29-2c98572a467a.

The final publication gates are recorded by the live [PR 30](https://github.com/konard/konard.github.io/pull/30), because this archive necessarily precedes its own commit SHA:

- Updated title/description with reproduction, tests, screenshots and positive closing references for every required issue.
- Latest-head CI timestamps and SHA checked; any failed logs downloaded and fixed; every required check passes.
- Latest issue and all three PR feedback types re-read; clean working tree, main ancestry and final diff verified; PR marked ready and left unmerged.
