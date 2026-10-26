// Draws a finite network of doublet links as one symbol, after the blueprint of
// github.com/konard/links-visuals: every link is ONE continuous curve in its
// own colour. It starts with a bar at its source, passes through its own
// middle and ends with an arrow at its target; optional middle cuts are off
// by default. Other links refer to a link by touching its middle. A reference
// to 0 (nothing) is a free end, a reference to the link itself is a loop that
// returns to its own middle, so (1: 1 1) is a symmetric figure eight (∞).
//
// Geometry is computed in layout units (neighbouring middles are 1 apart),
// every curve is a chain of cubic Bézier segments that share tangents where
// they meet, and the finished drawing is scaled into a SIZE × SIZE box.
//
// Every number of the drawing is a `shape` option (issue #17), so the editor
// of /network/ can change the angle at which a link comes to another link,
// the shapes of its start, end and middle, and turn each end on its own. The
// defaults in SHAPE draw exactly the symbols of the gallery and the rain.

import { pointAlongCurve, trimCurve } from './curve-tools';
import { placeLinks } from './placement';

export const SIZE = 100;
export const STROKE = 2.4;
/** Gallery colours; the editor cycles this palette beyond nine links. */
export const COLORS = [
  '#22d3ee',
  '#c084fc',
  '#f472b6',
  '#facc15',
  '#34d399',
  '#fb923c',
  '#60a5fa',
  '#f87171',
  '#a3e635',
];

const SCALE = 60; // SIZE units per layout unit, unless the drawing must shrink
const LONE = { free: 0.9, loop: 1.25 }; // a single link has the box to itself
const FREE = 0.42; // length of a free end (a reference to nothing)
const LOOP = 0.8; // size of a self-reference loop

/** Shapes of the start, the end and the middle of a link (`marker`). */
export const MARKERS = ['bar', 'arrow', 'triangle', 'tail', 'dot', 'circle', 'square', 'diamond', 'none'];

/**
 * The options of the drawing and their defaults. Lengths are in layout units
 * (neighbouring middles are 1 apart) unless they say SIZE units, angles in degrees.
 */
export const SHAPE = {
  placement: 'circle',
  layoutAspect: 1,
  columns: 0,
  forceDistance: 1,
  forceCharge: 0.6,
  forceCollision: 0.6,
  rotation: 0, // turns the whole layout
  spread: 1, // distance between the middles, relative to the lengths of free ends and loops
  padding: 9, // free margin around the drawing, in SIZE units
  bendMode: 'rotate', // legacy gallery/rain geometry; the editor opts into anchored curve bending
  tension: 0.38, // how far a reference bends out, relative to the distance it spans
  bulge: 20, // how much a lone reference bends aside
  loopBend: 0, // independent loop width in editor curve mode
  gap: 0.07, // ends stop this far from the middle they touch
  startGap: null, // independent reference gaps; null keeps the legacy shared gap
  endGap: null,
  middleGapStart: 0, // optional cuts on either side of this link's own middle, SIZE units
  middleGapEnd: 0,
  free: 1, // length of a free end (a reference to nothing), × the default
  loop: 1, // size of a self-reference loop, × the default
  lens: true, // a link that refers twice to the same link meets it at 45° (a lens)
  angles: 'mirror', // 'mirror': ends mirror the middle across the chord; 'fixed': sourceAngle / targetAngle
  sourceAngle: 30, // with 'fixed': the angle between a link leaving its source and the chord
  targetAngle: 30, // with 'fixed': the angle between a link entering its target and the chord
  start: 'bar',
  startSize: 3.6, // SIZE units: the half-length of the bar
  startAngle: 28,
  end: 'arrow',
  endSize: 5.5, // SIZE units: the length of the arrow head arms
  endAngle: 28,
  middle: 'none',
  middleSize: 2.2,
  middleAngle: 30,
  startOffset: 0, // marker displacement along the curve, in SIZE units (positive is inward)
  endOffset: 0,
  middleOffset: 0,
  startAcross: 0, // displacement across the tangent, in SIZE units
  endAcross: 0,
  middleAcross: 0,
  startRotation: 0, // marker rotation independent of the line, in degrees
  endRotation: 0,
  middleRotation: 0,
  turns: [], // [source, target] turn of each link's ends in degrees, set by hand or by solveCollisions
  linkGaps: [], // [source gap, target gap, cut before middle, cut after middle]; null inherits
};

