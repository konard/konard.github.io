// Layers of stars over the universe (issue #15), drawn with Canvas 2D. Every
// layer has its own shape, size, colours, glow, twinkling and motion: still,
// drifting in one direction, flying towards the viewer (warp) or turning round
// the centre of the screen. A star is a sprite drawn once per layer and colour
// (with its glow) and then only copied, scaled, turned and stretched, so even
// thousands of stars cost little. The code is loaded only when a layer is on.
import { pixelRatio, watchSize } from './size';

/** A layer as in the settings (src/settings/schema.layers.js); every option can be changed later. */
export const LAYER = {
  on: true,
  count: 300,
  shape: 'dot',
  size: 1.5,
  sizeSpread: 0.5,
  color: '#ffffff',
  hueSpread: 0,
  brightness: 0.9,
  glow: 0,
  glowColor: '#7efcf6',
  twinkle: 1,
  twinkleDepth: 0.5,
  rotation: 0,
  spin: 0,
  motion: 'still',
  direction: 90,
  speed: 0,
  streak: 0,
  blend: 'add',
};

/** Stars of a layer are spread over a 1920 × 1080 screen; other screens get as many per area, at most this many. */
export const MAX_STARS = 6000;
const FULL_HD = 1920 * 1080;
const VARIANTS = 6;
const BLENDS = { normal: 'source-over', add: 'lighter', screen: 'screen' };

/** A repeatable random sequence, so a layer keeps its stars when its options change. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Number of stars of a layer spread over `area` square CSS pixels. */
export const starsFor = (count, area) => Math.min(MAX_STARS, Math.round((count * area) / FULL_HD));

const hexToHsl = (hex) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255 || 0);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

/** `hex` with its hue turned by `degrees`, as a CSS colour. */
export const turnHue = (hex, degrees) => {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${(((h + degrees) % 360) + 360) % 360} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
};

const polygon = (ctx, points) => {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};

const star = (ctx, rays, r, inner) =>
  polygon(
    ctx,
    Array.from({ length: rays * 2 }, (_, i) => {
      const angle = (Math.PI * i) / rays - Math.PI / 2;
      const radius = i % 2 ? r * inner : r;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    }),
  );

