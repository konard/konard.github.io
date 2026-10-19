// The "universe" layer: a WebGL fragment shader that paints a slowly drifting
// gas nebula (domain-warped fractal noise) with twinkling stars. It renders at
// a reduced resolution because the nebula is soft anyway, and falls back to
// the CSS gradient behind the canvas where WebGL is unavailable.

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

export const FRAGMENT = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform float px;

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
float stars(vec2 frag, float size, float density, float speed) {
  vec2 g = frag / size;
  vec2 id = floor(g);
  float h = hash(id);
  float on = step(1.0 - density, h);
  vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  float d = length(fract(g) - 0.5 - offset * 0.6);
  float twinkle = 0.55 + 0.45 * sin(t * speed + h * 90.0);
  return on * twinkle * smoothstep(0.32, 0.0, d);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * r) / r.y;
  vec2 q = vec2(fbm(uv * 1.5 + t * 0.008), fbm(uv * 1.5 + vec2(5.2, 1.3) - t * 0.01));
  vec2 w = vec2(fbm(uv * 1.5 + 3.0 * q + vec2(1.7, 9.2) + t * 0.006), fbm(uv * 1.5 + 3.0 * q + vec2(8.3, 2.8)));
  float n = fbm(uv * 1.8 + 2.5 * w);
  vec3 col = vec3(0.012, 0.02, 0.05);
  col = mix(col, vec3(0.13, 0.06, 0.32), smoothstep(0.35, 0.85, n));
  col = mix(col, vec3(0.03, 0.42, 0.52), smoothstep(0.5, 1.0, n * w.x * 1.7));
  col += vec3(0.65, 0.2, 0.5) * pow(smoothstep(0.55, 1.0, n * q.y * 1.9), 2.0) * 0.55;
  col += vec3(0.9, 0.85, 1.0) * pow(smoothstep(0.75, 1.05, n * w.y * 1.6), 3.0) * 0.35;
  // Darken the edges and the middle a bit so text on top stays readable.
  col *= 0.5 + 0.5 * smoothstep(1.3, 0.1, length(uv - vec2(0.35, 0.15)));
  vec2 f = gl_FragCoord.xy / px;
  col += vec3(0.85, 0.92, 1.0) * stars(f, 3.0, 0.004, 1.3) * 0.8;
  col += vec3(1.0) * stars(f + 17.0, 7.0, 0.006, 0.7);
  col += vec3(0.7, 0.85, 1.0) * stars(f + 41.0, 19.0, 0.02, 0.4) * 1.2;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

/**
 * Starts the nebula on `canvas`; returns a stop function. Returns a no-op where
 * WebGL is not available (old browsers, tests), leaving the CSS fallback visible.
 */
export function startNebula(canvas, { animate = true, scale = 0.6, fps = 24 } = {}) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    gl = null;
  }
  if (!gl) return () => {};
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return () => {};
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(program, 'r');
  const uT = gl.getUniformLocation(program, 't');
  const uPx = gl.getUniformLocation(program, 'px');
  // A random epoch makes every visit show a different part of the universe.
  const epoch = performance.now() - Math.random() * 600000;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2) * scale;
    canvas.width = Math.round((canvas.clientWidth || window.innerWidth) * ratio);
    canvas.height = Math.round((canvas.clientHeight || window.innerHeight) * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uPx, ratio);
  };
  const render = (now) => {
    gl.uniform1f(uT, (now - epoch) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let frame = 0;
  let last = 0;
  const loop = (now) => {
    frame = requestAnimationFrame(loop);
    if (document.hidden || now - last < 1000 / fps) return;
    last = now;
    render(now);
  };
  const onResize = () => {
    resize();
    render(performance.now());
  };
  resize();
  render(performance.now());
  window.addEventListener('resize', onResize);
  if (animate) frame = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
  };
}
