// The sounds of the interface (issue #15: "fully support sound design"),
// synthesized with the Web Audio API: no audio files, no requests. The first
// 26 patches are ported from konard/immortality (src/sound.ts, the Unlicense),
// whose sounds in turn follow Arwes bleeps, glitchy.website, Soul Extract and
// the ZKN app chain; the last five are new for this site (rain, links, glass,
// warp and bytes). Every patch is a few voices: oscillators with optional FM
// and filter sweeps, or filtered noise, with click-free envelopes.

/** A tone voice: `wave` sweeping from `from` to `to` Hz in `duration` seconds. */
const tone = (wave, from, to, duration, gain, extra = {}) => ({
  kind: 'tone',
  wave,
  freq: { from, to },
  duration,
  gain,
  ...extra,
});

/** A noise voice through a filter of `type` sweeping from `from` to `to` Hz. */
const noise = (type, from, to, duration, gain, { q = 1, ...extra } = {}) => ({
  kind: 'noise',
  filter: { type, freq: { from, to }, q },
  duration,
  gain,
  ...extra,
});

const lowpass = (from, to = from, q) => ({ type: 'lowpass', freq: { from, to }, ...(q ? { q } : {}) });

/**
 * Every patch: `voices`, and optionally `repeat` times `gap` seconds apart,
 * each repeat `repeatDecay` times quieter.
 */
