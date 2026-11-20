import { createSolverJob } from '@link-foundation/ui-components/links-view';
import { solveCollisions } from './collisions';
import workerUrl from './collision-worker.js?worker&url';

export function solverJob(links, shape, options) {
  const controller = new AbortController();
  const solve = createSolverJob((items, input) => solveCollisions(items, input.shape, input.options), { workerUrl });
  return {
    promise: solve(links, { shape, options }, { signal: controller.signal }),
    cancel: () => controller.abort(),
  };
}
