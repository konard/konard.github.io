// Geometry of a link configuration symbol in the konard/links-visuals style:
// every link is a dot with two halves, the source half ends with a
// perpendicular bar at its source and the target half ends with an arrow at
// its target. A half that points back to its own link is a teardrop petal.
// All symbols share one 100×100 view box, so they line up in a grid or a rain.

export const SIZE = 100;
export const DOT_RADIUS = 3.2;

// Dot positions for 1–4 links (a point, a segment, a triangle, a square).
export const LAYOUTS = {
  1: [[50, 50]],
  2: [
    [30, 50],
    [70, 50],
  ],
  3: [
    [50, 27],
    [71, 63],
    [29, 63],
  ],
  4: [
    [31, 31],
    [69, 31],
    [69, 69],
    [31, 69],
  ],
};

const round = (v) => Math.round(v * 10) / 10;
const pt = ([x, y]) => `${round(x)} ${round(y)}`;
const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
const sub = ([ax, ay], [bx, by]) => [ax - bx, ay - by];
const scale = ([x, y], k) => [x * k, y * k];
const len = ([x, y]) => Math.hypot(x, y) || 1;
const unit = (v) => scale(v, 1 / len(v));
const dir = (angle) => [Math.cos(angle), Math.sin(angle)];
const left = ([x, y]) => [y, -x];
const DEG = Math.PI / 180;

// The arrow (target marker) and the bar (source marker) at `end`, oriented by `tangent`.
function arrow(end, tangent) {
  const back = scale(unit(tangent), -5.5);
  const a = add(end, rotate(back, 28 * DEG));
  const b = add(end, rotate(back, -28 * DEG));
  return `M${pt(a)}L${pt(end)}L${pt(b)}`;
}
function bar(end, tangent) {
  const n = scale(left(unit(tangent)), 3.4);
  return `M${pt(add(end, n))}L${pt(sub(end, n))}`;
}
function rotate([x, y], a) {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

// A curved half from link dot `from` to dot `to`, bent sideways by `bend`.
function half(from, to, bend, marker) {
  const d = sub(to, from);
  const u = unit(d);
  const control = add(add(from, scale(d, 0.5)), scale(left(u), bend * len(d)));
  const start = add(from, scale(unit(sub(control, from)), DOT_RADIUS + 1.2));
  const endTangent = unit(sub(to, control));
  const end = sub(to, scale(endTangent, DOT_RADIUS + 1.6));
  return `M${pt(start)}Q${pt(control)} ${pt(end)}` + marker(end, endTangent);
}

// A teardrop petal that leaves dot `at` in direction `angle` and comes back.
function petal(at, angle, reach, spread, marker) {
  const c1 = add(at, scale(dir(angle + spread), reach));
  const c2 = add(at, scale(dir(angle - spread), reach));
  const start = add(at, scale(dir(angle + spread), DOT_RADIUS + 1.2));
  const end = add(at, scale(dir(angle - spread), DOT_RADIUS + 1.6));
  return `M${pt(start)}C${pt(c1)} ${pt(c2)} ${pt(end)}` + marker(end, unit(sub(end, c2)));
}

/**
 * Paths of a configuration given as `[[source, target], …]` (link indices).
 * Returns `{ stroke, dots }`: one SVG path for all strokes and dot centers.
 */
export function glyphPaths(links) {
  const n = links.length;
  const dots = LAYOUTS[n];
  if (!dots) throw new RangeError(`Only 1–4 links are supported, got ${n}`);
  const center = scale(dots.reduce(add, [0, 0]), 1 / n);
  const reach = n === 1 ? 34 : 24;
  const parts = links.map(([s, t], i) => {
    const at = dots[i];
    // Petals point away from the other links; a lone link opens left and right.
    const out = n === 1 ? Math.PI : Math.atan2(at[1] - center[1], at[0] - center[0]);
    const both = s === i && t === i;
    const sourceAngle = n === 1 ? Math.PI : both ? out + 52 * DEG : out;
    const targetAngle = n === 1 ? 0 : both ? out - 52 * DEG : out;
    const source = s === i ? petal(at, sourceAngle, reach, 34 * DEG, bar) : half(at, dots[s], 0.16, bar);
    const target = t === i ? petal(at, targetAngle, reach, 34 * DEG, arrow) : half(at, dots[t], -0.26, arrow);
    return source + target;
  });
  return { stroke: parts.join(''), dots };
}

/** Standalone SVG markup of a configuration (used for the sprite and the gallery). */
export function glyphSymbol(links, id) {
  const { stroke, dots } = glyphPaths(links);
  const circles = dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`).join('');
  return (
    `<symbol id="${id}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<path d="${stroke}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g fill="currentColor">${circles}</g></symbol>`
  );
}

/** Symbol id of a canonical configuration code such as `"01 10"`. */
export const glyphId = (code) => `links-${code.split(' ').length}-${code.replace(/ /g, '-')}`;
