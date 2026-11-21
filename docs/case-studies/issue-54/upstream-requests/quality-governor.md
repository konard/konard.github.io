ui-themes: adaptive quality degradation, per-effect frame rate and still repaints in createEffectGovernor

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to drop every general-purpose UI mechanism from the site. Related upstream work: #66 and the #211 follow-up. #211 added `createEffectGovernor` as the "reusable animation governor", and its inventory leaves "consumer engine integration unverified". The site's background layers still use their own governor, because the upstream one schedules frames but does not adapt quality to device speed. Licensing: the site has no license, so this is a behavior specification only. No site code is copied.

## Current upstream (b4baef4)

- `packages/ui-themes/src/classic/materials.js` `createEffectGovernor({requestFrame, cancelFrame, onSound})` provides `set({motion, reducedMotion, visible, sound, volume})`, `add(id, draw)`, `sound(event)` and `dispose()`.
  - Each draw callback runs on every animation frame while `motion && !reducedMotion && visible`. Returning `true` keeps it scheduled.
  - Effects have no frame-rate cap and are not given an elapsed time.
  - Nothing measures frame times or lowers resolution or frame rate.
  - `visible` and `reducedMotion` must be pushed by the host. The governor does not listen to `visibilitychange` or `matchMedia` itself.
  - While motion is off, a registered effect cannot ask for a single repaint, for example after its options change or its canvas is resized.
- `packages/ui-themes/src/classic/materials.d.ts` declares the same surface. `packages/ui-themes/tests/material-surface.test.js` covers scheduling and cancellation only.
- Nothing in `packages/ui-animation/src` measures frame-time performance either.

## Required behavior

- **Frame-time watcher**: one per effect, or shared, fed with the gap since the previous animation frame.
  - A gap above 45 ms counts as slow (below about 22 fps).
  - Gaps ≤ 0 or > 1000 ms are ignored. These are hidden tabs, debugger pauses and the first frame.
  - Frames are judged in windows that close after 30 frames or 1000 ms of accumulated time, whichever comes first.
  - The first window after start is a warm-up (scripts, fonts, layout) and is never judged.
  - A window is struggling when more than half of its frames are slow.
- **Degradation ladder**, one step per struggling window:
  1. resolution share × 0.7 (rounded to 3 decimals), down to a floor of 0.4;
  2. after that, frame-rate share ÷ 2, down to a floor of 0.25.
  - Floors and factors are options; the values above are the defaults.
  - Quality never goes back up during the session, so the layer does not flicker between sizes.
  - Effects can opt out of resolution steps (`resolution: false`, for crisp sprite layers). These lower only the frame rate.
- **Change signal**: the governor reports when a share has just been lowered (return value or callback), so the effect can resize its backing store once. The current `{scale, fps}` shares are readable at any time.
- **Per-effect frame-rate cap**: `add(id, draw, {fps})` with a target of 5..60 fps. The callback is skipped until 1000 / (fps × fps share) ms have passed. Skipped frames still feed the watcher.
- **Elapsed time**: draw receives the elapsed seconds since its last draw, clamped to 0.25 s, so a stall does not make animations jump.
- **Pause/resume**: pausing (motion off, reduced motion, hidden) and resuming reset the per-effect "previous frame" and "last draw" timestamps. The pause therefore never counts as a slow frame and never shows up as a large elapsed time.
- **Still repaint**: `invalidate(id)` runs the effect's draw once with elapsed time 0, even while motion is off, on the next frame or immediately. Motion does not resume. This covers option changes and resizes of paused layers.
- **Optional automatic inputs**: `createEffectGovernor({watchVisibility: true, watchReducedMotion: true})`.
  - It subscribes to `document.visibilitychange` and `matchMedia('(prefers-reduced-motion: reduce)')` and updates `visible`/`reducedMotion` itself. Both sources are injectable for tests, and `dispose` removes the listeners.
  - A tri-state motion preference `auto | on | off` maps to `auto` = follow the system, `on` = move even under reduced motion (an explicit viewer choice), `off` = never move.

## Acceptance criteria

- [ ] With an injected clock, 20 windows of 16.7 ms gaps leave `{scale: 1, fps: 1}`.
- [ ] Five 200 ms gaps at start (the warm-up window) lower nothing.
- [ ] After a fast first window, 20 gaps of 60 ms lower the scale to 0.7 and fps stays 1. Continued slow frames reach `{scale: 0.4, fps: 0.25}`. Later fast frames never raise either share.
- [ ] Interleaving 5000 ms and 0 ms gaps with mostly fast frames plus 3 slow frames per window never lowers quality.
- [ ] With `resolution: false`, sustained slow frames give `{scale: 1, fps: 0.25}`.
- [ ] An effect added with `{fps: 30}` on a 60 Hz fake clock is drawn on about every second frame. After one fps step it is drawn about every fourth frame.
- [ ] Motion off then on after 10 s produces no slow-frame count and an elapsed time ≤ 0.25 s on the first draw.
- [ ] `invalidate(id)` while motion is off calls draw exactly once, and no further frames are requested.
- [ ] With `watchVisibility`, dispatching `visibilitychange` with `hidden = true` cancels the pending frame. Showing the page reschedules it. After `dispose` no listeners remain.
- [ ] TypeScript declarations cover the new options and return values.

## Consumer code that becomes deletable

- `src/visuals/governor.js` (55 lines) and `src/visuals/governor.test.js` (56)
- the per-layer frame loop, fps throttling, hidden-page skip and pause bookkeeping in `src/visuals/stars.js` (440), `src/visuals/beams.js` (211) and `src/visuals/nebula.js` (246), about 25–35 lines each. The remaining parts are covered by the background-effects request.
- the motion `auto | on | off` resolution in `src/components/Cosmos.jsx` (220)
