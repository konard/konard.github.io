/** One cancellable search. A replacement drawing terminates obsolete work. */
export function solverJob(payload) {
  let worker;
  let reject;
  const promise = new Promise((resolve, fail) => {
    reject = fail;
    worker = new Worker(new URL('./collision-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      worker.terminate();
      if (data.error) fail(new Error(data.error));
      else resolve(data.result);
    };
    worker.onerror = (event) => {
      worker.terminate();
      fail(new Error(event.message || 'Automatic spacing failed'));
    };
    worker.postMessage(payload);
  });
  return {
    promise,
    cancel() {
      worker?.terminate();
      reject(new DOMException('Drawing changed', 'AbortError'));
    },
  };
}