/** Draws `shape` of radius `r` round 0, 0 in the current fill and stroke styles. */
export function drawShape(ctx, shape, r) {
  const line = Math.max(1, r / 4);
  const stroke = (width) => {
    ctx.lineWidth = width;
    ctx.stroke();
  };
  switch (shape) {
    case 'soft': {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gradient.addColorStop(0, ctx.fillStyle);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'ring':
      ctx.beginPath();
      ctx.arc(0, 0, r - line / 2, 0, Math.PI * 2);
      stroke(line);
      return;
    case 'square':
      ctx.fillRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
      return;
    case 'diamond':
      polygon(ctx, [
        [0, -r],
        [r * 0.7, 0],
        [0, r],
        [-r * 0.7, 0],
      ]);
      ctx.fill();
      return;
    case 'cross':
    case 'x': {
      const a = shape === 'x' ? r * Math.SQRT1_2 : r;
      ctx.beginPath();
      if (shape === 'x') {
        ctx.moveTo(-a, -a);
        ctx.lineTo(a, a);
        ctx.moveTo(a, -a);
        ctx.lineTo(-a, a);
      } else {
        ctx.moveTo(-a, 0);
        ctx.lineTo(a, 0);
        ctx.moveTo(0, -a);
        ctx.lineTo(0, a);
      }
      ctx.lineCap = 'round';
      stroke(line);
      return;
    }
    case 'star4':
      star(ctx, 4, r, 0.4);
      ctx.fill();
      return;
    case 'star5':
      star(ctx, 5, r, 0.45);
      ctx.fill();
      return;
    case 'star6':
      star(ctx, 6, r, 0.55);
      ctx.fill();
      return;
    case 'sparkle':
      // Four long thin rays and a small core, like a bright star in a photo.
      star(ctx, 4, r, 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'flare': {
      // Diffraction spikes of a telescope: a cross of fading lines round a soft core.
      const colour = ctx.fillStyle;
      [0, Math.PI / 2].forEach((angle) => {
        const gradient = ctx.createLinearGradient(
          -Math.cos(angle) * r,
          -Math.sin(angle) * r,
          Math.cos(angle) * r,
          Math.sin(angle) * r,
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, colour);
        gradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(angle) * r, -Math.sin(angle) * r);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        stroke(Math.max(1, r / 10));
      });
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35);
      core.addColorStop(0, colour);
      core.addColorStop(1, 'transparent');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
  }
}

/**
 * Sprites of a layer: one per colour variant, each a square canvas with the
 * star of the largest size of the layer in the middle and its glow round it.
 */
function spritesFor(layer, ratio, makeCanvas) {
  const radius = layer.size * (1 + layer.sizeSpread) * ratio;
  const glow = layer.glow * ratio;
  const side = Math.max(2, Math.ceil((radius + glow) * 2 + 2));
  const variants = layer.hueSpread > 0 ? VARIANTS : 1;
  return Array.from({ length: variants }, (_, i) => {
    const sprite = makeCanvas(side);
    const ctx = sprite.getContext('2d');
    if (!ctx) return sprite;
    const turn = variants > 1 ? (i / (variants - 1) - 0.5) * 2 * layer.hueSpread : 0;
    const colour = turn ? turnHue(layer.color, turn) : layer.color;
    ctx.translate(side / 2, side / 2);
    // Twice with the glow and once more without it, so the glow is strong and the star stays crisp.
    for (let pass = 0; pass < (glow ? 3 : 1); pass++) {
      ctx.save();
      ctx.fillStyle = colour;
      ctx.strokeStyle = colour;
      ctx.shadowColor = pass < 2 && glow ? layer.glowColor : 'transparent';
      ctx.shadowBlur = pass < 2 ? glow : 0;
      drawShape(ctx, layer.shape, radius);
      ctx.restore();
    }
    return sprite;
  });
}

/** Stars of a layer as numbers from 0 to 1: position, depth, size, colour variant, phase and spin. */
function starsOf(index, count) {
  const random = seeded(1013 * (index + 1));
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    z: random(),
    size: random(),
    variant: random(),
    phase: random() * Math.PI * 2,
    spin: random(),
  }));
}

const defaultCanvas = (side) => {
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  return canvas;
};

/**
 * Starts the star layers on `canvas`; `options.layers` is a list of layers like
 * LAYER. Returns a stop function whose `update(options)` changes anything but
 * `animate` on the fly. Does nothing where Canvas 2D is not available.
 */
