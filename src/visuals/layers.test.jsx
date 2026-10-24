// The star layers and the beams of issue #15.
import { render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Cosmos, { beamsOptions, starsOptions, starsShown } from '../components/Cosmos';
import { DEFAULTS } from '../settings/schema';
import { STAR_KEYS, STAR_SHAPES } from '../settings/schema.layers';
import { resetSettings, setSettings } from '../settings/store';
import { BEAMS, lineFor, rgba, startBeams } from './beams';
import { rgbOf, startNebula } from './nebula';
import { drawShape, LAYER, MAX_STARS, seeded, starsFor, startStars, turnHue } from './stars';

/** A 2D context that accepts every call and records some of them. */
const recorder = () => {
  const calls = { images: 0, ops: new Set(), shadows: [], paths: 0 };
  const ctx = new Proxy(
    {
      drawImage: () => calls.images++,
      beginPath: () => calls.paths++,
      createRadialGradient: () => ({ addColorStop() {} }),
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get: (t, key) => (key in t ? t[key] : () => {}),
      set: (t, key, value) => {
        if (key === 'globalCompositeOperation') calls.ops.add(value);
        if (key === 'shadowColor') calls.shadows.push(value);
        t[key] = value;
        return true;
      },
    },
  );
  return { ctx, calls };
};
const canvasOf = (ctx, width = 1920, height = 1080) => ({
  getContext: () => ctx,
  clientWidth: width,
  clientHeight: height,
});
const sprites = () => {
  const made = [];
  const makeCanvas = (side) => {
    const sprite = { width: side, height: side, getContext: () => recorder().ctx };
    made.push(sprite);
    return sprite;
  };
  return { made, makeCanvas };
};

describe('star layers (issue #15)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('gives every layer of the settings all the options of a layer', () => {
    const { layers, fps } = starsOptions(DEFAULTS);
    expect(fps).toBe(30);
    expect(layers).toHaveLength(4);
    layers.forEach((layer) => expect(Object.keys(layer).sort()).toEqual(Object.keys(LAYER).sort()));
    expect(STAR_KEYS.sort()).toEqual(Object.keys(LAYER).sort());
    // Off by default, so the default page loads no code of them.
    expect(starsShown(DEFAULTS)).toBe(false);
    expect(starsShown({ ...DEFAULTS, 'stars3.on': true })).toBe(true);
  });

  it('spreads as many stars per area on every screen, at most MAX_STARS', () => {
    expect(starsFor(500, 1920 * 1080)).toBe(500);
    expect(starsFor(500, 360 * 800)).toBe(69);
    expect(starsFor(3000, 4 * 3840 * 2160)).toBe(MAX_STARS);
  });

  it('keeps the same stars for the same seed', () => {
    const a = seeded(42);
    const b = seeded(42);
    const values = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(values);
    values.forEach((v) => expect(v >= 0 && v < 1).toBe(true));
    expect(seeded(43)()).not.toBe(values[0]);
  });

  it('turns the hue of a colour', () => {
    expect(turnHue('#ff0000', 120)).toBe('hsl(120 100% 50%)');
    expect(turnHue('#ff0000', -120)).toBe('hsl(240 100% 50%)');
  });

  it('draws every shape of the settings', () => {
    STAR_SHAPES.forEach(({ value }) => {
      const { ctx, calls } = recorder();
      ctx.fillStyle = '#ffffff';
      drawShape(ctx, value, 6);
      // Every shape but the square is a path; the square is one rectangle.
      expect(calls.paths > 0 || value === 'square', value).toBe(true);
    });
  });

  it('draws only the layers that are on, with their blending and glow', () => {
    const { ctx, calls } = recorder();
    const { made, makeCanvas } = sprites();
    const layers = [
      { ...LAYER, count: 100, blend: 'screen', glow: 6, glowColor: '#ff00ff' },
      { ...LAYER, on: false, count: 300 },
    ];
    const stop = startStars(canvasOf(ctx), { animate: false, layers, makeCanvas });
    expect(stop.layers().map((layer) => layer.stars.length)).toEqual([100, 0]);
    expect(calls.images).toBe(100);
    expect(calls.ops.has('screen')).toBe(true);
    expect(made).toHaveLength(1);
    stop();
  });

  it('makes colour variants when the colour varies', () => {
    const { ctx } = recorder();
    const { made, makeCanvas } = sprites();
    startStars(canvasOf(ctx), { animate: false, layers: [{ ...LAYER, hueSpread: 60 }], makeCanvas });
    expect(made).toHaveLength(6);
  });

  it('keeps the stars and the sprites when an option that does not change them changes', () => {
    const { ctx } = recorder();
    const { made, makeCanvas } = sprites();
    const stop = startStars(canvasOf(ctx), { animate: false, layers: [{ ...LAYER }], makeCanvas });
    const [before] = stop.layers();
    stop.update({ layers: [{ ...LAYER, motion: 'drift', speed: 30, brightness: 0.5 }] });
    const [after] = stop.layers();
    expect(after.stars).toBe(before.stars);
    expect(after.sprites).toBe(before.sprites);
    expect(after.brightness).toBe(0.5);
    stop.update({ layers: [{ ...LAYER, shape: 'star5', count: 600 }] });
    expect(stop.layers()[0].sprites).not.toBe(before.sprites);
    expect(stop.layers()[0].stars).toHaveLength(600);
    expect(made).toHaveLength(2);
  });

  it('moves drifting and warping stars from frame to frame', () => {
    let tick = null;
    vi.stubGlobal('requestAnimationFrame', (callback) => ((tick = callback), 1));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { ctx } = recorder();
    const { makeCanvas } = sprites();
    const layers = [
      { ...LAYER, count: 50, motion: 'drift', direction: 0, speed: 100 },
      { ...LAYER, count: 50, motion: 'warp', speed: 100 },
    ];
    const stop = startStars(canvasOf(ctx), { layers, makeCanvas, fps: 60 });
    const [drift, warp] = stop.layers();
    const { x, y } = drift.stars[0];
    const z = warp.stars.map((s) => s.z);
    tick(1000);
    tick(1100);
    expect(drift.stars[0].x).not.toBe(x);
    // 0° is to the right: the stars move across only.
    expect(drift.stars[0].y).toBeCloseTo(y);
    expect(warp.stars.some((s, i) => s.z < z[i])).toBe(true);
    stop();
  });

  it('does nothing without Canvas 2D', () => {
    expect(startStars({ getContext: () => null })).toBeTypeOf('function');
  });
});

