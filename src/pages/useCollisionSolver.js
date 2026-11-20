import { useEffect, useMemo, useState } from 'react';
import { solveCollisions } from '../links/collisions';
import { solverJob } from '../links/solver-job';

/** Keyed results prevent an old worker from replacing a newer drawing. */
export function useCollisionSolver(key, enabled) {
  const [state, setState] = useState(null);
  // Non-browser renderers and unit tests have no Worker implementation.
  const fallback = useMemo(
    () => (enabled && typeof Worker === 'undefined' ? solveCollisions(...JSON.parse(key)) : null),
    [key, enabled],
  );
  useEffect(() => {
    if (!enabled || typeof Worker === 'undefined') return;
    const job = solverJob(JSON.parse(key));
    job.promise.then(
      (result) => setState({ key, result }),
      (error) => {
        if (error.name !== 'AbortError') setState({ key, error: error.message });
      },
    );
    return job.cancel;
  }, [key, enabled]);
  const result = enabled ? fallback || (state?.key === key ? state.result : null) : null;
  const error = enabled && state?.key === key ? state.error : null;
  return { result, error, busy: enabled && !result && !error };
}
