// The governor of the background layers (issue #15: fast on mobile with the default settings).
import { describe, expect, it } from 'vitest';
import { MIN_FPS, MIN_SCALE, WINDOW, governor } from './governor';

/** Feeds `count` frame gaps of `gap` ms and returns how many times the quality was lowered. */
const feed = (watch, gap, count = WINDOW) => {
  let lowered = 0;
  for (let i = 0; i < count; i++) if (watch(gap)) lowered++;
  return lowered;
};

describe('governor of a background layer', () => {
  it('keeps the quality of the settings while frames are fast', () => {
    const watch = governor();
    expect(feed(watch, 16.7, WINDOW * 20)).toBe(0);
    expect(watch.state).toEqual({ scale: 1, fps: 1 });
  });

  it('does not judge the start of the page', () => {
    const watch = governor();
    expect(feed(watch, 200, 5)).toBe(0);
    expect(watch.state).toEqual({ scale: 1, fps: 1 });
  });

  it('lowers the resolution, then the frames per second, down to a floor, while most frames are slow', () => {
    const watch = governor();
    feed(watch, 16.7);
    // Slow frames: judged every second, so 20 frames of 60 ms make a window.
    expect(feed(watch, 60, 20)).toBe(1);
    expect(watch.state).toEqual({ scale: 0.7, fps: 1 });
    feed(watch, 60, 20 * 20);
    expect(watch.state).toEqual({ scale: MIN_SCALE, fps: MIN_FPS });
    // It does not come back up, so the layer does not flicker between two sizes.
    feed(watch, 16.7, WINDOW * 10);
    expect(watch.state).toEqual({ scale: MIN_SCALE, fps: MIN_FPS });
  });

  it('ignores a few slow frames, hidden tabs and the first frame', () => {
    const watch = governor();
    feed(watch, 16.7);
    for (let i = 0; i < 10; i++) {
      expect(watch(5000)).toBe(false);
      expect(watch(0)).toBe(false);
      feed(watch, 16.7, 20);
      feed(watch, 80, 3);
    }
    expect(watch.state).toEqual({ scale: 1, fps: 1 });
  });

  it('only lowers the frames per second of a layer of sharp sprites', () => {
    const watch = governor({ resolution: false });
    feed(watch, 16.7);
    feed(watch, 60, 20 * 3);
    expect(watch.state).toEqual({ scale: 1, fps: MIN_FPS });
  });
});