describe('beams on the grid lines (issue #15)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('takes the grid and every beam option from the settings', () => {
    const options = beamsOptions(DEFAULTS);
    expect(options).toMatchObject({ grid: 48, gridWidth: 1 });
    Object.keys(BEAMS)
      .filter((key) => key !== 'animate' && key !== 'fps')
      .forEach((key) => expect(options, key).toHaveProperty(key));
  });

  it('runs on grid lines when snapped and anywhere otherwise', () => {
    const random = seeded(3);
    Array.from({ length: 50 }, () => lineFor(1000, 48, true, random)).forEach((at) => {
      expect(at % 48).toBe(0);
      expect(at).toBeLessThanOrEqual(1000);
    });
    expect(Array.from({ length: 50 }, () => lineFor(1000, 48, false, random)).some((at) => at % 48)).toBe(true);
    expect(rgba('#7efcf6', 0.5)).toBe('rgba(126, 252, 246, 0.5)');
  });

  it('keeps the chosen number of beams going the chosen ways', () => {
    const { ctx } = recorder();
    const random = seeded(9);
    const stop = startBeams(canvasOf(ctx, 1000, 600), { animate: false, random, direction: 'vertical', count: 8 });
    expect(stop.beams()).toHaveLength(8);
    expect(stop.beams().every((beam) => beam.axis === 'y' && beam.at % 48 === 0)).toBe(true);
    stop.update({ direction: 'horizontal', count: 3 });
    expect(stop.beams().map((beam) => beam.axis)).toEqual(['x', 'x', 'x']);
    stop.update({ both: false, count: 12 });
    expect(stop.beams()).toHaveLength(12);
    expect(stop.beams().every((beam) => beam.sign === 1)).toBe(true);
  });

  it('starts a beam again after it has left the screen, after a pause', () => {
    let tick = null;
    vi.stubGlobal('requestAnimationFrame', (callback) => ((tick = callback), 1));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { ctx } = recorder();
    const stop = startBeams(canvasOf(ctx, 400, 300), {
      random: seeded(1),
      count: 1,
      both: false,
      direction: 'horizontal',
      pause: 0,
      speed: 1500,
      fps: 60,
    });
    const [beam] = stop.beams();
    const heads = [];
    for (let now = 1000; now < 3000; now += 100) {
      tick(now);
      heads.push(beam.head);
    }
    // The head runs to the right and jumps back to the left edge at least once.
    expect(heads.some((head, i) => i && head < heads[i - 1])).toBe(true);
    stop();
  });

  it('does nothing without Canvas 2D', () => {
    expect(startBeams({ getContext: () => null })).toBeTypeOf('function');
  });
});

describe('the background loads the code of a layer only when it is on (issue #15)', () => {
  afterEach(() => resetSettings(undefined, { save: false }));

  it('has no star or beam canvas by default and adds them when switched on', async () => {
    resetSettings(undefined, { save: false });
    const { container } = render(<Cosmos />);
    expect(container.querySelector('.cosmos__stars')).toBeNull();
    expect(container.querySelector('.cosmos__beams')).toBeNull();
    await act(async () => setSettings({ ...DEFAULTS, 'stars2.on': true, 'beams.on': true }, { save: false }));
    expect(container.querySelector('.cosmos__stars')).not.toBeNull();
    expect(container.querySelector('.cosmos__beams')).not.toBeNull();
    // The grid is between the stars and the beams.
    const order = [...container.querySelector('.cosmos').children].map((child) => child.className);
    expect(order.indexOf('cosmos__stars')).toBeLessThan(order.indexOf('cosmos__grid'));
    expect(order.indexOf('cosmos__grid')).toBeLessThan(order.indexOf('cosmos__beams'));
  });
});

describe('colours, size and zoom of the universe (issue #15)', () => {
  it('passes the colours of the gas and of the stars to the shader', () => {
    const colours = {};
    const gl = new Proxy(
      {
        getUniformLocation: (program, name) => name,
        uniform3f: (name, r, g, b) => (colours[name] = [r, g, b]),
      },
      { get: (t, key) => (key in t ? t[key] : () => true) },
    );
    const canvas = { getContext: () => gl, clientWidth: 400, clientHeight: 300 };
    const stop = startNebula(canvas, { animate: false, color1: '#ff0000', starColor: '#00ff00' });
    expect(colours.c1).toEqual([1, 0, 0]);
    expect(colours.starColor).toEqual([0, 1, 0]);
    stop.update({ color4: '#0000ff' });
    expect(colours.c4).toEqual([0, 0, 1]);
    expect(rgbOf('#808080').map((v) => v.toFixed(2))).toEqual(['0.50', '0.50', '0.50']);
    stop();
  });
});
