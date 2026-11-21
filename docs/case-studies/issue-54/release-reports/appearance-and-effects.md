The replacements from #222–#226 are present in the npm 0.1.0 releases of `ui-sound`, `ui-animation` and `ui-themes`. These contracts remain open for existing hosts that need their artwork, settings and behavior to survive migration.

## Audio and adaptive backgrounds

- `createSoundBus` routes volume through a gain **after** the compressor and reverb, with a hardcoded destination. A host with presets authored for input gain before the effects cannot select that graph or route a preview to its own destination. Expose gain placement/destination and test both quiet and stacked sounds with the same patch and gain. Keep lazy activation and live room, stereo and pitch settings.
- `createEffectGovernor` owns the animation frame scheduler. `createQualityWatcher` implements the matching gap-window logic internally but has no package export. Expose the watcher for hosts that already have RAF/timers and need to consume quality shares without scheduling a second frame loop.
- The star layer seeds a hardcoded PRNG and uses a different random sequence and sprite drawing. A host cannot supply an existing star sequence and sprite painter. Add injection points for random source, sprites and static layout. Compare a small deterministic canvas before/after.
- The rain layer's `createCadence` uses a rolling median, starting with the very first frame gap, while the existing host measures non-overlapping 30-gap windows and uses the upper median. Support the batched calibration mode to avoid changing step cadence during a transient slowdown. Expose where a host can supply a fixed-time phase and preserve the one-cell wrap with a separately mounted grid.
- The shader and grid already have separate entry points. Verify replacement using the host's shader/clock and grid coordinate system, including independent color/alpha variables and grid-aligned beams/rain. Give the host a way to share initial random state and CSS tokens so a still frame, saved state or paused animation has the expected appearance.

## Transparent frames and optical materials

- `frameLayers()` produces dedicated surface and stroke spans. Existing hosts have frame painting in pseudo-elements and a separate visibility governor. Expose the frame CSS generation stages, including geometry/edge/style variables, independently of a mandated DOM, or allow host selectors for the existing material and stroke surfaces. Verify combined skin, level, per-corner inheritance, independent edge cut, pure-border mode and intrinsic fit across viewport sizes.
- The materials release supplies `materialStyle` and optical helper parameters. It has a built-in grain texture, highlight/shadow equations and its own fallback color token. Support a host texture/lighting function plus the existing prefixed theme variables and clipping, so changing appearance calculation does not change a saved glass/liquid look. Verify reduced transparency, separate border and content opacity, and offscreen suppression for long lists of surfaces.

See the full tests and baseline requirements in #222–#226 and the [consumer PR](https://github.com/konard/konard.github.io/pull/55).
