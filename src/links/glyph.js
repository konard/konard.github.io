// Draws a network of 1–4 doublet links as one symbol, after the blueprint of
// github.com/konard/links-visuals: every link is ONE continuous curve in its
// own colour. It starts with a bar at its source, passes through its own
// middle and ends with an arrow at its target; nothing interrupts the line in
// the middle. Other links refer to a link by touching its middle. A reference
// to 0 (nothing) is a free end, a reference to the link itself is a loop that
// returns to its own middle, so (1: 1 1) is a symmetric figure eight (∞).
//
// Geometry is computed in layout units (neighbouring middles are 1 apart),
// every curve is a chain of cubic Bézier segments that share tangents where
// they meet, and the finished drawing is scaled into a SIZE × SIZE box.

export const SIZE = 100;
export const STROKE = 2.4;
/** One colour per real link: link 1, 2, 3, 4. */
export const COLORS = ['#22d3ee', '#c084fc', '#f472b6', '#facc15'];

const PAD = 9; // free margin around the drawing, in SIZE units
const SCALE = 60; // SIZE units per layout unit, unless the drawing must shrink
const BAR = 3.6; // half-length of the source bar
const ARROW = 5.5; // length of the arrow head arms
const ARROW_ANGLE = (28 * Math.PI) / 180;
const BULGE = (20 * Math.PI) / 180; // how much a lone reference bends aside
const GAP = 0.07; // ends stop this far from the middle they touch
const FREE = 0.42; // length of a free end (a reference to nothing)
const LOOP = 0.8; // size of a self-reference loop
const LONE = { free: 0.9, loop: 1.25 }; // a single link has the box to itself

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
export function layout(n) {
  if (n === 1) return [{ at: [0, 0], out: [0, -1] }];
  const radius = 0.5 / Math.sin(Math.PI / n);
  const start = n === 2 ? Math.PI : n === 3 ? -Math.PI / 2 : (-3 * Math.PI) / 4;
  return Array.from({ length: n }, (_, i) => {
    const out = [Math.cos(start + (2 * Math.PI * i) / n), Math.sin(start + (2 * Math.PI * i) / n)];
    return { at: mul(out, radius), out };
  });
}

/** Picks the side ±perp(d) whose loop, with axis between side and `away`, points outward. */
function side(d, away, out) {
  const left = rotate(d, Math.PI / 2);
  const right = mul(left, -1);
  return dot(add(left, away), out) >= dot(add(right, away), out) ? left : right;
}

