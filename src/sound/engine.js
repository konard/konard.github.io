// The Web Audio engine of the interface sounds (issue #15), ported from
// konard/immortality (src/sound.ts, the Unlicense). All voices run through one
// bus: a tone shelf, a compressor that keeps a stack of sounds from clipping,
// and a send to a convolution reverb. Each play gets a little random detune
// and level, and may be panned towards the pointer. The AudioContext is made
// only after the visitor has interacted with the page, so browsers never warn
// about autoplay, and only when sound is switched on (this module is loaded
// only then, see src/components/Sound.jsx).
import { SOUND_SPECS } from './library';

/** Gain (dB) of the tone shelf at 3.2 kHz. */
export const TONE_SHELF = { warm: -7, neutral: 0, bright: 5 };

let noiseBuffer = null;
function whiteNoise(audio) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== audio.sampleRate) {
    noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.5), audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** A short stereo room: decaying, slightly low-passed noise. */
function roomImpulse(audio, seconds) {
  const length = Math.ceil(audio.sampleRate * seconds);
  const buffer = audio.createBuffer(2, length, audio.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = last * 0.55 + (Math.random() * 2 - 1) * 0.45;
      data[i] = last * Math.pow(1 - i / length, 3.2);
    }
  }
  return buffer;
}

/** The master chain on `audio`: input → tone shelf → compressor → destination, with a reverb send. */
export function createBus(audio, destination = audio.destination, { room = 1.4 } = {}) {
  const input = audio.createGain();
  const shelf = audio.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 3200;
  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;
  const convolver = audio.createConvolver();
  convolver.buffer = roomImpulse(audio, room);
  const wet = audio.createGain();
  input.connect(shelf);
  shelf.connect(compressor);
  shelf.connect(convolver);
  convolver.connect(wet).connect(compressor);
  compressor.connect(destination);
  return { input, shelf, wet, convolver, compressor };
}

