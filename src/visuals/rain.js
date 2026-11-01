// "Digital rain" of link network symbols, after konard/twittermatrix:
// every column drops one symbol per step, the canvas slowly fades so the
// column leaves a trail, and a column restarts at a random moment after it
// leaves the screen. Unlike the original, the canvas stays transparent (it
// fades with destination-out), so the universe and the grid shine through.
//
// The symbols sit on the background grid: a symbol is half a grid cell wide,
// columns start at the grid lines, so every grid cell holds exactly two
// columns and two rows. The rain also drives the slow downward drift of the
// grid (`onDrift`), and the canvas drifts with it, so symbols and their
// trails never slide off the grid lines.
import { decode, randomCode } from '../links/configurations';
import { glyphPaths, SIZE } from '../links/glyph';
import { pixelRatio, watchSize } from './size';

const GLOW = '#f0fffb';
const CACHE_LIMIT = 4000;
/** The frame time assumed until the first frames are measured: 60 Hz. */
const FRAME_MS = 1000 / 60;
/** The id of the SVG filter that lowers every alpha of the rain by a few levels. */
export const FLOOR_ID = 'rain-alpha-floor';
/** How much alpha the cleanup takes away: 9 of 255 levels, more than the 6 the fading can never remove. */
export const FLOOR = 0.035;

/**
 * How many display frames make one step: `step` ms rounded to whole frames
 * (issue #47). A timer of its own lands steps 6 or 7 frames apart at 60 Hz
 * (105 ms is 6.3 frames) and, when the page is busy, two steps in one frame;
 * the rain then falls unevenly and flickers.
 */
export const framesPerStep = (step, frameMs = FRAME_MS) => Math.max(1, Math.round(step / frameMs));

/** The median of the measured frame gaps: one slow frame does not change the cadence. */
const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1];

/**
 * The SVG filter (added to the page once) that lowers every alpha by `FLOOR`.
 * The fading draws transparent black with destination-out at alpha f; in 8-bit
 * alpha round(a·(1 − f)) = a for every a < 0.5 / f, so for f = 0.075 the last
 * 6 levels of every symbol never fade and faint ghosts of old symbols pile up
 * (issue #47). Returns null where the canvas cannot use filters.
 */
