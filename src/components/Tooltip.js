import { useCallback, useState } from 'react';

// Shared hover tooltip: charts call `show(event, content)` on pointer
// move/focus and `hide()` on leave; the container must be position: relative.
export function useTooltip() {
  const [tip, setTip] = useState(null);
  const show = useCallback((event, content) => {
    const box = event.currentTarget.closest('[data-tooltip-root]').getBoundingClientRect();
    let x;
    let y;
    if (event.clientX === undefined || (event.clientX === 0 && event.clientY === 0)) {
      const target = event.currentTarget.getBoundingClientRect();
      x = target.left + target.width / 2 - box.left;
      y = target.top - box.top;
    } else {
      x = event.clientX - box.left;
      y = event.clientY - box.top;
    }
    setTip({ x, y, content, flip: x > box.width * 0.6 });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

export function Tooltip({ tip }) {
  if (!tip) return null;
  return (
    <div
      className={`tooltip${tip.flip ? ' tooltip--flip' : ''}`}
      role="status"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.content}
    </div>
  );
}
