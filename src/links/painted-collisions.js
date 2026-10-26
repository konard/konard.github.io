// Collision scoring of painted pieces in layout units. Distances are between
// segments, not just sampled vertices, so parallel close strokes are detected.
// Middle disks and marker interiors are included; intentional attachment of a
// marker to its own shaft is excluded by the caller.
const pointDistance2 = (p, a, b) => {
  const x = b[0] - a[0];
  const y = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * x + (p[1] - a[1]) * y) / (x * x + y * y || 1)));
  return (p[0] - a[0] - t * x) ** 2 + (p[1] - a[1] - t * y) ** 2;
};
const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const intersects = (a, b, c, d) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
const inside = (p, polygon) => {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) yes = !yes;
  }
  return yes;
};
const segmentCache = new WeakMap();
const segments = (line) => {
  if (segmentCache.has(line)) return segmentCache.get(line);
  const result = [];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    if (a && b)
      result.push({
        a,
        b,
        x0: Math.min(a[0], b[0]),
        x1: Math.max(a[0], b[0]),
        y0: Math.min(a[1], b[1]),
        y1: Math.max(a[1], b[1]),
      });
  }
  segmentCache.set(line, result);
  return result;
};
export function paintedPairCost(a, b) {
  const stroke = ((a.width || 0) + (b.width || 0)) / 2;
  const clearance = Math.max(a.clearance || 0, b.clearance || 0);
  const near = stroke + clearance;
  let cost = 0;
  for (const first of segments(a)) {
    const p = first.a;
    const q = first.b;
    for (const second of segments(b)) {
      if (
        first.x1 + near < second.x0 ||
        second.x1 + near < first.x0 ||
        first.y1 + near < second.y0 ||
        second.y1 + near < first.y0
      )
        continue;
      const r = second.a;
      const s = second.b;
      const crosses = intersects(p, q, r, s);
      const distance = crosses
        ? 0
        : Math.sqrt(
            Math.min(
              pointDistance2(p, r, s),
              pointDistance2(q, r, s),
              pointDistance2(r, p, q),
              pointDistance2(s, p, q),
            ),
          );
      if (distance < near) {
        // Overlap dominates clearance preference. Continuous distance terms
        // give gap search a gradient even when no crossing count changes.
        cost += (crosses ? 1 : 0) + 0.25 * (1 - distance / Math.max(near, 1e-12));
        if (distance < stroke) cost += 0.5 * (1 - distance / Math.max(stroke, 1e-12));
      }
    }
  }
  for (const [first, second] of [
    [a, b],
    [b, a],
  ])
    for (const polygon of second.fills || []) if (first.some((point) => point && inside(point, polygon))) cost += 2;
  return cost;
}
export const selfCost = (line) => line.self || 0;
