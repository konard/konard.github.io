import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useCollisionSolver } from './useCollisionSolver';

const workers = [];
class FakeWorker {
  constructor() {
    workers.push(this);
  }
  postMessage = vi.fn();
  terminate = vi.fn();
  send(data) {
    this.onmessage({ data });
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  workers.length = 0;
});
const key = (code) => JSON.stringify([code, {}, {}]);
it('cancels obsolete work and accepts only the result for the current drawing', async () => {
  vi.stubGlobal('Worker', FakeWorker);
  const { result, rerender, unmount } = renderHook(({ value }) => useCollisionSolver(value, true), {
    initialProps: { value: key([[1, 1]]) },
  });
  expect(result.current.busy).toBe(true);
  expect(workers[0].postMessage).toHaveBeenCalledWith([[[1, 1]], {}, {}]);
  rerender({ value: key([[0, 0]]) });
  expect(workers[0].terminate).toHaveBeenCalled();
  await act(async () => workers[0].send({ result: { after: 99 } }));
  expect(result.current.result).toBeNull();
  await act(async () => workers[1].send({ result: { after: 0 } }));
  expect(result.current.result).toEqual({ after: 0 });
  expect(result.current.busy).toBe(false);
  unmount();
  expect(workers[1].terminate).toHaveBeenCalled();
});
it('surfaces worker startup failures and releases the pending state', async () => {
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('Worker unavailable');
      }
    },
  );
  const { result } = renderHook(() => useCollisionSolver(key([[0, 0]]), true));
  await act(async () => {});
  expect(result.current.error).toBe('Worker unavailable');
  expect(result.current.busy).toBe(false);
});
it('does not start a worker while automatic spacing is off', () => {
  vi.stubGlobal('Worker', FakeWorker);
  const { result } = renderHook(() => useCollisionSolver(key([[0, 0]]), false));
  expect(workers).toHaveLength(0);
  expect(result.current).toMatchObject({ result: null, busy: false });
});
