// The framework's foreign-DOM adapter inspects React content as well as its
// own controls. Load the inspector only when explicitly activated.
export function installDevMode(target = window) {
  let active = true;
  let pending;
  let controller;
  const open = () => {
    if (pending) return pending;
    pending = import('@link-foundation/ui-devmode/foreign')
      .then(async ({ mountForeignDevMode }) => {
        if (active) controller = await mountForeignDevMode({ window: target });
        if (!active) await controller?.destroy();
      })
      .catch((error) => {
        if (active) console.warn('The UI inspector is unavailable.', error);
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
  const key = (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyD') {
      event.preventDefault();
      void open();
    }
  };
  target.addEventListener('keydown', key);
  if (new URLSearchParams(target.location.search).has('ui-dev')) void open();
  return () => {
    active = false;
    target.removeEventListener('keydown', key);
    void controller?.destroy();
  };
}