/** An attack and decay that releases to true silence, without clicks. */
function envelope(audio, start, voice, gain) {
  const amp = audio.createGain();
  const attack = Math.min(voice.attack ?? 0.004, voice.duration * 0.8);
  // Silent from the start: a gain is 1 until its first event, and a source
  // starting a sample before that event (times between samples, as in the
  // repeats of mica) let one sample of full-scale noise through.
  amp.gain.value = 0;
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(Math.max(0.00011, gain), start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
  amp.gain.linearRampToValueAtTime(0, start + voice.duration + 0.01);
  return amp;
}

function sweep(param, value, start, duration) {
  param.setValueAtTime(value.from, start);
  if (value.to !== value.from) param.exponentialRampToValueAtTime(Math.max(1, value.to), start + duration);
}

/**
 * Schedules the patch `spec` on `audio` into `output`; returns when it ends.
 * `gain` scales it, `detune` (cents) shifts it, `pan` (−1…1) moves it.
 */
export function playSpec(spec, audio, output, { gain = 1, detune = 0, pan = 0, at = audio.currentTime } = {}) {
  let end = at;
  for (let r = 0; r < (spec.repeat ?? 1); r++) {
    const repeatGain = gain * Math.pow(spec.repeatDecay ?? 1, r);
    for (const voice of spec.voices) {
      const start = at + r * (spec.gap ?? 0) + (voice.delay ?? 0);
      const stop = start + voice.duration + 0.02;
      end = Math.max(end, stop);
      const amp = envelope(audio, start, voice, voice.gain * repeatGain);
      let source;
      if (voice.kind === 'noise') {
        source = audio.createBufferSource();
        source.buffer = whiteNoise(audio);
        source.start(start, Math.random() * 0.3);
      } else {
        source = audio.createOscillator();
        source.type = voice.wave;
        sweep(source.frequency, voice.freq, start, voice.duration);
        source.detune.value = (voice.detune ?? 0) + detune;
        if (voice.fm) {
          const mod = audio.createOscillator();
          const depth = audio.createGain();
          mod.frequency.value = voice.freq.from * voice.fm.ratio;
          depth.gain.setValueAtTime(voice.freq.from * voice.fm.index, start);
          depth.gain.exponentialRampToValueAtTime(1, start + voice.duration);
          mod.connect(depth).connect(source.frequency);
          mod.start(start);
          mod.stop(stop);
        }
        source.start(start);
      }
      source.stop(stop);
      let node = source;
      if (voice.filter) {
        const filter = audio.createBiquadFilter();
        filter.type = voice.filter.type;
        filter.Q.value = voice.filter.q ?? 1;
        sweep(filter.frequency, voice.filter.freq, start, voice.duration);
        node = node.connect(filter);
      }
      node = node.connect(amp);
      const position = Math.max(-1, Math.min(1, pan + (voice.pan ?? 0)));
      if (position !== 0 && typeof audio.createStereoPanner === 'function') {
        const panner = audio.createStereoPanner();
        panner.pan.value = position;
        node = node.connect(panner);
      }
      node.connect(output);
    }
  }
  return end;
}

/**
 * Which of the sounds of an interaction play: one at random (never the
 * `previous` one twice in a row when there is a choice), each in turn, or all
 * of them together.
 */
export function chooseSounds(list, mode, turn, random = Math.random, previous) {
  if (list.length === 0) return [];
  if (mode === 'layer') return [...list];
  if (mode === 'cycle') return [list[turn % list.length]];
  const pool = list.length > 1 && previous ? list.filter((id) => id !== previous) : list;
  return [pool[Math.floor(random() * pool.length) % pool.length]];
}

const notActivated = () =>
  typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.hasBeenActive;

/**
 * A player for `options` (see soundOptions in ./options.js). `Audio` is the
 * AudioContext class, replaceable in tests.
 */
export function createPlayer(options, { Audio = globalThis.AudioContext, random = Math.random } = {}) {
  let ctx = null;
  let bus = null;
  let current = options;
  let pan = 0;
  const turns = {};
  const last = {};

  const applyBus = () => {
    if (!ctx || !bus) return;
    const now = ctx.currentTime;
    bus.input.gain.setTargetAtTime(current.volume, now, 0.02);
    bus.shelf.gain.setTargetAtTime(TONE_SHELF[current.tone] ?? 0, now, 0.02);
    bus.wet.gain.setTargetAtTime(current.reverb * 0.9, now, 0.02);
  };

  const context = () => {
    if (!Audio) return null;
    // Before the first gesture a sound would only make the browser warn about autoplay.
    if (!ctx && notActivated()) return null;
    if (!ctx) {
      ctx = new Audio();
      bus = createBus(ctx, ctx.destination, { room: current.room });
      applyBus();
    }
    if (ctx.state === 'suspended') ctx.resume?.()?.catch?.(() => {});
    return ctx;
  };

  /** Plays one sound now, with the humanization of the settings. */
  const play = (id, gain = 1) => {
    const spec = SOUND_SPECS[id];
    const audio = spec && current.volume > 0 ? context() : null;
    if (!audio) return false;
    const spread = random() * 2 - 1;
    const cents = spread * current.pitch;
    const level = gain * (1 + (random() * 2 - 1) * 0.1 * Math.min(1, current.pitch / 15));
    playSpec(spec, audio, bus.input, { gain: level, detune: cents, pan: current.stereo ? pan * current.width : 0 });
    return true;
  };

  return {
    configure(next) {
      if (ctx && bus && next.room !== current.room) bus.convolver.buffer = roomImpulse(ctx, next.room);
      current = next;
      applyBus();
    },
    /** Where the pointer is, −1 (left) … 1 (right). */
    setPan(value) {
      pan = Math.max(-1, Math.min(1, value));
    },
    play,
    /** Plays the sounds of `event` (hover, activate…); returns the ids played. */
    trigger(event) {
      const list = current.effects[event] || [];
      const turn = turns[event] ?? 0;
      turns[event] = turn + 1;
      const chosen = chooseSounds(list, current.mode, turn, random, last[event]);
      if (chosen.length === 1) last[event] = chosen[0];
      // A stack of sounds shares the headroom, so it is not louder than one sound.
      const gain = (current.levels[event] ?? 1) / Math.sqrt(Math.max(1, chosen.length));
      return chosen.filter((id) => play(id, gain));
    },
    /** Cuts reverb tails when the tab is hidden; the next sound resumes. */
    suspend() {
      if (ctx?.state === 'running') ctx.suspend?.()?.catch?.(() => {});
    },
    close() {
      ctx?.close?.()?.catch?.(() => {});
      ctx = null;
      bus = null;
    },
  };
}
