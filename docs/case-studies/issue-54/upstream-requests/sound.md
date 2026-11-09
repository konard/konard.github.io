ui-sound: live bus parameters, humanized playback, settings-driven event mapping and document-level interaction binding

## Context

The consumer migration konard/konard.github.io#54 ([PR 55](https://github.com/konard/konard.github.io/pull/55)) has to remove all general-purpose UI code from the site. Related upstream work: #66 (migration) and the #211 follow-up, whose inventory marks "consumer engine integration unverified". The site still has its own Web Audio engine, player and DOM binding because `@link-foundation/ui-sound` cannot represent the behavior below. Licensing: the site has no license, so this issue is a behavior specification only. No site code is copied here. The 26 ported patches already exist in `themes/immortality.lino`, and the site's own extra patches stay consumer theme data.

## Current upstream (b4baef4)

- `packages/ui-sound/src/graph.js` `createSoundBus`: the shelf frequency/gain, compressor and reverb amount are read once when the bus is built. The reverb send exists only if `reverb > 0` at that moment. The impulse length is fixed at 1.4 s. Only `master` is exposed. Each noise part allocates a new noise buffer on every play.
- `packages/ui-sound/src/player.js` `createSoundPlayer`: volume and enabled come from config. The volume is clamped to 0..1 and applied with `setValueAtTime`, which is a step change. `random` mode can pick the same voice twice in a row. There is no per-play detune or level variation, no per-event level, and no stereo on/off or width. The pan always follows the pointer. Throttle values come only from the theme. Nothing happens on `visibilitychange`. Audio initializes only on a `pointerdown`/`keydown` the player itself observed, so a player created after the user's first gesture (for example, lazily loaded) stays silent until another gesture arrives. Events are mapped to voices only inside the theme text. There is no way to play one named voice directly.
- `packages/ui-sound/src/comfort.js` only has `sound.enabled` and `sound.volume`.
- `packages/ui-sound/src/bind.js` `bindSound` maps ui-dom `onAction` and machine events. There is no binding for pages whose controls are not rendered through ui-dom actions.
- `packages/ui-themes/src/classic/materials.js` `createEffectGovernor().sound` is a visibility-gated sink with a bounded volume. It is not connected to the player.

## Required behavior

- **Live bus parameters**, all changeable at runtime without rebuilding the context. Changes ramp smoothly (time constant about 20 ms) so they do not click:
  - master volume 0..1. A host may opt into a larger maximum (the site uses 0..2, default 1, which is a 200 % boost).
  - tone: high-shelf gain in dB at a configurable frequency. The site uses 3.2 kHz with the presets warm −7 dB, neutral 0 dB and bright +5 dB.
  - reverb wet send 0..1, default 0.2. The send must exist even when the initial value is 0.
  - room (impulse length) 0.3..4 s, default 1.4. Changing it regenerates the impulse in place.
- **Humanization**: a pitch spread of 0..100 cents (default 15). Each play gets a uniform random detune within ±spread and a level variation of up to ±10 %, scaled by min(1, spread / 15 cents). A spread of 0 makes playback deterministic.
- **Stereo**: a toggle (default on) and a width of 0..1 (default 0.6). The effective pan is pointer pan × width. When stereo is off the pointer pan is 0, but per-part pan still applies. Results are clamped to −1..1.
- **Selection**: `random` never picks the voice that played last for the same event when more than one voice is available. A global mode override (random / cycle / layer) applies to every event. Layered voices keep the existing 1/√n headroom.
- **Per-event level** 0..2 (default 1), multiplied into the voice gain.
- **Runtime event mapping**: `configure({events})` replaces an event's voice list (0..4 voices, in order), mode, level and throttle without re-reading the theme. An empty list means the event is silent.
- **Settings generator**: produces a ui-settings schema fragment from a theme and an event list:
  - up to N ordered voice slots per event (the site uses 4). Each slot is shown only after the previous one is set, offers "none" plus every theme voice (labels from the voice `source.character`), and has a per-event level.
  - global fields: mode, tone, reverb, room (shown only while reverb > 0), pitch spread, stereo, width (shown only while stereo is on), hover gap 0..500 ms (default 80).
  - all fields are marked as comfort fields, so presets do not override them (as `SOUND_COMFORT_KEYS` already does).
