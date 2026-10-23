// Renders single voices of one patch (issue #15) to find which one is loud.
//   node experiments/sound-isolate.mjs mica
/* global OfflineAudioContext */
import { chromium } from 'playwright';
import { createServer } from 'vite';

const id = process.argv[2] || 'mica';
const server = await createServer({ server: { port: 5198, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5198/');
console.log(
  await page.evaluate(async (id) => {
    const { SOUND_SPECS } = await import('/src/sound/library.js');
    const { playSpec } = await import('/src/sound/engine.js');
    const spec = SOUND_SPECS[id];
    const peak = async (variant) => {
      const audio = new OfflineAudioContext(1, 44100, 44100);
      playSpec(variant, audio, audio.destination, { at: 0.01 });
      const data = (await audio.startRendering()).getChannelData(0);
      let p = 0,
        at = 0;
      for (let i = 0; i < data.length; i++) if (Math.abs(data[i]) > p) ((p = Math.abs(data[i])), (at = i / 44100));
      return { peak: +p.toFixed(4), at: +at.toFixed(4) };
    };
    const rows = { whole: await peak(spec) };
    for (const [i, voice] of spec.voices.entries()) {
      rows[`voice ${i}`] = await peak({ ...spec, voices: [voice] });
      rows[`voice ${i} once`] = await peak({ voices: [voice] });
    }
    return JSON.stringify({ spec, rows }, null, 1);
  }, id),
);
await browser.close();
await server.close();
