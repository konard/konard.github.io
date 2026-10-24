// What the sound engine needs from the settings, and `cue`, which any
// component calls to sound an interaction (issue #15). This file is tiny and
// loaded on every page; the engine itself (./engine.js) is loaded only when
// sound is switched on.
import { SOUND_EVENTS, SOUND_SLOTS } from '../settings/schema.sound';

/** The options of the player from the settings. */
export function soundOptions(s) {
  const effects = {};
  const levels = {};
  for (const [event] of SOUND_EVENTS) {
    const sounds = [];
    for (const n of SOUND_SLOTS) {
      const id = s[`sound.${event}${n}`];
      if (id === 'none') break;
      sounds.push(id);
    }
    effects[event] = sounds;
    levels[event] = s[`sound.${event}Level`];
  }
  return {
    on: s['sound.on'],
    volume: s['sound.volume'],
    mode: s['sound.mode'],
    tone: s['sound.tone'],
    reverb: s['sound.reverb'],
    room: s['sound.room'],
    pitch: s['sound.pitch'],
    stereo: s['sound.stereo'],
    width: s['sound.width'],
    gap: s['sound.gap'],
    effects,
    levels,
  };
}

export const CUE = 'site:sound';

/** Sounds an interaction (`'open'`, `'notify'`…) if sound is on; does nothing otherwise. */
export function cue(event) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CUE, { detail: event }));
}
