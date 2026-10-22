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
 * the chance `restart` per step.
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
    ctx.save();
    ctx.translate(x, row * cell());
    ctx.scale(cell() / SIZE, cell() / SIZE);
    ctx.shadowColor = o.glowColor;
    ctx.shadowBlur = glow;
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

  const frame = () => {
    move();
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

  let timer = null;
  const run = () => {
    clearInterval(timer);
    timer = o.animate ? setInterval(() => document.hidden || frame(), o.step) : null;
  };
  resize();
  const unwatch = watchSize(canvas, resize);
  run();
  const stop = () => {
    clearInterval(timer);
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
    if (o.step !== before.step) run();
  };
  return stop;
}