const RAD = Math.PI / 180;

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const length = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => mul(a, 1 / length(a));
const rotate = (a, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
/** Mirrors the tangent `d` across the chord direction `c`. */
const reflect = (d, c) => sub(mul(c, 2 * dot(d, c)), d);

/**
 * A link that refers twice to the same other link is a lens: its ends meet
 * the other middle at 45° instead of sideways, so two links that refer to
 * each other twice cross instead of drawing the same oval.
 */
const lens = (dir, chord, twice) => (twice ? unit(add(dir, chord)) : dir);

/** Middles of the links (layout units) and the outward direction of each. */
export const layout = (n, options = {}, links = null) => placeLinks(n, options, links);

/** Picks the side ±perp(d) whose loop, with axis between side and `away`, points outward. */
function side(d, away, out) {
  const left = rotate(d, Math.PI / 2);
  const right = mul(left, -1);
  return dot(add(left, away), out) >= dot(add(right, away), out) ? left : right;
}

/**
 * The direction of an end that meets another middle along `chord`: the mirror
 * of the middle direction, or with fixed angles the chord turned by `angle`
 * to the same side as the mirror.
 */
function approach(d, chord, twice, angle, o) {
  const mirror = lens(reflect(d, chord), chord, twice && o.lens);
  if (o.angles !== 'fixed') return mirror;
  const side = chord[0] * mirror[1] - chord[1] * mirror[0] < 0 ? -1 : 1;
  return rotate(chord, side * angle * RAD);
}

/** The cubic segments of link `i` (0-based) and its two ends, in layout units. */
export function linkCurve(links, i, places, o) {
  const n = links.length;
  const [s, t] = links[i];
  const { at: m, out } = places[i];
  const other = (ref) => ref !== 0 && ref !== i + 1;
  const free = (n === 1 ? LONE.free : FREE) * o.free;
  const loop = (n === 1 ? LONE.loop : LOOP) * o.loop;
  const [turnIn, turnOut] = (o.turns[i] || [0, 0]).map((a) => (a || 0) * RAD);
  const bulge = o.bulge * RAD;
  const startGap = o.linkGaps[i]?.[0] ?? o.startGap ?? o.gap;
  const endGap = o.linkGaps[i]?.[1] ?? o.endGap ?? o.gap;
  const tangent = rotate(out, Math.PI / 2);
  const tIn = other(s) ? unit(sub(m, places[s - 1].at)) : null;
  const tOut = other(t) ? unit(sub(places[t - 1].at, m)) : null;

  // The direction in which the link passes through its own middle.
  let d;
  if (tIn && tOut) {
    const sum = add(tIn, tOut);
    d = length(sum) < 1e-9 ? side(tOut, [0, 0], out) : unit(sum);
  } else if (tIn || tOut) d = rotate(tIn || tOut, bulge);
  else if (s && t) d = rotate(tangent, Math.PI / 4 + bulge - SHAPE.bulge * RAD);
  else d = rotate(tangent, bulge - SHAPE.bulge * RAD);

  // Editor bending changes handles, with fixed endpoint axes. The legacy
  // branch above remains the gallery/rain's original construction.
  const balanced = o.bendMode === 'curve';
  const freeAxis = balanced ? tIn || tOut || tangent : d;
  if (balanced && !tIn && !tOut) {
    d = s && t ? rotate(tangent, Math.PI / 4) : s || t ? tangent : rotate(tangent, bulge / 2);
  }
  const loopWidth = balanced ? Math.exp((o.bulge + o.loopBend) / 180) : 1;

  let first;
  let start;
  if (s === 0) {
    const dir = rotate(freeAxis, turnIn);
    const from = sub(m, mul(dir, free));
    first = [from, add(from, mul(dir, free / 3)), sub(m, mul(d, free / 3)), m];
    start = { at: from, dir };
  } else if (s === i + 1) {
    // A loop that leaves the middle sideways and comes back through it.
    const angle = o.angles === 'fixed' ? (o.sourceAngle - SHAPE.sourceAngle) * RAD : 0;
    const away = rotate(t === i + 1 ? rotate(d, Math.PI / 2) : side(d, mul(d, -1), out), turnIn + angle);
    const from = add(m, mul(away, startGap));
    first = [
      from,
      add(m, mul(away, Math.max(loop * loopWidth, startGap + 0.01))),
      sub(m, mul(d, (loop * Math.max(0.03, o.tension)) / SHAPE.tension)),
      m,
    ];
    start = { at: from, dir: away };
  } else {
    const p = places[s - 1].at;
    const chord = unit(sub(m, p));
    const dir = rotate(approach(d, chord, s === t, o.sourceAngle, o), turnIn);
    const k = o.tension * length(sub(m, p));
    const from = add(p, mul(dir, startGap));
    first = [from, add(from, mul(dir, k)), sub(m, mul(d, k)), m];
    start = { at: from, dir };
  }

  let second;
  let end;
  if (t === 0) {
    const dir = rotate(freeAxis, turnOut);
    const to = add(m, mul(dir, free));
    second = [m, add(m, mul(d, free / 3)), sub(to, mul(dir, free / 3)), to];
    end = { at: to, dir };
  } else if (t === i + 1) {
    // Point-symmetric to the source loop, so (1: 1 1) is an even ∞.
    const angle = o.angles === 'fixed' ? (o.targetAngle - SHAPE.targetAngle) * RAD : 0;
    const away = rotate(s === i + 1 ? rotate(d, -Math.PI / 2) : side(d, d, out), turnOut + (balanced ? angle : -angle));
    const to = add(m, mul(away, endGap));
    second = [
      m,
      add(m, mul(d, (loop * Math.max(0.03, o.tension)) / SHAPE.tension)),
      add(m, mul(away, Math.max(loop * loopWidth, endGap + 0.01))),
      to,
    ];
    end = { at: to, dir: mul(away, -1) };
  } else {
    const q = places[t - 1].at;
    const chord = unit(sub(q, m));
    const dir = rotate(approach(d, chord, s === t, o.targetAngle, o), turnOut);
    const k = o.tension * length(sub(q, m));
    const to = sub(q, mul(dir, endGap));
    second = [m, add(m, mul(d, k)), sub(to, mul(dir, k)), to];
    end = { at: to, dir };
  }
  return { segments: [first, second], start, end, middle: { at: m, dir: d } };
}

/** The point at parameter u ∈ [0, 1] of a cubic Bézier segment. */
export const bezier = ([p0, p1, p2, p3], u) => {
  const v = 1 - u;
  return add(add(mul(p0, v * v * v), mul(p1, 3 * v * v * u)), add(mul(p2, 3 * v * u * u), mul(p3, u * u * u)));
};

/** The shape options with the defaults filled in. */
export const shapeOf = (shape = {}) => ({ ...SHAPE, ...shape, turns: shape.turns || SHAPE.turns });

/** The curves of every link in layout units, before they are scaled into the box. */
export function layoutCurves(links, shape = {}) {
  const n = links.length;
  if (n < 1) throw new RangeError('A symbol needs at least one link');
  const o = shapeOf(shape);
  const places = layout(n, o, links);
  return links.map((_, i) => linkCurve(links, i, places, o));
}

/** Shared fitting transform, also used to score middle cuts in image units. */
export function curveTransform(curves, shape = {}) {
  const o = shapeOf(shape);
  const markerRoom = Math.max(
    ...['start', 'end', 'middle'].map((key) =>
      o[key] === 'none' ? 0 : o[`${key}Size`] + Math.hypot(o[`${key}Offset`], o[`${key}Across`]),
    ),
  );
  const pad = Math.min(48, Math.max(o.padding, markerRoom + (o.strokeWidth || 0) / 2));
  const points = curves.flatMap((c) =>
    c.segments.flatMap((seg) => Array.from({ length: 17 }, (_, k) => bezier(seg, k / 16))),
  );
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [
    xs.reduce((a, b) => Math.min(a, b), Infinity),
    xs.reduce((a, b) => Math.max(a, b), -Infinity),
    ys.reduce((a, b) => Math.min(a, b), Infinity),
    ys.reduce((a, b) => Math.max(a, b), -Infinity),
  ];
  const scale = Math.min(SCALE, (SIZE - 2 * pad) / Math.max(maxX - minX, maxY - minY, 1e-9));
  const shift = [SIZE / 2 - ((minX + maxX) / 2) * scale, SIZE / 2 - ((minY + maxY) / 2) * scale];
  return { scale, shift };
}

/** The curves of every link, already scaled into the SIZE box. */
export function glyphCurves(links, shape = {}) {
  const curves = layoutCurves(links, shape);
  const { scale, shift } = curveTransform(curves, shape);
  const place = (p) => add(mul(p, scale), shift);
  return curves.map((c) => ({
    segments: c.segments.map((seg) => seg.map(place)),
    start: { at: place(c.start.at), dir: c.start.dir },
    end: { at: place(c.end.at), dir: c.end.dir },
    middle: { at: place(c.middle.at), dir: c.middle.dir },
  }));
}

const fmt = (p) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`;

/** A circle of radius `r` around `c` as a path. */
const circle = (c, r) =>
  `M${fmt(sub(c, [r, 0]))}a${+r.toFixed(2)} ${+r.toFixed(2)} 0 1 0 ${+(2 * r).toFixed(2)} 0` +
  `a${+r.toFixed(2)} ${+r.toFixed(2)} 0 1 0 ${+(-2 * r).toFixed(2)} 0Z`;
const polygon = (points) => `M${points.map(fmt).join('L')}Z`;

/**
 * The shape `kind` at point `at` of a line going in direction `dir`: `size`
 * is its size in SIZE units, `angle` the half-angle of an arrow head.
 * Returns `{ d, fill }`; filled shapes are painted in the link colour.
 */
export function marker(kind, at, dir, size, angle) {
  const a = angle * RAD;
  const across = rotate(dir, Math.PI / 2);
  const back = mul(dir, -size);
  switch (kind) {
    case 'bar':
      return { d: `M${fmt(add(at, mul(across, size)))}L${fmt(sub(at, mul(across, size)))}`, fill: false };
    case 'arrow':
      return { d: `M${fmt(add(at, rotate(back, a)))}L${fmt(at)}L${fmt(add(at, rotate(back, -a)))}`, fill: false };
    case 'tail':
      return {
        d: `M${fmt(sub(at, rotate(back, a)))}L${fmt(at)}L${fmt(sub(at, rotate(back, -a)))}`,
        fill: false,
      };
    case 'triangle':
      return { d: polygon([at, add(at, rotate(back, a)), add(at, rotate(back, -a))]), fill: true };
    case 'dot':
      return { d: circle(at, size / 2), fill: true };
    case 'circle':
      return { d: circle(at, size / 2), fill: false };
    case 'square': {
      const h = size / 2;
      const [u, v] = [mul(dir, h), mul(across, h)];
      return {
        d: polygon([add(add(at, u), v), sub(add(at, u), v), sub(sub(at, u), v), add(sub(at, u), v)]),
        fill: true,
      };
    }
    case 'diamond': {
      const h = size / 2;
      return {
        d: polygon([
          add(at, mul(dir, h * 1.4)),
          add(at, mul(across, h)),
          sub(at, mul(dir, h * 1.4)),
          sub(at, mul(across, h)),
        ]),
        fill: true,
      };
    }
    default:
      return { d: '', fill: false };
  }
}

/** The parts of every link: its line and the shapes of its start, end and middle (`{ d, fill }`). */
export function glyphParts(links, shape = {}) {
  const o = shapeOf(shape);
  const mark = (key, point, segments) => {
    const direction = key === 'end' ? -1 : 1;
    const offset = direction * o[`${key}Offset`];
    if (offset !== 0) point = pointAlongCurve(segments, offset, key);
    const at = add(point.at, mul(rotate(point.dir, Math.PI / 2), o[`${key}Across`]));
    return marker(o[key], at, rotate(point.dir, o[`${key}Rotation`] * RAD), o[`${key}Size`], o[`${key}Angle`]);
  };
  return glyphCurves(links, o).map(({ segments, start, end, middle }, i) => {
    const middleGapStart = o.linkGaps[i]?.[2] ?? o.middleGapStart;
    const middleGapEnd = o.linkGaps[i]?.[3] ?? o.middleGapEnd;
    const split = middleGapStart > 0 || middleGapEnd > 0;
    const visible = [trimCurve(segments[0], middleGapStart), trimCurve(segments[1], middleGapEnd, true)].filter(
      Boolean,
    );
    const line = split
      ? visible.map((seg) => `M${fmt(seg[0])}C${seg.slice(1).map(fmt).join(' ')}`).join('')
      : `M${fmt(segments[0][0])}` + segments.map((seg) => `C${seg.slice(1).map(fmt).join(' ')}`).join('');
    return {
      line,
      start: mark('start', start, segments),
      end: mark('end', end, segments),
      middle: mark('middle', middle, segments),
      color: COLORS[i % COLORS.length],
    };
  });
}

/** One SVG path per link: the continuous line, the source bar and the target arrow. */
export function glyphPaths(links, shape = {}) {
  return glyphParts(links, shape).map(({ line, start, end, middle, color }) => ({
    d: line + start.d + end.d + middle.d,
    color,
  }));
}

/** A standalone SVG document of a network (used by tests and experiments). */
export function glyphSvg(links, size = SIZE) {
  const paths = glyphPaths(links)
    .map(({ d, color }) => `<path d="${d}" stroke="${color}"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${SIZE} ${SIZE}" ` +
    `fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  );
}
