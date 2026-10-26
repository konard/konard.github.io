# Validation record

All work is on `issue-23-729a1009db7c`. The fetched default branch is already an
ancestor of the branch head. This is a private static-site package with no
package publication/release workflow, so there is no package version bump.

## Reproducing failures

- `logs/reproduce-geometry.log`: four failures on the old code (bend 20,
  unsigned range, displaced bar off its curve, missing per-link overrides).
- `logs/reproduce-ui.log`: two failures on the old code (duplicate gallery
  link and absent individual gap controls).
- `data/chromium-baseline.json`: 4,131 retained card filters at 4,131 cards.
  `screenshots/chromium-before-{free,markers,card,gallery}.png` show the old build.
  The actual Safari blink is documented in the supplied `images/reported-23-*`.

## Local checks

- Full Vitest suite: **710 tests / 41 files passed** in 181.12s, single worker
  to respect memory. See `logs/unit-final.log`. Earlier focused and complete
  runs are retained for chronology.
- `npm run check`: lint, formatting, source line limits and secret checks passed.
  The existing 1,354-line registry collector warning is below the 1,500-line gate.
- Evidence logs/metadata were also scanned separately with secretlint.
- `npm audit --audit-level=moderate`: zero vulnerabilities.
- Production build: passed. Vite's existing extensionless-import advisory about
  its future native config loader is unrelated to these changes.

## Browser and responsive checks

- Chromium 153.0.8010.12: 4,131 cards loaded; 55–176 active card filters rather
  than 4,131. All three skins retain a fixed header through repeated scrolls.
  The independent compositing probe changes 134,762 / 72,177 / 126,885 header
  pixels when glass / liquid / futuristic blur is disabled, respectively.
  Native SVG marker distances and tangents, gap sharing and solver application
  pass. Final peak owned RSS: 1,557,323,776 bytes; cgroup peak: 2,660,286,464 bytes.
  See `logs/chromium-issue23-final.log` and `data/chromium-after.json`.
- Site-wide alignment: all 240 combinations pass, zero browser errors. Every
  HTML entry is covered across three skins, two themes, two languages and
  widths 360 / 1,440. See `logs/alignment.log` and `data/alignment-after.json`.

- Chromium: all three existing editor/history/geometry suites pass locally.
- Firefox and WebKit: the issue #19 history/layout/mobile suite passes locally.
  Their remaining suites reach the conservative RSS/cgroup guard; partial
  successes are retained in logs and are **not** counted as full passes.
- CV build: **all 120 PDFs pass** page-count limits, text-layer and reading-order
  checks. See `logs/cv-pdfs.log`.

The complete three-engine CI matrix must pass before the pull request is ready.
A started or resource-bounded command is not recorded as a pass.

## Test calibration

Early runs of the new browser tests exposed assumptions in the test harness:
100 filtered cards was too low for eleven columns and a viewport + 200px margin;
a document-bottom scroll could leave the gallery entirely; and liquid glass's
floating capsules intentionally own blur while the header wrapper has none.
The corrected test waits for visibility delivery, checks fewer than 250 active
card filters independently of total count, scrolls within the gallery, measures
the real header surface and compares composited pixels with/without blur.
These calibration logs are retained under `logs/chromium-issue23-initial-*`.
The first alignment probe compared horizontal spans without vertical position;
the corrected probe tests actual rectangle intersection for the mobile two-row
header. Neither calibration justified a product change.

The first 4,131-card run passed its gallery/blur checks but reached the finite
1.6GB RSS guard while navigating from that large gallery to the mobile editor.
Closing the large context before opening the independent mobile context avoids
retaining both renderers during transition. The completed run remains within
the unchanged memory ceiling. `logs/chromium-issue23-memory-navigation.log`
preserves that attempt. The initial successful 1,215-card data is retained as
`data/chromium-initial-complete-1215.json`.

Firefox's complete legacy editor suite crossed the local 1.6GB owned-RSS guard
(1,623,138,304 bytes, cgroup 2,405,425,152 bytes). An earlier attempt hit the
cgroup ceiling with warm browser/package cache; advising unused cache pages
released reduced that pressure, but did not remove the owned-RSS limit. Neither
attempt is reported as a passing suite. Remaining validation runs on the CI
runner; its complete suite result is required before finalizing. Both logs are
retained as `firefox-network-e2e*.log`.

## Solver scaling regression

The finite 3/6/12/24-link experiment found a draft regression: full-drawing
rescoring for every gap candidate took 34.95s at 24 links. A reproducing test
failed on that code (`logs/reproduce-solver-scale.log`). Caching unaffected
pair costs reduces the same fixture to 4.81s, with exactly the same objective
114.25 → 74. Global rescoring remains when a changed fit affects other middle
cuts. The regression allows 10s for shared CI runner variance; final exact
scores, improvement and input immutability remain verified. Before/after raw
measurements are in `logs/solver-scale-before.log` and `logs/solver-scale.log`.

## Final fitted cut budgets

An independent 1,024-sample measurement of final, fitted curves found two cuts
above the 30% budget after later reference-gap changes in a dense 24-link layout:
3.810 vs 3.588 allowed, and 4.935 vs 4.647 allowed. The probe and a new unit test
both failed before the correction (`logs/reproduce-solver-caps-probe.log` and
`logs/reproduce-solver-caps-test.log`). A final budget pass now clamps newly added
cuts against the completed geometry, retaining manual starting cuts and the
exact-score rejection check. All four bounded layouts (3/6/12/24 links) and the
regression pass; see `logs/solver-caps.log` and `logs/solver-caps-test.log`.