- **Preview**: `player.preview(voiceName)` plays one voice immediately, through the bus and humanization, respecting enabled/volume. It powers the ▶ buttons in settings.
- **Hidden page**: when `document.hidden` becomes true, suspend the context so reverb tails stop. The next eligible play resumes it.
- **No-autoplay unlock**: if the page already has sticky activation (an injectable check of `navigator.userActivation.hasBeenActive`), the first `play` creates or resumes the context directly. Plays before activation stay silent and are not queued. Switching sound on inside a click handler can then play `intro` in that same gesture.
- **Click-free envelopes**: amplitude is exactly 0 before each part's scheduled start, including repeats that start between samples.
- **Noise**: reuse one noise buffer per context and sample rate, starting each play at a random offset. Do not allocate a new buffer per play.
- **Document-level binding** (`bindSoundToDocument(player, {root, cueEvent})`), one set of capture listeners:
  - hover fires once per newly entered interactive element and is throttled by the hover gap. Touch and pen pointers never produce hover sounds.
  - clicks are classified as follows: an ancestor with `data-sound` overrides everything; checkbox or `aria-pressed` gives toggle; radio, `role=tab` or `role=radio` gives select; other links and buttons give activate.
  - a `<summary>` click is left to the `<details>` toggle event, which plays open/close.
  - dragging a range input gives select (throttled 70 ms); typing in a text field gives type (30 ms); a `<select>` or colour input change gives select.
  - pointer moves over an opt-in region (an attribute) give scan (90 ms).
  - disabled controls are silent.
  - a window CustomEvent channel lets components cue sounds without importing the player.
- The set of events suppressed by reduced motion becomes configurable. The default stays `intro`, `scan`.

## Acceptance criteria

- [ ] With a fake AudioContext, changing tone/reverb/room/volume after the first sound updates the existing nodes. No new context is created, and the room change swaps the convolver buffer.
- [ ] A theme with `reverb 0` gets a working wet send after it is configured to 0.5.
- [ ] With a seeded random, 1000 `random`-mode plays on a two-voice event never repeat a voice in a row. A one-voice event always plays that voice.
- [ ] Pitch spread 0 gives detune 0 and level 1 exactly. Spread 15 keeps detune within ±15 cents and level within ±10 %.
- [ ] With stereo off, pan is the part pan regardless of the pointer. Width 0.5 at the right edge gives pan 0.5.
- [ ] Per-event level 2 doubles the scheduled peak gain. An empty voice list returns `[]`.
- [ ] The generated schema shows slot n+1 only while slot n is not "none", and all keys are preserved by presets.
- [ ] `visibilitychange` to hidden calls `suspend()`. The next play calls `resume()`.
- [ ] A player created after sticky activation plays on its first `play()` with no new gesture. Without activation it stays silent and creates no context.
- [ ] The DOM binding produces the event per element type listed above (test matrix), no hover from touch, one sound per `<details>` toggle, and `data-sound` overrides.
- [ ] Repeated noise plays allocate at most one AudioBuffer per context.

## Consumer code that becomes deletable

- `src/sound/engine.js` (232 lines)
- `src/sound/interactions.js` (112)
- `src/sound/options.js` (42)
- `src/components/Sound.jsx` (57), reduced to a few lines of wiring
- `src/settings/schema.sound.js` (165), reduced to the event list and labels
- `src/sound/library.js` (209), whose 26 ported patches are already upstream; the 5 site patches move to a consumer `.lino` theme
- related tests: `src/sound/sound.test.jsx` (442), `src/components/Sound.test.jsx` (45), `src/components/Sound-load.test.jsx` (32)