function floorFilter(ctx) {
  if (!('filter' in ctx) || typeof document === 'undefined' || !document.body) return null;
  if (!document.getElementById(FLOOR_ID)) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="${FLOOR_ID}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1" intercept="-${FLOOR}"/></feComponentTransfer></filter>`;
    document.body.append(svg);
  }
  return `url(#${FLOOR_ID})`;
}

/** Opt-in trace of the cadence: `localStorage.setItem('rain.debug', '1')`. */
const tracing = () => {
  try {
    return localStorage.getItem('rain.debug') === '1';
  } catch {
    return false;
  }
};

/** The left edges of the symbol columns: two per grid cell, starting at the first grid line. */
export function columnsFor(width, grid = 64) {
  const cell = grid / 2;
  return Array.from({ length: Math.ceil(width / cell) }, (_, i) => i * cell);
}

/** Builds (and caches) one coloured Path2D per link of a network code. */
function pathsOf(code, cache) {
  let paths = cache.get(code);
  if (!paths) {
    if (cache.size >= CACHE_LIMIT) cache.clear();
    paths = glyphPaths(decode(code)).map(({ d, color }) => ({ path: new Path2D(d), color }));
    cache.set(code, paths);
  }
  return paths;
}

/**
 * The free space (CSS pixels) kept around a symbol inside its cell of `cell`
 * pixels: `padding`, but never so much that the symbol gets smaller than a
 * quarter of the cell.
 */
export const paddingFor = (cell, padding = 0) => Math.max(0, Math.min(padding, (cell * 3) / 8));

/** How far the grid has drifted down at time `now` (ms): 0 … grid, one cell per `period`. */
export const driftAt = (now, grid = 64, period = 24000) => (period ? ((now % period) / period) * grid : 0);

/** A random network code of minLinks…maxLinks links, optionally with only real references. */
export const pickerFor =
  ({ minLinks = 1, maxLinks = 4, real = false } = {}, random = Math.random) =>
  () => {
    const [low, high] = minLinks <= maxLinks ? [minLinks, maxLinks] : [maxLinks, minLinks];
    return randomCode(random, low + Math.floor(random() * (high - low + 1)), { real });
  };

/**
 * Starts the rain on `canvas`, which must be one grid cell taller than the
 * screen and start one cell above it. `grid` is the size of a background
 * grid cell in CSS pixels; every step the rain moves the canvas and calls
 * `onDrift(pixels)` so the grid moves along. `pick()` returns the next
 * network code (a random network of 1–4 links by default).
 *
 * Returns a function that stops the animation and removes listeners; its
 * `update(options)` changes any option except `animate` on the fly (the
 * settings page previews the rain this way). With `visible: false` the rain
 * only drifts the grid. Columns fall every 1…`speeds` steps; a share
 * `density` of them has rain; a column that left the screen starts again with
 * the chance `restart` per step. `padding` keeps free CSS pixels around every
 * symbol inside its cell.
 * Does nothing (and returns a no-op) where Canvas 2D or Path2D is missing.
 */
export function startRain(canvas, options = {}) {
  const o = {
    grid: 64,
    period: 24000,
    onDrift: () => {},
    step: 75,
    fade: 0.085,
    glow: 8,
    glowColor: GLOW,
    lineWidth: 5.5,
    padding: 0,
    speeds: 3,
    density: 1,
    restart: 0.05,
    visible: true,
    animate: true,
    random: Math.random,
    ...options,
  };
  if (!options.pick) o.pick = () => randomCode(o.random);
  const { random } = o;
  const noop = () => {};
  noop.update = noop;
  const ctx = typeof Path2D === 'undefined' ? null : canvas.getContext('2d');
  if (!ctx) return noop;
  const cache = new Map();
  let columns = [];
  let width = 0;
  let height = 0;
  let ratio = 0;
  let drift = 0;
  const cell = () => o.grid / 2;

  const draw = (code, x, row, glow) => {
    const pad = paddingFor(cell(), o.padding);
    const size = cell() - 2 * pad;
    ctx.save();
    ctx.translate(x + pad, row * cell() + pad);
    ctx.scale(size / SIZE, size / SIZE);
    ctx.shadowColor = o.glowColor;
    // The transform does not scale shadows, so the glow is given in device pixels.
    ctx.shadowBlur = glow * ratio;
    ctx.lineWidth = o.lineWidth;
    pathsOf(code, cache).forEach(({ path, color }) => {
      ctx.strokeStyle = color;
      ctx.stroke(path);
    });
    ctx.restore();
  };

  /** How often a column moves and whether it rains at all. */
  const pace = (column) => {
    // Columns move every 1–3 steps by default, so they fall at different speeds.
    column.every = 1 + Math.floor(random() * o.speeds);
    column.on = o.density >= 1 || random() < o.density;
    return column;
  };

  const resize = () => {
    const nextRatio = pixelRatio();
    const nextWidth = canvas.clientWidth || window.innerWidth;
    const nextHeight = canvas.clientHeight || window.innerHeight + o.grid;
    // ResizeObserver also reports the first size; redrawing then would only lose the picture.
    if (nextRatio === ratio && nextWidth === width && nextHeight === height) return;
    [ratio, width, height] = [nextRatio, nextWidth, nextHeight];
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const xs = columnsFor(width, o.grid);
    columns = xs.map((x) => pace({ x, row: -Math.floor(random() * (height / cell()) * 1.5), tick: 0, code: o.pick() }));
    if (!o.animate && o.visible) {
      // A still field of symbols for people who prefer reduced motion.
      for (let i = 0; i < (xs.length * height * o.density) / cell() / 5; i++) {
        ctx.globalAlpha = 0.2 + random() * 0.6;
        draw(o.pick(), xs[Math.floor(random() * xs.length)], Math.floor(random() * (height / cell())), 0);
      }
      ctx.globalAlpha = 1;
    }
  };

  /** Moves the canvas and the grid down; after a whole cell both jump back and the picture moves down instead. */
  const move = () => {
    const next = driftAt(Date.now(), o.grid, o.period);
    if (next < drift) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(canvas, 0, Math.round(o.grid * ratio));
      ctx.restore();
      columns.forEach((c) => (c.row += 2));
    }
    drift = next;
    canvas.style.transform = `translateY(${drift.toFixed(2)}px)`;
    o.onDrift(drift);
  };

  // Once a second of steps the whole picture loses a few alpha levels, so the ghosts the fading cannot remove go.
  // Canvases without filters (WebKit) clear the faint pixels by hand instead, one band of rows per step.
  const floor = floorFilter(ctx);
  const faint = Math.round(FLOOR * 255);
  let sinceFloor = 0;
  const clean = () => {
    const every = Math.max(1, Math.round(1000 / o.step));
    if (floor) {
      if (++sinceFloor < every) return;
      sinceFloor = 0;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'copy';
      ctx.filter = floor;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
      return;
    }
    if (typeof ctx.getImageData !== 'function' || !canvas.width || !canvas.height) return;
    const band = Math.ceil(canvas.height / every);
    const top = (sinceFloor++ % every) * band;
    const rows = Math.min(band, canvas.height - top);
    if (rows <= 0) return;
    const image = ctx.getImageData(0, top, canvas.width, rows);
    const data = image?.data;
    if (!data) return;
    let changed = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] && data[i] <= faint) {
        data[i] = 0;
        changed = true;
      }
    }
    if (changed) ctx.putImageData(image, 0, top);
  };

  const frame = () => {
    move();
    clean();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${o.visible ? o.fade : 1})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    if (!o.visible) return;
    columns.forEach((c) => {
      if (++c.tick % c.every) return;
      // The previous head loses its glow and becomes the trail, the new head glows.
      if (c.on && c.row >= 0) draw(c.code, c.x, c.row, 0);
      c.row += 1;
      c.code = o.pick();
      if (c.on && c.row >= 0) draw(c.code, c.x, c.row, o.glow);
      if (c.row * cell() > height && random() < o.restart) {
        c.row = -Math.floor(random() * 8);
        pace(c);
      }
    });
  };

  // Steps are counted in display frames, so they are always the same number of frames apart and never
  // two in one frame (issue #47). Hidden tabs get no frames, so the rain rests there by itself.
  let raf = 0;
  let last = 0;
  let frames = 0;
  let frameMs = FRAME_MS;
  const gaps = [];
  const trace = tracing() ? { since: 0, steps: 0, frames: 0 } : null;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const gap = last ? now - last : 0;
    last = now;
    // Gaps over 100 ms are a busy or hidden page, not the refresh rate of the screen.
    if (gap > 0 && gap < 100 && gaps.push(gap) >= 30) frameMs = median(gaps.splice(0));
    if (trace) trace.frames++;
    if (++frames < framesPerStep(o.step, frameMs)) return;
    frames = 0;
    frame();
    if (!trace) return;
    trace.steps++;
    if (now - trace.since < 1000) return;
    console.debug('[rain]', { frameMs: +frameMs.toFixed(2), framesPerStep: framesPerStep(o.step, frameMs), ...trace });
    Object.assign(trace, { since: now, steps: 0, frames: 0 });
  };
  let timer = null;
  const halt = () => {
    if (raf) cancelAnimationFrame(raf);
    clearInterval(timer);
    raf = 0;
    timer = null;
  };
  const run = () => {
    halt();
    if (!o.animate) return;
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
    else timer = setInterval(() => document.hidden || frame(), o.step);
  };
  resize();
  const unwatch = watchSize(canvas, resize);
  run();
  const stop = () => {
    halt();
    unwatch();
  };
  stop.update = (next) => {
    const before = { ...o };
    Object.assign(o, next, { animate: before.animate });
    if (o.grid !== before.grid || !o.animate) {
      // A new grid needs new columns; a still picture is drawn again with the new options.
      width = 0;
      resize();
    } else if (o.speeds !== before.speeds || o.density !== before.density) columns.forEach(pace);
    // The cadence follows o.step on the next frame by itself.
  };
  return stop;
}
