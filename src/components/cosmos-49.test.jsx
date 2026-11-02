import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applySettings } from '../settings/apply';
import { CSS_RULES, DEFAULTS } from '../settings/schema';
import { resetSettings, setSettings } from '../settings/store';
import { startRain } from '../visuals/rain';
import Cosmos, { optionsKey } from './Cosmos';

// Issue #49: "turning animation on and off should be faster", "changing the
// border should not cause background redraw", "start/stop should not
// re-render anything, just stop or continue animation on next frame".

/** A layer that counts what it is asked to do. */
const layer = () => {
  const stop = vi.fn();
  stop.update = vi.fn();
  stop.animate = vi.fn();
  return stop;
};
const layers = vi.hoisted(() => ({ nebula: [], rain: [] }));

vi.mock('../visuals/nebula', async (original) => ({
  ...(await original()),
  startNebula: vi.fn(() => {
    const run = layer();
    layers.nebula.push(run);
    return run;
  }),
}));
vi.mock('../visuals/rain', async (original) => {
  const real = await original();
  return {
    ...real,
    startRain: vi.fn((canvas, options) => {
      // The unit tests of the rain below use the real one.
      if (options?.unmocked) return real.startRain(canvas, options);
      const run = layer();
      layers.rain.push(run);
      return run;
    }),
  };
});

describe('the background on settings changes (issue #49)', () => {
  beforeEach(() => {
    layers.nebula.length = 0;
    layers.rain.length = 0;
    act(() => setSettings({ 'motion.mode': 'off', 'nebula.on': true }, { save: false }));
  });
  afterEach(() => act(() => resetSettings(undefined, { save: false })));

  it('stops and starts the motion of the running layers without starting them again', () => {
    render(<Cosmos />);
    expect([layers.nebula.length, layers.rain.length]).toEqual([1, 1]);
    const [nebula] = layers.nebula;
    const [rain] = layers.rain;

    act(() => setSettings({ 'motion.mode': 'on' }, { save: false }));
    act(() => setSettings({ 'motion.mode': 'off' }, { save: false }));
    act(() => setSettings({ 'motion.mode': 'on' }, { save: false }));
    // The same layers, never stopped: no shader is compiled and nothing is laid out again.
    expect([layers.nebula.length, layers.rain.length]).toEqual([1, 1]);
    expect(nebula).not.toHaveBeenCalled();
    expect(rain).not.toHaveBeenCalled();
    expect(nebula.animate.mock.calls).toEqual([[true], [false], [true]]);
    expect(rain.animate.mock.calls).toEqual([[true], [false], [true]]);
    // The universe does not read the motion; the rain only hears its new drift period.
    expect(nebula.update).not.toHaveBeenCalled();
  });

  it('does not touch the background for a border or any setting no layer reads', () => {
    render(<Cosmos />);
    const [nebula] = layers.nebula;
    const [rain] = layers.rain;
    act(() =>
      setSettings(
        {
          'corner.buttonTlSize': 12,
          'corner.buttonEdgeStyle': 'solid',
          'corner.menuEdges': 'line',
          'ui.accent': '#ff0000',
          'skin.name': 'glass',
        },
        { save: false },
      ),
    );
    expect(nebula.update).not.toHaveBeenCalled();
    expect(rain.update).not.toHaveBeenCalled();

    // A setting of one layer is sent to that layer only.
    act(() => setSettings({ 'nebula.gas': 1.5 }, { save: false }));
    expect(nebula.update).toHaveBeenCalledTimes(1);
    expect(rain.update).not.toHaveBeenCalled();
  });

  it('describes the options of a layer as text, with the same picker as the same text', () => {
    const pick = Object.assign(() => '', { key: '1 4 false' });
    expect(optionsKey({ pick, grid: 64 })).toBe('{"pick":"1 4 false","grid":64}');
    expect(optionsKey({ pick: () => '' })).toBe('{"pick":"function"}');
  });
});

describe('the rain stops and starts without drawing again (issue #49)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const recorder = () => {
    const calls = { moves: 0, clears: 0 };
    const ctx = new Proxy(
      { translate: () => calls.moves++, clearRect: () => calls.clears++ },
      { get: (t, key) => (key in t ? t[key] : () => {}), set: (t, key, value) => ((t[key] = value), true) },
    );
    return { ctx, calls };
  };
  const rainOn = (options) => {
    vi.stubGlobal('Path2D', class {});
    const { ctx, calls } = recorder();
    const canvas = { getContext: () => ctx, clientWidth: 320, clientHeight: 400, style: {} };
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return { calls, stop: startRain(canvas, { random, unmocked: true, ...options }) };
  };

  it('stops on the next frame and goes on from there, drawing nothing in between', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'performance'] });
    const { calls, stop } = rainOn({ animate: true });
    vi.advanceTimersByTime(2000);
    const drawn = calls.moves;
    expect(drawn).toBeGreaterThan(0);
    const cleared = calls.clears;
    stop.animate(false);
    vi.advanceTimersByTime(2000);
    // Nothing drawn and nothing cleared: the picture stays as it was.
    expect([calls.moves, calls.clears]).toEqual([drawn, cleared]);
    stop.animate(true);
    expect([calls.moves, calls.clears]).toEqual([drawn, cleared]);
    vi.advanceTimersByTime(2000);
    expect(calls.moves).toBeGreaterThan(drawn);
    expect(calls.clears).toBe(cleared);
    stop();
  });

  it('keeps a still picture when an option it does not show changes', () => {
    const { calls, stop } = rainOn({ animate: false });
    const drawn = calls.moves;
    expect(drawn).toBeGreaterThan(0);
    stop.update({ step: 300, fade: 0.3, speeds: 3, restart: 0.5, period: 0 });
    expect(calls.moves).toBe(drawn);
    // What it shows is drawn again.
    stop.update({ lineWidth: 2 });
    expect(calls.moves).toBeGreaterThan(drawn);
    stop();
  });
});

describe('the settings on the page (issue #49)', () => {
  it('writes only the settings that changed', () => {
    const root = document.createElement('html');
    applySettings(root, CSS_RULES, DEFAULTS);
    const setProperty = vi.spyOn(root.style, 'setProperty');
    const setAttribute = vi.spyOn(root, 'setAttribute');
    const next = { ...DEFAULTS, 'corner.buttonTlSize': 12, 'corner.buttonEdgeStyle': 'solid' };
    applySettings(root, CSS_RULES, next, DEFAULTS);
    expect(setProperty.mock.calls).toEqual([['--corner-button-tl-size', '12px']]);
    expect(setAttribute.mock.calls).toEqual([['data-corner-button-edge-style', 'solid']]);
    // The same result as writing everything again.
    const fresh = document.createElement('html');
    applySettings(fresh, CSS_RULES, next);
    expect(root.style.cssText).toBe(fresh.style.cssText);
    expect([...root.attributes].map((a) => `${a.name}=${a.value}`).sort()).toEqual(
      [...fresh.attributes].map((a) => `${a.name}=${a.value}`).sort(),
    );
  });
});
