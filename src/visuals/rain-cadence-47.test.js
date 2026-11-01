import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLOOR, FLOOR_ID, framesPerStep, startRain } from './rain';

// Issue #47: "links network data rain is flickering or not drawn with equal intervals".
// The rain used to step on setInterval, which is not aligned with the display frames.

/** A display that calls the frame callbacks at `hz`, with optional extra delays (ms) for some frames. */
function display(hz, delays = {}) {
  let callbacks = [];
  let now = 0;
  let count = 0;
  vi.stubGlobal('requestAnimationFrame', (cb) => callbacks.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => (callbacks = []));
  return (frames) => {
    for (let i = 0; i < frames; i++) {
      now += 1000 / hz + (delays[count++] || 0);
      const due = callbacks;
      callbacks = [];
      due.forEach((cb) => cb(now));
    }
    return now;
  };
}

/** A canvas whose fades (one per rain step) are stamped with the frame they happen in. */
function rainCanvas(clock) {
  const steps = [];
  const filters = [];
  const ctx = new Proxy(
    {
      filter: 'none',
      fillRect() {
        if (this.globalCompositeOperation === 'destination-out') steps.push(clock());
      },
      drawImage() {
        filters.push(this.filter);
      },
    },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
  );
  return { canvas: { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} }, steps, filters };
}

describe('the rain steps on display frames (issue #47)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.getElementById(FLOOR_ID)?.remove();
  });

  it('rounds the step to whole frames', () => {
    expect(framesPerStep(105)).toBe(6);
    expect(framesPerStep(105, 1000 / 120)).toBe(13);
    expect(framesPerStep(105, 1000 / 144)).toBe(15);
    expect(framesPerStep(5)).toBe(1);
  });

  for (const [hz, frames] of [
    [60, 6],
    [120, 13],
  ]) {
    it(`keeps every step ${frames} frames apart at ${hz} Hz`, () => {
      vi.stubGlobal('Path2D', class {});
      let frame = 0;
      const advance = display(hz);
      const { canvas, steps } = rainCanvas(() => frame);
      const stop = startRain(canvas, { step: 105, random: () => 0.5 });
      for (; frame < 600; frame++) advance(1);
      stop();
      // The first 30 frames measure the refresh rate; after that the cadence is exact.
      const gaps = steps
        .filter((f) => f > 60)
        .slice(1)
        .map((f, i, all) => f - (i ? all[i - 1] : steps.filter((g) => g > 60)[0]));
      expect(gaps.length).toBeGreaterThan(30);
      expect(new Set(gaps)).toEqual(new Set([frames]));
    });
  }

  it('never takes two steps in one frame when the page is busy', () => {
    vi.stubGlobal('Path2D', class {});
    let frame = 0;
    const busy = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [40 + i * 7, 250]));
    const advance = display(60, busy);
    const { canvas, steps } = rainCanvas(() => frame);
    const stop = startRain(canvas, { step: 105, random: () => 0.5 });
    for (; frame < 400; frame++) advance(1);
    stop();
    expect(steps.length).toBeGreaterThan(40);
    expect(new Set(steps).size).toBe(steps.length);
  });

  it('stops asking for frames when stopped', () => {
    vi.stubGlobal('Path2D', class {});
    const advance = display(60);
    let frame = 0;
    const { canvas, steps } = rainCanvas(() => frame);
    const stop = startRain(canvas, { step: 105 });
    advance(12);
    stop();
    const taken = steps.length;
    advance(60);
    expect(steps.length).toBe(taken);
  });

  it('clears the faint alpha that 8-bit fading can never remove', () => {
    // destination-out at alpha 0.075 keeps round(a · 0.925) = a for every a ≤ 6.
    const stuck = Array.from({ length: 255 }, (_, a) => a).filter((a) => a && Math.round(a * (1 - 0.075)) === a);
    expect(Math.max(...stuck)).toBe(6);
    expect(FLOOR * 255).toBeGreaterThan(Math.max(...stuck));
    vi.stubGlobal('Path2D', class {});
    const advance = display(60);
    const { canvas, filters } = rainCanvas(() => 0);
    const stop = startRain(canvas, { step: 100, fade: 0.075, random: () => 0.5 });
    advance(6 * 25);
    stop();
    expect(filters.filter((f) => f === `url(#${FLOOR_ID})`).length).toBe(2);
    const fn = document.querySelector(`#${FLOOR_ID} feFuncA`);
    expect(fn.getAttribute('intercept')).toBe(`-${FLOOR}`);
  });

  it('clears the faint alpha by hand, one band of rows per step, where the canvas has no filters (WebKit)', () => {
    vi.stubGlobal('Path2D', class {});
    const advance = display(60);
    const bands = [];
    const ctx = new Proxy(
      {
        getImageData(x, y, w, h) {
          // Alpha 6 (a ghost), 200 (a symbol) and 0 (empty) in turn.
          const data = new Uint8ClampedArray(w * h * 4).map((_, i) => (i % 4 === 3 ? [6, 200, 0][(i >> 2) % 3] : 0));
          return { data, y, h };
        },
        putImageData(image, x, y) {
          bands.push({ y, h: image.h, alphas: new Set(image.data.filter((_, i) => i % 4 === 3)) });
        },
      },
      { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
    );
    const canvas = { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} };
    const stop = startRain(canvas, { step: 100, fade: 0.075, random: () => 0.5 });
    advance(6 * 10);
    stop();
    expect('filter' in ctx).toBe(false);
    expect(document.getElementById(FLOOR_ID)).toBeNull();
    // Ten steps a second, ten bands: the whole canvas is cleaned once a second.
    expect(bands.map((b) => b.y)).toEqual(Array.from({ length: 10 }, (_, i) => i * Math.ceil(canvas.height / 10)));
    expect(bands.reduce((sum, b) => sum + b.h, 0)).toBe(canvas.height);
    bands.forEach((b) => expect([...b.alphas].sort((x, y) => x - y)).toEqual([0, 200]));
  });
});
