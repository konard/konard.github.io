// Renders every sound of src/sound/library.js through the real bus of
// src/sound/engine.js in Chromium's OfflineAudioContext (issue #15) and prints
// its peak and loudness, so a silent, clipping or much too loud patch shows.
//
//   node experiments/sound-render.mjs [out.json]
//
// Starts a Vite dev server itself; exits with 1 when a patch is silent or clips.
/* global OfflineAudioContext */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const out = process.argv[2];
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5199/');
const results = await page.evaluate(async () => {
  const { SOUND_SPECS } = await import('/src/sound/library.js');
  const { createBus, playSpec } = await import('/src/sound/engine.js');
  const rate = 44100;
  const render = async (play, seconds = 2) => {
    const audio = new OfflineAudioContext(2, rate * seconds, rate);
    const bus = createBus(audio, audio.destination, { room: 1.4 });
    bus.wet.gain.value = 0.2 * 0.9; // the default room echo
    play(audio, bus.input);
    const buffer = await audio.startRendering();
    let peak = 0;
    let sum = 0;
    let last = 0;
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const value = Math.abs(data[i]);
        peak = Math.max(peak, value);
        sum += data[i] * data[i];
        if (value > 1e-4) last = Math.max(last, i / rate);
      }
    }
    const rms = Math.sqrt(sum / (2 * buffer.length));
    return { peak: +peak.toFixed(4), rmsDb: +(20 * Math.log10(rms || 1e-9)).toFixed(1), tail: +last.toFixed(2) };
  };
  const rows = {};
  for (const [id, spec] of Object.entries(SOUND_SPECS)) {
    rows[id] = await render((audio, input) => playSpec(spec, audio, input, { at: 0.01 }));
  }
  // The loudest case: every sound at once, at the highest volume and level of the settings (200% × 200%).
  rows['(all together ×4)'] = await render((audio, input) => {
    for (const spec of Object.values(SOUND_SPECS)) playSpec(spec, audio, input, { at: 0.01, gain: 4 });
  });
  return rows;
});
await browser.close();
await server.close();

console.table(results);
if (out) writeFileSync(out, JSON.stringify(results, null, 2));
const bad = Object.entries(results).filter(([, row]) => row.peak < 0.002 || row.peak >= 1);
if (bad.length) {
  console.error('silent or clipping:', bad.map(([id]) => id).join(', '));
  process.exit(1);
}
