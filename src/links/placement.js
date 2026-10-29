// A link's middle is a particle; its references are springs to other middles.
// 0 has no particle and a self-reference reserves loop space instead of a spring.
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';

const RAD = Math.PI / 180;
const rotate = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const golden = Math.PI * (3 - Math.sqrt(5));

function circle(n, spread, rotation) {
  if (n === 1) return [{ at: [0, 0], out: rotate([0, -1], rotation * RAD) }];
  const radius = (spread * 0.5) / Math.sin(Math.PI / n);
  const start = (n === 2 ? Math.PI : n === 4 ? (-3 * Math.PI) / 4 : -Math.PI / 2) + rotation * RAD;
  return Array.from({ length: n }, (_, i) => {
    const out = [Math.cos(start + (2 * Math.PI * i) / n), Math.sin(start + (2 * Math.PI * i) / n)];
    return { at: out.map((v) => v * radius), out };
  });
}

function square(n, columns) {
  const cols = Math.max(1, Math.min(n, Math.round(columns) || Math.ceil(Math.sqrt(n))));
  return Array.from({ length: n }, (_, i) => [i % cols, Math.floor(i / cols)]);
}

function hex(n) {
  const points = [[0, 0]];
  const steps = [
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [0, -1],
    [1, -1],
  ];
  for (let radius = 1; points.length < n; radius++) {
    let q = 0;
    let r = -radius;
    for (const [dq, dr] of steps) {
      for (let k = 0; k < radius && points.length < n; k++) {
        points.push([q + r / 2, (r * Math.sqrt(3)) / 2]);
        q += dq;
        r += dr;
      }
    }
  }
  return points.slice(0, n);
}

const dice = [
  [],
  [[0, 0]],
  [
    [-0.5, -0.5],
    [0.5, 0.5],
  ],
  [
    [-0.5, -0.5],
    [0, 0],
    [0.5, 0.5],
  ],
  [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ],
  [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0, 0],
    [-0.5, 0.5],
    [0.5, 0.5],
  ],
  [
    [-0.5, -1],
    [0.5, -1],
    [-0.5, 0],
    [0.5, 0],
    [-0.5, 1],
    [0.5, 1],
  ],
];
function card(n) {
  if (n <= 3) return Array.from({ length: n }, (_, i) => [0, i - (n - 1) / 2]);
  const pairs = Math.floor(n / 2);
  const points = Array.from({ length: pairs }, (_, i) => [
    [-0.7, i - (pairs - 1) / 2],
    [0.7, i - (pairs - 1) / 2],
  ]).flat();
  if (n % 2) points.push([0, 0]);
  return points;
}
function tiled(n, capacity, pattern) {
  const tiles = Math.ceil(n / capacity);
  const cols = Math.ceil(Math.sqrt(tiles));
  return Array.from({ length: tiles }, (_, i) =>
    pattern(Math.min(capacity, n - i * capacity)).map(([x, y]) => [x + (i % cols) * 4, y + Math.floor(i / cols) * 6]),
  ).flat();
}

let lastPhysical = null;
function physical(n, links, options) {
  // Solver candidates change endpoint angles, not the particles or springs.
  const key = JSON.stringify([n, links, options.forceDistance, options.forceCharge, options.forceCollision]);
  if (lastPhysical?.key === key) return lastPhysical.points;
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.sqrt(i + 0.5) * Math.cos(i * golden),
    y: Math.sqrt(i + 0.5) * Math.sin(i * golden),
  }));
  const springs = [];
  (links || []).forEach((pair, i) =>
    pair.forEach((ref) => {
      if (ref && ref !== i + 1) springs.push({ source: i, target: ref - 1 });
    }),
  );
  const simulation = forceSimulation(nodes)
    .stop()
    .force('center', forceCenter())
    .force('charge', forceManyBody().strength(-options.forceCharge))
    .force(
      'references',
      forceLink(springs)
        .id((node) => node.id)
        .distance(options.forceDistance)
        .strength(0.3),
    )
    .force(
      'loops',
      forceCollide((node) => {
        const self = (links?.[node.id] || []).filter((ref) => ref === node.id + 1).length;
        return options.forceCollision * (1 + self * 0.4);
      }).iterations(2),
    );
  // Static, deterministic output: no animation timer or random layout on reload.
  simulation.tick(180);
  const points = nodes.map(({ x, y }) => [x, y]);
  lastPhysical = { key, points };
  return points;
}

/** Space-filling strategies accept any finite number of links; circle stays automatic for 1–4. */
export function placeLinks(n, raw = {}, links = null) {
  if (!Number.isSafeInteger(n) || n < 1) return [];
  const options = {
    placement: 'circle',
    spread: 1,
    rotation: 0,
    layoutAspect: 1,
    columns: 0,
    forceDistance: 1,
    forceCharge: 0.6,
    forceCollision: 0.6,
    ...raw,
  };
  const kind = options.placement === 'auto' ? (n <= 4 ? 'circle' : 'hex') : options.placement;
  if (kind === 'circle') {
    const points = circle(n, options.spread, options.rotation);
    const order = String(options.order || '')
      .trim()
      .split(/\s+/)
      .map(Number);
    const valid =
      order.length === n && new Set(order).size === n && order.every((v) => Number.isInteger(v) && v >= 1 && v <= n);
    return points.map((_, i) => {
      const p = points[valid ? order.indexOf(i + 1) : i];
      return { ...p, at: [p.at[0] * options.layoutAspect, p.at[1]] };
    });
  }
  let points;
  if (kind === 'square') points = square(n, options.columns);
  else if (kind === 'hex') points = hex(n);
  else if (kind === 'dice') points = tiled(n, 6, (count) => dice[count]);
  else if (kind === 'cards') points = tiled(n, 10, card);
  else if (kind === 'force') points = physical(n, links, options);
  else
    points = Array.from({ length: n }, (_, i) => [
      Math.sqrt(i) * Math.cos(i * golden),
      Math.sqrt(i) * Math.sin(i * golden),
    ]);
  const center = points.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
  return points.map((p, i) => {
    const at = rotate(
      [(p[0] - center[0]) * options.spread * options.layoutAspect, (p[1] - center[1]) * options.spread],
      options.rotation * RAD,
    );
    const length = Math.hypot(...at);
    const out = length > 1e-9 ? at.map((v) => v / length) : rotate([0, -1], i * golden + options.rotation * RAD);
    return { at, out };
  });
}
