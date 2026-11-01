/* global window, document, requestAnimationFrame, CanvasRenderingContext2D -- page code run by Playwright */
// Measures when the links-network rain steps relative to the display frames (issue #47, C4).
// Usage: node experiments/issue-47-rain-cadence.mjs [base-url] [seconds] [cpu-load-ms]
// A rain step is detected by its destination-out fade; frames are requestAnimationFrame callbacks.
// cpu-load-ms adds a busy task of that length every 50 ms to imitate a loaded main thread.
import * as playwright from 'playwright';

const base = process.argv[2] || 'http://localhost:4173';
const seconds = Number(process.argv[3] || 6);
const load = Number(process.argv[4] || 0);
const browser = await playwright[process.env.BROWSER || 'chromium'].launch({
  args: (process.env.CHROME_ARGS || '').split(' ').filter(Boolean),
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('crash', () => console.error('page crashed'));
page.on('pageerror', (e) => console.error('page error', e.message));
await page.addInitScript((load) => {
  window.__steps = [];
  window.__frames = [];
  const fill = CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect = function (...args) {
    if (this.globalCompositeOperation === 'destination-out' && this.canvas.classList.contains('cosmos__rain'))
      window.__steps.push(performance.now());
    return fill.apply(this, args);
  };
  const tick = (t) => {
    window.__frames.push(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  if (load)
    setInterval(() => {
      const end = performance.now() + load;
      while (performance.now() < end);
    }, 50);
}, load);
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__steps.length = 0;
  window.__frames.length = 0;
});
await page.waitForTimeout(seconds * 1000);
const { steps, frames, residue } = await page.evaluate(() => {
  const c = document.querySelector('.cosmos__rain');
  const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let faint = 0;
  let lit = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]) lit++;
    if (data[i] && data[i] <= 8) faint++;
  }
  return { steps: window.__steps, frames: window.__frames, residue: { lit, faint, pixels: data.length / 4 } };
});
await browser.close();

// The frame each step was presented in: the first frame callback after the step.
const frameOf = (t) => frames.findIndex((f) => f >= t);
const gaps = frames.slice(1).map((f, i) => f - frames[i]);
const frameMs = gaps.sort((a, b) => a - b)[gaps.length >> 1];
const presented = steps.map(frameOf).filter((i) => i >= 0);
const between = presented.slice(1).map((f, i) => f - presented[i]);
const histogram = {};
for (const n of between) histogram[n] = (histogram[n] || 0) + 1;
const intervals = steps.slice(1).map((t, i) => t - steps[i]);
const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
const sd = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length);
console.log(
  JSON.stringify(
    {
      base,
      seconds,
      load,
      frameMs: +frameMs.toFixed(2),
      steps: steps.length,
      frames: frames.length,
      stepMs: {
        mean: +mean.toFixed(1),
        sd: +sd.toFixed(1),
        min: +Math.min(...intervals).toFixed(1),
        max: +Math.max(...intervals).toFixed(1),
      },
      framesBetweenSteps: histogram,
      // Share of steps whose distance differs from the most common one.
      unevenShare: +(
        between.filter((n) => n !== +Object.entries(histogram).sort((a, b) => b[1] - a[1])[0][0]).length /
        between.length
      ).toFixed(3),
      doubleStepFrames: between.filter((n) => n === 0).length,
      residue,
    },
    null,
    1,
  ),
);
