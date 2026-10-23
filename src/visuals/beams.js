// Beams (issue #15): light that runs along the grid lines across or down the
// screen, as a comet with a tail, a segment, a bright pulse or a scan line over
// the whole screen. The canvas has the size and the drift of the grid (see
// Cosmos.jsx), so the beams stay on its lines. The code is loaded only when the
// beams are switched on.
import { pixelRatio, watchSize } from './size';

/** Default look; every option can be changed later with `stop.update(options)`. */
export const BEAMS = {
  animate: true,
  fps: 40,
  grid: 48,
  gridWidth: 1,
  direction: 'both',
  style: 'comet',
  count: 6,
  speed: 240,
  length: 160,
  width: 1.5,
  color: '#7efcf6',
  glow: 8,
  pause: 1.5,
  snap: true,
  both: true,
};

/** `#rrggbb` with an opacity, as `rgba()`. */
export const rgba = (hex, alpha) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(String(hex).slice(at, at + 2), 16) || 0);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** The place of a beam across its way: a grid line when snapped, anywhere otherwise. */
export const lineFor = (span, grid, snap, random) =>
  snap ? Math.floor(random() * (Math.floor(span / grid) + 1)) * grid : random() * span;

/**
 * Starts the beams on `canvas`; returns a stop function whose `update(options)`
 * changes any option of BEAMS except `animate`. Does nothing without Canvas 2D.
 */
export function startBeams(canvas, options = {}) {
  const o = { ...BEAMS, random: Math.random, ...options };
  const noop = () => {};
  noop.update = noop;
  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let beams = [];

  // A beam moves along `axis` ('x' across, 'y' down) on the line `at`.
  const spawn = (beam, first) => {
    const random = o.random;
    const axis = o.direction === 'both' ? (random() < 0.5 ? 'x' : 'y') : o.direction === 'vertical' ? 'y' : 'x';
    const way = axis === 'x' ? width : height;
    const sign = o.both && random() < 0.5 ? -1 : 1;
    Object.assign(beam, {
      axis,
      sign,
      at: lineFor(axis === 'x' ? height : width, o.grid, o.snap, random),
      // A still background shows the beams on their way; a moving one starts them off-screen, one after another.
      head: !o.animate ? random() * way : sign > 0 ? -o.length : way + o.length,
      pace: 0.75 + random() * 0.5,
      wait: o.animate ? o.pause * (first ? random() * 2 : 0.5 + random()) : 0,
    });
    return beam;
  };
  const fill = () => {
    beams = beams.slice(0, o.count);
    while (beams.length < o.count) beams.push(spawn({}, true));
  };

  const resize = () => {
    ratio = pixelRatio();
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    beams = [];
    fill();
  };

  const draw = (beam) => {
    if (beam.wait > 0) return;
    const across = beam.axis === 'x';
    const span = across ? height : width;
    const at = beam.at + o.gridWidth / 2;
    const tail = beam.head - beam.sign * (o.style === 'pulse' ? o.length / 4 : o.length);
    const point = (along, side) => (across ? [along, side] : [side, along]);
    ctx.shadowColor = o.color;
    // shadowBlur ignores the canvas transform, so it is given in device pixels.
    ctx.shadowBlur = o.glow * ratio;
    if (o.style === 'scan') {
      const [x0, y0] = point(tail, 0);
      const [x1, y1] = point(beam.head, 0);
      const band = ctx.createLinearGradient(x0, y0, x1, y1);
      band.addColorStop(0, rgba(o.color, 0));
      band.addColorStop(1, rgba(o.color, 0.18));
      ctx.fillStyle = band;
      const from = Math.min(beam.head, tail);
      const [x, y] = point(from, 0);
      const [w, h] = across ? [Math.abs(beam.head - tail), span] : [span, Math.abs(beam.head - tail)];
      ctx.shadowBlur = 0;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = o.glow * ratio;
      ctx.strokeStyle = rgba(o.color, 0.9);
      ctx.lineWidth = o.width;
      ctx.beginPath();
      ctx.moveTo(...point(beam.head, 0));
      ctx.lineTo(...point(beam.head, span));
      ctx.stroke();
      return;
    }
    const [x0, y0] = point(tail, at);
    const [x1, y1] = point(beam.head, at);
    if (o.style === 'line') {
      ctx.strokeStyle = rgba(o.color, 0.9);
    } else {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, rgba(o.color, 0));
      gradient.addColorStop(1, rgba(o.color, 1));
      ctx.strokeStyle = gradient;
    }
    ctx.lineWidth = o.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (o.style === 'pulse' || o.style === 'comet') {
      ctx.fillStyle = rgba('#ffffff', 0.9);
      ctx.beginPath();
      ctx.arc(x1, y1, o.width * (o.style === 'pulse' ? 1.8 : 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const render = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    beams.forEach(draw);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  };

  const move = (seconds) =>
    beams.forEach((beam) => {
      if (beam.wait > 0) {
        beam.wait -= seconds;
        return;
      }
      beam.head += beam.sign * o.speed * beam.pace * seconds;
      const way = beam.axis === 'x' ? width : height;
      if (beam.head < -o.length * 1.5 || beam.head > way + o.length * 1.5) spawn(beam, false);
    });

  let frame = 0;
  let last = 0;
  const loop = (now) => {
    frame = requestAnimationFrame(loop);
    if (document.hidden || now - last < 1000 / o.fps) return;
    const seconds = last ? Math.min(0.25, (now - last) / 1000) : 0;
    last = now;
    move(seconds);
    render();
  };
  const onResize = () => {
    resize();
    render();
  };
  resize();
  render();
  const unwatch = watchSize(canvas, onResize);
  if (o.animate) frame = requestAnimationFrame(loop);
  const stop = () => {
    cancelAnimationFrame(frame);
    unwatch();
  };
  stop.update = (next) => {
    const { direction, grid, snap, both } = o;
    Object.assign(o, next, { animate: o.animate });
    // A new way of running starts every beam again; other options apply to the running ones.
    if (o.direction !== direction || o.grid !== grid || o.snap !== snap || o.both !== both) beams = [];
    fill();
    render();
  };
  /** The beams as they are now, for tests. */
  stop.beams = () => beams;
  return stop;
}
