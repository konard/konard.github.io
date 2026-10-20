// "Digital rain" of link configuration symbols, after konard/twittermatrix:
// every column drops one symbol per step, the canvas slowly fades so the
// column leaves a trail, and a column restarts at a random moment after it
// leaves the screen. Unlike the original, the canvas stays transparent (it
// fades with destination-out), so the universe and the grid shine through.
import { decode } from '../links/configurations';
import { glyphPaths, SIZE } from '../links/glyph';

const HEAD = '#f0fffb';
const TRAIL = ['#2ee6b0', '#22d3ee', '#7dd3fc', '#a78bfa'];

/** Builds (and caches) Path2D objects of a configuration code. */
function pathsOf(code, cache) {
  let paths = cache.get(code);
  if (!paths) {
    const { stroke, dots } = glyphPaths(decode(code));
    const fill = new Path2D();
    dots.forEach(([x, y]) => {
      fill.moveTo(x + 4.2, y);
      fill.arc(x, y, 4.2, 0, Math.PI * 2);
    });
    paths = { stroke: new Path2D(stroke), fill };
    cache.set(code, paths);
  }
  return paths;
}

/**
 * Starts the rain on `canvas`. `codes` is a list of configuration codes.
 * Returns a function that stops the animation and removes listeners.
 * Does nothing (and returns a no-op) where Canvas 2D or Path2D is missing.
 */
export function startRain(canvas, { codes, cell = 34, step = 75, fade = 0.085, animate = true, random = Math.random }) {
  const ctx = typeof Path2D === 'undefined' ? null : canvas.getContext('2d');
  if (!ctx || !codes.length) return () => {};
  const cache = new Map();
  const pick = () => codes[Math.floor(random() * codes.length)];
  let columns = [];
  let width = 0;
  let height = 0;

  const draw = (code, x, y, color, glow) => {
    const { stroke, fill } = pathsOf(code, cache);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(cell / SIZE, cell / SIZE);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.stroke(stroke);
    ctx.fill(fill);
    ctx.restore();
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const count = Math.ceil(width / cell);
    columns = Array.from({ length: count }, () => ({
      row: -Math.floor(random() * (height / cell) * 1.5),
      // Columns move every 1–3 steps, so they fall at different speeds.
      every: 1 + Math.floor(random() * 3),
      tick: 0,
      code: pick(),
      color: TRAIL[Math.floor(random() * TRAIL.length)],
    }));
    if (!animate) {
      // A still field of symbols for people who prefer reduced motion.
      for (let i = 0; i < (count * height) / cell / 5; i++) {
        ctx.globalAlpha = 0.2 + random() * 0.6;
        const x = Math.floor(random() * count) * cell;
        const y = Math.floor(random() * (height / cell)) * cell;
        draw(pick(), x, y, TRAIL[i % TRAIL.length], 0);
      }
      ctx.globalAlpha = 1;
    }
  };

  const frame = () => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    columns.forEach((c, i) => {
      if (++c.tick % c.every) return;
      const x = i * cell;
      // The previous head turns into the trail colour, the new head glows.
      if (c.row >= 0) draw(c.code, x, c.row * cell, c.color, 0);
      c.row += 1;
      c.code = pick();
      if (c.row >= 0) draw(c.code, x, c.row * cell, HEAD, 8);
      if (c.row * cell > height && random() > 0.95) c.row = -Math.floor(random() * 8);
    });
  };

  resize();
  window.addEventListener('resize', resize);
  const timer = animate ? setInterval(() => document.hidden || frame(), step) : null;
  return () => {
    clearInterval(timer);
    window.removeEventListener('resize', resize);
  };
}
