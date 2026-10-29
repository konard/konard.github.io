# Issue 35 work plan

Objective: implement and verify every requirement of issue 35 in PR 36, on
`issue-35-0a1c09fbb17e`, with no deferred work.

- [x] Read issue body, all comments, sub-issues, PR conversation, inline comments and reviews.
      The issue has no comments/sub-issues; all three PR feedback endpoints remain
      empty on the follow-up audit of 2026-10-29.
- [x] Inspect reported screenshot (downloaded and validated as PNG), repository
      guidance, current branch, and recent merged PR style. No AGENTS.md found.
- [x] Reproduce `code=003002&solve=true` with zero middle cuts; capture before image.
- [x] Trace root cause and add a minimum failing regression before changing code.
- [x] Fix unintended middle cuts while preserving explicit cuts and reference gaps.
- [x] Add browser coverage to the existing framework and CI; capture final image.
- [x] Run focused tests, then all local checks, tests, build and appropriate browser suites
      sequentially within the 2.92 GiB memory budget; preserve logs.
      All 871 unit/DOM tests, three native issue 35 suites, MCP verification,
      production build, 120 PDFs and local checks pass. Three unrelated Linux
      WebKit compatibility timeouts are preserved; macOS CI passes those suites.
- [x] Commit useful atomic steps with checks first; push only the prepared branch.
- [x] Inspect the implementation diff, refresh all feedback and confirm main is an ancestor.
      Check the final evidence diff and clean tree after the last commit.
- [x] Update PR title/body with reproduction, tests, before/after screenshots and Fixes #35.
- [x] Verify implementation CI timestamps/SHA and every required outcome.
      Run 40928515827 passes for 4f1b165; there are no non-passing CI jobs to
      investigate (pull-request deployment is intentionally skipped).
- [x] Mark PR 36 ready and keep unmerged.

Requirement map:

1. A link must remain continuous through its own middle when both middle cuts
   are zero, including automatic spacing and overlap solving (reported URL).
2. Add regression tests for the bug; verify explicitly requested cuts still work.
3. Preserve all existing editing, rendering, share and download behavior.

Implementation and verification evidence will be recorded in the issue 35 case study.

Final operations after committing this evidence: confirm a clean tree and fresh
main ancestry, re-read feedback, verify the new head's CI run, and report the
outcome with the PR URL. The final head and CI status are recorded on PR 36,
avoiding a new documentation commit solely to record its own CI result.