export const SOUND_SPECS = {
  quartz: { voices: [tone('sine', 1400, 1250, 0.05, 0.016), tone('sine', 3860, 3500, 0.03, 0.004)] },
  cobalt: {
    voices: [
      tone('square', 880, 590, 0.09, 0.024, { filter: lowpass(4200, 1600, 0.7) }),
      tone('sine', 440, 295, 0.09, 0.014),
    ],
  },
  comet: {
    voices: [tone('triangle', 440, 1180, 0.16, 0.04), tone('sine', 880, 2360, 0.12, 0.007, { delay: 0.02 })],
  },
  ion: { voices: [tone('sine', 980, 940, 0.028, 0.014)] },
  halo: { voices: [tone('sine', 520, 420, 0.09, 0.02), tone('sine', 1040, 840, 0.06, 0.005)] },
  tide: { voices: [tone('sine', 220, 440, 0.16, 0.026), tone('triangle', 110, 220, 0.16, 0.01)] },
  mica: {
    repeat: 4,
    gap: 0.05,
    voices: [
      tone('square', 1900, 1700, 0.018, 0.008, { attack: 0.002, filter: lowpass(5200, 5200, 0.7) }),
      noise('highpass', 4200, 4200, 0.01, 0.012, { attack: 0.001 }),
    ],
  },
  nova: {
    repeat: 2,
    gap: 0.12,
    voices: [
      tone('sawtooth', 180, 920, 0.32, 0.02, { filter: lowpass(700, 5200, 4) }),
      tone('sine', 360, 1840, 0.28, 0.008),
    ],
  },
  zephyr: {
    voices: [
      noise('bandpass', 600, 3200, 0.24, 0.05, { attack: 0.06, q: 1.2 }),
      tone('triangle', 300, 760, 0.14, 0.016, { delay: 0.04 }),
    ],
  },
  ember: { voices: [noise('bandpass', 2400, 2400, 0.12, 0.05, { q: 0.8 })] },
  prism: {
    voices: [
      tone('sine', 1320, 1320, 0.6, 0.022, { fm: { ratio: 3.5, index: 2.4 } }),
      tone('sine', 2640, 2640, 0.3, 0.005, { delay: 0.01 }),
    ],
  },
  glacier: {
    voices: [
      tone('sine', 1568, 1568, 0.14, 0.02),
      tone('sine', 2093, 2093, 0.3, 0.02, { delay: 0.07 }),
      tone('triangle', 4186, 4186, 0.12, 0.003, { delay: 0.07 }),
    ],
  },
  pulsar: {
    voices: [
      tone('sine', 140, 45, 0.24, 0.08, { attack: 0.002 }),
      noise('highpass', 3000, 3000, 0.008, 0.02, { attack: 0.001 }),
    ],
  },
  orbit: {
    voices: [
      tone('square', 1200, 1180, 0.04, 0.01, { pan: -0.7, filter: lowpass(4000) }),
      tone('square', 1500, 1480, 0.04, 0.009, { pan: 0.7, delay: 0.08, filter: lowpass(4000) }),
      tone('square', 1800, 1780, 0.04, 0.007, { pan: -0.3, delay: 0.16, filter: lowpass(4000) }),
    ],
  },
  vapor: { voices: [noise('bandpass', 3200, 480, 0.26, 0.045, { attack: 0.02, q: 1.5 })] },
  cinder: {
    repeat: 5,
    gap: 0.032,
    voices: [noise('bandpass', 5200, 4800, 0.014, 0.03, { attack: 0.001, q: 3 })],
  },
  tungsten: {
    voices: [
      tone('sine', 800, 800, 0.42, 0.012, { attack: 0.001 }),
      tone('sine', 1856, 1856, 0.3, 0.008, { attack: 0.001 }),
      tone('sine', 3400, 3400, 0.2, 0.005, { attack: 0.001 }),
      tone('sine', 5304, 5304, 0.12, 0.003, { attack: 0.001 }),
    ],
  },
  helix: {
    voices: [
      tone('triangle', 880, 880, 0.12, 0.016),
      tone('triangle', 1109, 1109, 0.12, 0.016, { delay: 0.05 }),
      tone('triangle', 1319, 1319, 0.26, 0.016, { delay: 0.1 }),
    ],
  },
  drift: {
    voices: [
      tone('sawtooth', 660, 440, 0.26, 0.011, { detune: -12, filter: lowpass(2400, 900) }),
      tone('sawtooth', 660, 440, 0.26, 0.011, { detune: 12, filter: lowpass(2400, 900) }),
    ],
  },
  basalt: {
    voices: [
      tone('sine', 190, 118, 0.1, 0.06, { attack: 0.002 }),
      noise('bandpass', 900, 700, 0.025, 0.03, { attack: 0.001, q: 4 }),
    ],
  },
  flint: {
    voices: [
      noise('highpass', 2600, 2600, 0.007, 0.04, { attack: 0.001 }),
      noise('highpass', 2000, 2000, 0.006, 0.02, { attack: 0.001, delay: 0.035 }),
      tone('square', 2400, 2300, 0.01, 0.005, { attack: 0.001 }),
    ],
  },
  opal: {
    voices: [
      tone('sine', 784, 784, 0.36, 0.04, { attack: 0.002 }),
      tone('sine', 3136, 3136, 0.06, 0.01, { attack: 0.001 }),
      tone('sine', 7840, 7840, 0.02, 0.003, { attack: 0.001 }),
    ],
  },
  lumen: {
    voices: [
      tone('sine', 1047, 1047, 0.5, 0.02),
      tone('sine', 1319, 1319, 0.5, 0.018, { delay: 0.06 }),
      tone('triangle', 2093, 2093, 0.2, 0.004),
    ],
  },
  sonar: {
    repeat: 3,
    gap: 0.2,
    repeatDecay: 0.42,
    voices: [tone('sine', 1500, 1480, 0.32, 0.028, { fm: { ratio: 1.01, index: 0.3 } })],
  },
  vesper: {
    voices: [
      tone('sawtooth', 330, 330, 0.75, 0.011, { attack: 0.25, detune: -7, filter: lowpass(900, 2200, 1.2) }),
      tone('sawtooth', 495, 495, 0.75, 0.009, { attack: 0.25, detune: 7, filter: lowpass(900, 2200, 1.2) }),
    ],
  },
  relay: {
    voices: [
      tone('square', 3000, 2000, 0.008, 0.014, { attack: 0.001 }),
      tone('square', 2600, 1800, 0.008, 0.012, { attack: 0.001, delay: 0.022 }),
      noise('bandpass', 1800, 1800, 0.012, 0.02, { attack: 0.001, q: 2 }),
    ],
  },
  // New for this site.
  raindrop: {
    // A drop of the link rain: a quick upward blip with a wet tail.
    voices: [
      tone('sine', 620, 1650, 0.07, 0.03, { attack: 0.002 }),
      tone('sine', 1650, 1400, 0.09, 0.006, { delay: 0.05 }),
    ],
  },
  link: {
    // Two notes a fifth apart that join: a link from a reference to a reference.
    voices: [
      tone('triangle', 660, 660, 0.14, 0.018),
      tone('triangle', 990, 990, 0.22, 0.016, { delay: 0.06 }),
      tone('sine', 1320, 1320, 0.16, 0.004, { delay: 0.06 }),
    ],
  },
  glass: {
    // A tap on a glass panel: inharmonic partials that ring briefly.
    voices: [
      tone('sine', 2350, 2350, 0.18, 0.012, { attack: 0.001 }),
      tone('sine', 3910, 3910, 0.12, 0.006, { attack: 0.001 }),
      tone('sine', 6120, 6120, 0.06, 0.003, { attack: 0.001 }),
      noise('highpass', 6000, 6000, 0.006, 0.01, { attack: 0.001 }),
    ],
  },
  warp: {
    // A jump to warp: a falling sweep over rising air.
    voices: [
      tone('sawtooth', 1600, 120, 0.42, 0.012, { filter: lowpass(5000, 600, 2) }),
      noise('bandpass', 400, 4800, 0.36, 0.03, { attack: 0.08, q: 2 }),
    ],
  },
  byte: {
    // Eight quick bits of a byte.
    repeat: 8,
    gap: 0.022,
    repeatDecay: 0.88,
    voices: [tone('square', 1760, 1760, 0.012, 0.007, { attack: 0.001, filter: lowpass(3600) })],
  },
};
