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