export function startStars(canvas, options = {}) {
  const o = { animate: true, fps: 30, layers: [], makeCanvas: defaultCanvas, ...options };
  const noop = () => {};
  noop.update = noop;
  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let layers = [];
  let time = 0;

  // Sprites and stars are made again only for the layers whose look changed.
  const build = () => {
    layers = o.layers.map((options, index) => {
      const layer = { ...LAYER, ...options };
      const old = layers[index];
      const look = [
        layer.shape,
        layer.size,
        layer.sizeSpread,
        layer.color,
        layer.hueSpread,
        layer.glow,
        layer.glowColor,
      ];
      const sameLook = old && old.ratio === ratio && old.look.join() === look.join();
      // Turning stars cover the corners too, so they are spread over the diagonal of the screen.
      const area = layer.motion === 'orbit' ? width ** 2 + height ** 2 : width * height;
      const count = layer.on ? starsFor(layer.count, area) : 0;
      return {
        ...layer,
        ratio,
        look,
        sprites: sameLook ? old.sprites : layer.on ? spritesFor(layer, ratio, o.makeCanvas) : [],
        stars: old && old.stars.length === count ? old.stars : starsOf(index, count),
      };
    });
  };

  const resize = () => {
    ratio = pixelRatio();
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    build();
  };

  const drawLayer = (layer, seconds) => {
    if (!layer.on || !layer.stars.length || !layer.sprites.length) return;
    const side = layer.sprites[0].width;
    const half = side / 2;
    const largest = 1 + layer.sizeSpread;
    const angle = (layer.direction * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const diagonal = Math.hypot(width, height);
    const turn = layer.motion === 'orbit' ? (time * layer.speed) / 900 : 0;
    ctx.globalCompositeOperation = BLENDS[layer.blend] || 'lighter';
    layer.stars.forEach((s) => {
      // Bigger stars are nearer, so they move faster (parallax).
      const near = 0.4 + 0.6 * s.size;
      let x;
      let y;
      let scale = (1 - layer.sizeSpread * (1 - s.size)) / largest;
      let heading = angle;
      let stretch = 0;
      let fade = 1;
      if (layer.motion === 'drift') {
        if (seconds) {
          s.x = (((s.x + (Math.cos(angle) * layer.speed * near * seconds) / width) % 1) + 1) % 1;
          s.y = (((s.y + (Math.sin(angle) * layer.speed * near * seconds) / height) % 1) + 1) % 1;
        }
        x = s.x * width;
        y = s.y * height;
        stretch = layer.streak * near * Math.min(1, layer.speed / 60);
      } else if (layer.motion === 'warp') {
        // Stars fly out of the centre: the depth goes from 1 (far) to 0 (here).
        if (seconds) s.z -= (layer.speed / 400) * seconds;
        if (s.z <= 0.02) Object.assign(s, { z: 1, x: Math.random(), y: Math.random() });
        const depth = Math.max(0.02, s.z);
        x = cx + ((s.x - 0.5) * width) / depth / 4;
        y = cy + ((s.y - 0.5) * height) / depth / 4;
        if (x < -side || x > width + side || y < -side || y > height + side) {
          if (seconds) Object.assign(s, { z: 1, x: Math.random(), y: Math.random() });
          return;
        }
        scale *= Math.min(2, 0.15 / depth);
        heading = Math.atan2(y - cy, x - cx);
        stretch = layer.streak * (1 - depth) * Math.min(1, layer.speed / 60);
        fade = Math.min(1, (1 - s.z) * 4);
      } else if (layer.motion === 'orbit') {
        x = cx + (s.x - 0.5) * diagonal;
        y = cy + (s.y - 0.5) * diagonal;
        if (turn) {
          const [dx, dy] = [x - cx, y - cy];
          x = cx + dx * Math.cos(turn) - dy * Math.sin(turn);
          y = cy + dx * Math.sin(turn) + dy * Math.cos(turn);
          heading = Math.atan2(y - cy, x - cx) + Math.PI / 2;
          stretch = layer.streak * Math.min(1, layer.speed / 60) * (Math.hypot(dx, dy) / diagonal);
        }
      } else {
        x = s.x * width;
        y = s.y * height;
      }
      if (x < -side || x > width + side || y < -side || y > height + side) return;
      const twinkle = layer.twinkleDepth * (0.5 + 0.5 * Math.sin(time * layer.twinkle * 2 + s.phase));
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.brightness * (1 - twinkle) * fade));
      const sprite = layer.sprites[Math.floor(s.variant * layer.sprites.length)];
      const spin = ((layer.rotation + layer.spin * time * (0.5 + s.spin)) * Math.PI) / 180;
      const px = x * ratio;
      const py = y * ratio;
      if (!stretch && !spin) {
        const size = side * scale;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
        return;
      }
      // A trail stretches the star along its motion; otherwise the star is turned.
      const theta = stretch ? heading : spin;
      const along = scale * (1 + stretch);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      ctx.setTransform(cos * along, sin * along, -sin * scale, cos * scale, px, py);
      ctx.drawImage(sprite, -half, -half, side, side);
    });
  };

  const render = (seconds) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach((layer) => drawLayer(layer, seconds));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  let frame = 0;
  let last = 0;
  const loop = (now) => {
    frame = requestAnimationFrame(loop);
    if (document.hidden || now - last < 1000 / o.fps) return;
    // A long pause (a hidden tab) does not make the stars jump.
    const seconds = last ? Math.min(0.25, (now - last) / 1000) : 0;
    last = now;
    time += seconds;
    render(seconds);
  };
  const onResize = () => {
    resize();
    render(0);
  };
  resize();
  render(0);
  const unwatch = watchSize(canvas, onResize);
  if (o.animate) frame = requestAnimationFrame(loop);
  const stop = () => {
    cancelAnimationFrame(frame);
    unwatch();
  };
  stop.update = (next) => {
    Object.assign(o, next, { animate: o.animate });
    build();
    render(0);
  };
  /** The layers as they are drawn now, for tests. */
  stop.layers = () => layers;
  return stop;
}