/** The cubic segments of link `i` (0-based) and its two ends, in layout units. */
function linkCurve(links, i, places) {
  const n = links.length;
  const [s, t] = links[i];
  const { at: m, out } = places[i];
  const other = (ref) => ref !== 0 && ref !== i + 1;
  const free = n === 1 ? LONE.free : FREE;
  const loop = n === 1 ? LONE.loop : LOOP;
  const tangent = rotate(out, Math.PI / 2);
  const tIn = other(s) ? unit(sub(m, places[s - 1].at)) : null;
  const tOut = other(t) ? unit(sub(places[t - 1].at, m)) : null;

  // The direction in which the link passes through its own middle.
  let d;
  if (tIn && tOut) {
    const sum = add(tIn, tOut);
    d = length(sum) < 1e-9 ? side(tOut, [0, 0], out) : unit(sum);
  } else if (tIn || tOut) d = rotate(tIn || tOut, BULGE);
  else if (s && t) d = rotate(tangent, Math.PI / 4);
  else d = tangent;

  let first;
  let start;
  if (s === 0) {
    const from = sub(m, mul(d, free));
    first = [from, add(from, mul(d, free / 3)), sub(m, mul(d, free / 3)), m];
    start = { at: from, dir: d };
  } else if (s === i + 1) {
    // A loop that leaves the middle sideways and comes back through it.
    const away = t === i + 1 ? rotate(d, Math.PI / 2) : side(d, mul(d, -1), out);
    const from = add(m, mul(away, GAP));
    first = [from, add(m, mul(away, loop)), sub(m, mul(d, loop)), m];
    start = { at: from, dir: away };
  } else {
    const p = places[s - 1].at;
    const chord = unit(sub(m, p));
    const dir = lens(reflect(d, chord), chord, s === t);
    const k = 0.38 * length(sub(m, p));
    const from = add(p, mul(dir, GAP));
    first = [from, add(from, mul(dir, k)), sub(m, mul(d, k)), m];
    start = { at: from, dir };
  }

  let second;
  let end;
  if (t === 0) {
    const to = add(m, mul(d, free));
    second = [m, add(m, mul(d, free / 3)), sub(to, mul(d, free / 3)), to];
    end = { at: to, dir: d };
  } else if (t === i + 1) {
    // Point-symmetric to the source loop, so (1: 1 1) is an even ∞.
    const away = s === i + 1 ? rotate(d, -Math.PI / 2) : side(d, d, out);
    const to = add(m, mul(away, GAP));
    second = [m, add(m, mul(d, loop)), add(m, mul(away, loop)), to];
    end = { at: to, dir: mul(away, -1) };
  } else {
    const q = places[t - 1].at;
    const chord = unit(sub(q, m));
    const dir = lens(reflect(d, chord), chord, s === t);
    const k = 0.38 * length(sub(q, m));
    const to = sub(q, mul(dir, GAP));
    second = [m, add(m, mul(d, k)), sub(to, mul(dir, k)), to];
    end = { at: to, dir };
  }
  return { segments: [first, second], start, end };
}

/** The point at parameter u ∈ [0, 1] of a cubic Bézier segment. */
export const bezier = ([p0, p1, p2, p3], u) => {
  const v = 1 - u;
  return add(add(mul(p0, v * v * v), mul(p1, 3 * v * v * u)), add(mul(p2, 3 * v * u * u), mul(p3, u * u * u)));
};

/** The curves of every link, already scaled into the SIZE box. */
export function glyphCurves(links) {
  const n = links.length;
  if (n < 1 || n > 4) throw new RangeError(`A symbol draws 1–4 links, got ${n}`);
  const places = layout(n);
  const curves = links.map((_, i) => linkCurve(links, i, places));
  const points = curves.flatMap((c) =>
    c.segments.flatMap((seg) => Array.from({ length: 17 }, (_, k) => bezier(seg, k / 16))),
  );
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min(SCALE, (SIZE - 2 * PAD) / Math.max(maxX - minX, maxY - minY, 1e-9));
  const shift = [SIZE / 2 - ((minX + maxX) / 2) * scale, SIZE / 2 - ((minY + maxY) / 2) * scale];
  const place = (p) => add(mul(p, scale), shift);
  return curves.map((c) => ({
    segments: c.segments.map((seg) => seg.map(place)),
    start: { at: place(c.start.at), dir: c.start.dir },
    end: { at: place(c.end.at), dir: c.end.dir },
  }));
}

const fmt = (p) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`;

/** One SVG path per link: the continuous line, the source bar and the target arrow. */
export function glyphPaths(links) {
  return glyphCurves(links).map(({ segments, start, end }, i) => {
    const line = `M${fmt(segments[0][0])}` + segments.map((seg) => `C${seg.slice(1).map(fmt).join(' ')}`).join('');
    const across = rotate(start.dir, Math.PI / 2);
    const bar = `M${fmt(add(start.at, mul(across, BAR)))}L${fmt(sub(start.at, mul(across, BAR)))}`;
    const back = mul(end.dir, -ARROW);
    const arrow =
      `M${fmt(add(end.at, rotate(back, ARROW_ANGLE)))}L${fmt(end.at)}` +
      `L${fmt(add(end.at, rotate(back, -ARROW_ANGLE)))}`;
    return { d: line + bar + arrow, color: COLORS[i] };
  });
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
