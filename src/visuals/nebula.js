// The "universe" layer: a WebGL fragment shader that paints a slowly drifting
// gas nebula (domain-warped fractal noise) with twinkling stars. It renders at
// a reduced resolution because the nebula is soft anyway, and falls back to
// the CSS gradient behind the canvas where WebGL is unavailable.
import { pixelRatio, watchSize } from './size';

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

export const FRAGMENT = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform float px;
// Settings (issue #13): twinkle time, brightness of the gas, hue shift in
// radians, number and brightness of stars, darkening of the edges.
uniform float tw;
uniform float gas;
uniform float hue;
uniform float density;
uniform float shine;
uniform float vignette;
// Issue #15: colours of the gas (dark, blue, pink, bright), the colour and the
// size of the stars, and the zoom of the gas clouds.
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;
uniform vec3 starColor;
uniform float starSize;
uniform float zoom;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
vec3 rotateHue(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  return c * cos(a) + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cos(a));
}
float stars(vec2 frag, float size, float share, float speed) {
  vec2 g = frag / size;
  vec2 id = floor(g);
  float h = hash(id);
  float on = step(1.0 - min(1.0, share * density * starSize * starSize), h);
  vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  float d = length(fract(g) - 0.5 - offset * 0.6);
  float twinkle = 0.55 + 0.45 * sin(tw * speed + h * 90.0);
  return on * twinkle * smoothstep(0.32, 0.0, d);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * r) / r.y / zoom;
  vec2 q = vec2(fbm(uv * 1.5 + t * 0.008), fbm(uv * 1.5 + vec2(5.2, 1.3) - t * 0.01));
  vec2 w = vec2(fbm(uv * 1.5 + 3.0 * q + vec2(1.7, 9.2) + t * 0.006), fbm(uv * 1.5 + 3.0 * q + vec2(8.3, 2.8)));
  float n = fbm(uv * 1.8 + 2.5 * w);
  vec3 col = vec3(0.012, 0.02, 0.05);
  col = mix(col, c1, smoothstep(0.35, 0.85, n));
  col = mix(col, c2, smoothstep(0.5, 1.0, n * w.x * 1.7));
  col += c3 * pow(smoothstep(0.55, 1.0, n * q.y * 1.9), 2.0) * 0.55;
  col += c4 * pow(smoothstep(0.75, 1.05, n * w.y * 1.6), 3.0) * 0.35;
  col = max(rotateHue(col, hue), 0.0) * gas;
  // Darken the edges and the middle a bit so text on top stays readable.
  col *= 1.0 - vignette + vignette * smoothstep(1.3, 0.1, length(uv - vec2(0.35, 0.15)));
  vec2 f = gl_FragCoord.xy / px / starSize;
  vec3 sky = vec3(0.85, 0.92, 1.0) * stars(f, 3.0, 0.004, 1.3) * 0.8;
  sky += vec3(1.0) * stars(f + 17.0, 7.0, 0.006, 0.7);
  sky += vec3(0.7, 0.85, 1.0) * stars(f + 41.0, 19.0, 0.02, 0.4) * 1.2;
  gl_FragColor = vec4(col + sky * starColor * shine, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

/** Default look of the universe; every option can be changed later with `stop.update(options)`. */
export const NEBULA = {
  animate: true,
  scale: 0.6,
  fps: 24,
  speed: 1,
  gas: 1,
  hue: 0,
  stars: 1,
  starBrightness: 1,
  twinkle: 1,
  vignette: 0.5,
  zoom: 1,
  starSize: 1,
  starColor: '#ffffff',
  color1: '#210f52',
  color2: '#086b85',
  color3: '#a63380',
  color4: '#e6d9ff',
};

/** `#rrggbb` as three numbers from 0 to 1, for a vec3 uniform. */
export const rgbOf = (hex) => [1, 3, 5].map((at) => parseInt(String(hex).slice(at, at + 2), 16) / 255 || 0);

/**
 * Starts the nebula on `canvas`; returns a stop function whose `update(options)`
 * changes any option of NEBULA except `animate` on the fly. Returns a no-op where
 * WebGL is not available (old browsers, tests), leaving the CSS fallback visible.
 */
export function startNebula(canvas, options = {}) {
  const o = { ...NEBULA, ...options };
  const noop = () => {};
  noop.update = noop;
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    gl = null;
  }
  if (!gl) return noop;
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return noop;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name) => gl.getUniformLocation(program, name);
  const [uR, uT, uPx, uTw] = ['r', 't', 'px', 'tw'].map(uniform);
  const looks = [
    [uniform('gas'), () => o.gas],
    [uniform('hue'), () => (o.hue * Math.PI) / 180],
    [uniform('density'), () => o.stars],
    [uniform('shine'), () => o.starBrightness],
    [uniform('vignette'), () => o.vignette],
    [uniform('zoom'), () => o.zoom],
    [uniform('starSize'), () => o.starSize],
  ];
  const colours = [
    [uniform('c1'), () => o.color1],
    [uniform('c2'), () => o.color2],
    [uniform('c3'), () => o.color3],
    [uniform('c4'), () => o.color4],
    [uniform('starColor'), () => o.starColor],
  ];
  // A random start makes every visit show a different part of the universe.
  // The nebula and the stars keep their own clocks, so both speeds can change
  // without a jump.
  let time = Math.random() * 600;
  let twinkle = time;
  let clock = performance.now();

  const resize = () => {
    const ratio = pixelRatio() * o.scale;
    canvas.width = Math.round((canvas.clientWidth || window.innerWidth) * ratio);
    canvas.height = Math.round((canvas.clientHeight || window.innerHeight) * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uPx, ratio);
  };
  const render = (now) => {
    const seconds = Math.max(0, now - clock) / 1000;
    clock = now;
    if (o.animate) {
      time += seconds * o.speed;
      twinkle += seconds * o.twinkle;
    }
    gl.uniform1f(uT, time);
    gl.uniform1f(uTw, twinkle);
    looks.forEach(([location, value]) => gl.uniform1f(location, value()));
    colours.forEach(([location, value]) => gl.uniform3f(location, ...rgbOf(value())));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let frame = 0;
  let last = 0;
  const loop = (now) => {
    frame = requestAnimationFrame(loop);
    if (document.hidden || now - last < 1000 / o.fps) return;
    last = now;
    render(now);
  };
  const onResize = () => {
    resize();
    render(performance.now());
  };
  resize();
  render(performance.now());
  const unwatch = watchSize(canvas, onResize);
  if (o.animate) frame = requestAnimationFrame(loop);
  const stop = () => {
    cancelAnimationFrame(frame);
    unwatch();
  };
  stop.update = (next) => {
    const scale = o.scale;
    Object.assign(o, next, { animate: o.animate });
    if (o.scale !== scale) resize();
    render(performance.now());
  };
  return stop;
}
