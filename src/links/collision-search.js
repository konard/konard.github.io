// Small automatic layouts can change their circular order and compact spacing.
// Enumerate bounded candidates deterministically; keep the user's turn/gap bounds
// and verify every result against the exact fitted drawing, including self loops.
import { overlapCost, solveCollisions, turningCost } from './collisions';

function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap((value, i) => permutations(values.filter((_, j) => j !== i)).map((rest) => [value, ...rest]));
}

export function searchCollisionLayouts(links, base, result, options) {
  if (links.length > 4 || base.clearance == null || base.placement !== 'auto' || base.order || !options.adjustGaps)
    return result;
  const { range = 180, passes = 3 } = options;
  if (range <= 0 || passes <= 0) return result;
  const orders = permutations(Array.from({ length: links.length - 1 }, (_, i) => i + 2)).map((rest) =>
    [1, ...rest].join(' '),
  );
  const candidates = [1, 0.85, 0.7, 0.55]
    .flatMap((factor) =>
      orders
        .filter((order) => factor !== 1 || order !== orders[0])
        .map((order) => {
          // Apply normalizes editor spread to >= .1; preview must use that same
          // representable value so compact layouts survive URL/Apply round trips.
          const layout = { order, spread: Math.max(0.1, Math.round(base.spread * factor * 1000) / 1000) };
          return { layout, cost: overlapCost(links, { ...base, ...layout }) + (1 - factor) * 0.01 };
        }),
    )
    .sort((a, b) => a.cost - b.cost);
  let best = result;
  const coarse = Math.ceil(13 / Math.max(1, options.step || 1)) * Math.max(1, options.step || 1);
  const probes = [];
  for (const { layout } of candidates) {
    const found = solveCollisions(
      links,
      { ...base, ...layout },
      { ...options, step: coarse, passes: 1, search: false },
    );
    probes.push({ layout, cost: found.after });
    if (found.after < best.after - 1e-9) best = { ...found, layout, before: result.before };
    if (best.after - turningCost(best.turns) <= 1e-9) return best;
  }
  for (const { layout } of probes.sort((a, b) => a.cost - b.cost)) {
    const found = solveCollisions(links, { ...base, ...layout }, { ...options, search: false });
    if (found.after < best.after - 1e-9) best = { ...found, layout, before: result.before };
    if (best.after - turningCost(best.turns) <= 1e-9) return best;
  }
  return best;
}
