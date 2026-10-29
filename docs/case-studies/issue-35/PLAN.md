# Issue 35 work plan

Objective: implement and verify every requirement of issue 35 in PR 36, on
`issue-35-0a1c09fbb17e`, with no deferred work.

- [x] Read issue body, all comments, sub-issues, PR conversation, inline comments and reviews.
      The issue has no comments/sub-issues; PR feedback is empty as of initial review.
- [x] Inspect reported screenshot (downloaded and validated as PNG), repository
      guidance, current branch, and recent merged PR style. No AGENTS.md found.
- [x] Reproduce `code=003002&solve=true` with zero middle cuts; capture before image.
- [x] Trace root cause and add a minimum failing regression before changing code.
- [x] Fix unintended middle cuts while preserving explicit cuts and reference gaps.
- [x] Add browser coverage to the existing framework and CI; capture final image.
- [ ] Run focused tests, then all local checks, tests, build and appropriate browser suites
      sequentially within the 2.92 GiB memory budget; preserve logs.
- [ ] Commit useful atomic steps with checks first; push only the prepared branch.
- [ ] Inspect PR diff, refresh all feedback, confirm main is an ancestor and clean tree.
- [ ] Update PR title/body with reproduction, tests, before/after screenshots and Fixes #35.
- [ ] Verify latest CI timestamps/SHA; download and analyze any non-passing logs.
- [ ] Mark PR 36 ready, keep unmerged, and report verified outcome with PR URL.

Requirement map:

1. A link must remain continuous through its own middle when both middle cuts
   are zero, including automatic spacing and overlap solving (reported URL).
2. Add regression tests for the bug; verify explicitly requested cuts still work.
3. Preserve all existing editing, rendering, share and download behavior.

Implementation and verification evidence will be recorded in the issue 35 case study.
