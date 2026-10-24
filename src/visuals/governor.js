// Keeps a background layer from making the page stutter on a slow device
// (issue #15: "make sure our site loads fast on mobile devices with these
// default settings"). The settings give the best quality a layer may use; the
// governor watches the gaps between animation frames and, while most of them
// are slow, lowers the quality step by step: first the resolution, then the
// frames per second. It never goes above the settings and does not come back
// up, so a layer does not flicker between two sizes.

/** A frame gap above this (ms) is slow: the page runs below about 22 frames per second. */
export const SLOW_GAP = 45;
/** Frames are judged together every 30 frames or every second, whichever comes first. */
export const WINDOW = 30;
export const WINDOW_MS = 1000;
/** The lowest share of the set resolution and of the set frames per second. */
export const MIN_SCALE = 0.4;
export const MIN_FPS = 0.25;

/**
 * Returns `watch(gap)`: call it with the time since the previous animation
 * frame; it returns true when `scale` or `fps` (shares of the settings, from 1
 * down) have just been lowered, so the layer can resize. Layers of sharp
 * sprites pass `{ resolution: false }` and only lower their frames per second.
 */
export function governor({ resolution = true } = {}) {
  const state = { scale: 1, fps: 1 };
  let seen = 0;
  let slow = 0;
  let spent = 0;
  // The first window is the start of the page (scripts, fonts, layout): not judged.
  let warm = false;
  const watch = (gap) => {
    // A long gap is a hidden tab or a pause of the debugger, not a slow frame.
    if (!(gap > 0) || gap > 1000) return false;
    seen++;
    spent += gap;
    if (gap > SLOW_GAP) slow++;
    if (seen < WINDOW && spent < WINDOW_MS) return false;
    const struggling = slow > seen / 2;
    seen = 0;
    slow = 0;
    spent = 0;
    if (!warm) {
      warm = true;
      return false;
    }
    if (!struggling) return false;
    if (resolution && state.scale > MIN_SCALE)
      state.scale = Math.max(MIN_SCALE, Number((state.scale * 0.7).toFixed(3)));
    else if (state.fps > MIN_FPS) state.fps = Math.max(MIN_FPS, state.fps / 2);
    else return false;
    return true;
  };
  watch.state = state;
  return watch;
}
