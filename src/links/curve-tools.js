const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Exact de Casteljau subdivision, preserving the cubic's endpoint tangents. */
export function splitCurve([a, b, c, d], t) {
  const [ab, bc, cd] = [mix(a, b, t), mix(b, c, t), mix(c, d, t)];
  const [abc, bcd] = [mix(ab, bc, t), mix(bc, cd, t)];
  const at = mix(abc, bcd, t);
  return [
    [a, ab, abc, at],
    [at, bcd, cd, d],
  ];
}

/** Trim an arc length from one end; a fully consumed half is omitted. */
export function trimCurve(segment, amount, fromStart = false) {
  if (amount <= 0) return segment;
  const curve = fromStart ? segment : [...segment].reverse();
  let previous = curve[0];
  let travelled = 0;
  for (let k = 1; k <= 128; k++) {
    const point = splitCurve(curve, k / 128)[0][3];
    const step = distance(previous, point);
    if (travelled + step >= amount) {
      const t = (k - 1 + (amount - travelled) / Math.max(step, 1e-12)) / 128;
      const kept = splitCurve(curve, t)[1];
      return fromStart ? kept : kept.reverse();
    }
    travelled += step;
    previous = point;
  }
  return null;
}

const evaluate = ([a, b, c, d], t) => {
  const u = 1 - t;
  return a.map((v, i) => u * u * u * v + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]);
};
const tangent = ([a, b, c, d], t) => {
  const u = 1 - t;
  let dir = a.map((v, i) => 3 * u * u * (b[i] - v) + 6 * u * t * (c[i] - b[i]) + 3 * t * t * (d[i] - c[i]));
  if (Math.hypot(...dir) < 1e-10) {
    dir = evaluate([a, b, c, d], Math.min(1, t + 1e-5)).map(
      (v, i) => v - evaluate([a, b, c, d], Math.max(0, t - 1e-5))[i],
    );
  }
  const length = Math.hypot(...dir);
  return length < 1e-12 ? [1, 0] : dir.map((v) => v / length);
};

/** Arc-length placement on a cubic chain; out-of-path offsets extend its end tangent.
 * A bounded 256-sample table per cubic gives sub-pixel accuracy in the 100-unit box.
 * Middle offsets start at the join, positive in the direction of the line.
 */
export function pointAlongCurve(segments, offset, origin = 'start') {
  const table = [{ length: 0, segment: 0, t: 0 }];
  let length = 0;
  let middleLength = 0;
  for (let i = 0; i < segments.length; i++) {
    let previous = segments[i][0];
    for (let k = 1; k <= 256; k++) {
      const t = k / 256;
      const point = evaluate(segments[i], t);
      length += distance(previous, point);
      table.push({ length, segment: i, t });
      previous = point;
    }
    if (i === 0) middleLength = length;
  }
  const target = offset + (origin === 'end' ? length : origin === 'middle' ? middleLength : 0);
  if (target <= 0 || target >= length) {
    const first = target <= 0;
    const segment = first ? segments[0] : segments.at(-1);
    const at = first ? segment[0] : segment[3];
    const dir = tangent(segment, first ? 0 : 1);
    return { at: at.map((v, i) => v + dir[i] * (first ? target : target - length)), dir };
  }
  let lo = 1;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid].length < target) lo = mid + 1;
    else hi = mid;
  }
  const right = table[lo];
  const left = table[lo - 1];
  const startT = left.segment === right.segment ? left.t : 0;
  const t = startT + ((right.t - startT) * (target - left.length)) / Math.max(right.length - left.length, 1e-12);
  return { at: evaluate(segments[right.segment], t), dir: tangent(segments[right.segment], t) };
}
