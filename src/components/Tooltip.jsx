import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

/** The element a tooltip is drawn in: the app, which is positioned, or the page. */
const layerOf = (element) => element.closest('.app') ?? element.ownerDocument.body;

/** The origin of the absolute positions of a layer, in client coordinates. */
const originOf = (layer) =>
  (layer === layer.ownerDocument.body ? layer.ownerDocument.documentElement : layer).getBoundingClientRect();

// Shared hover tooltip: charts call `show(event, content)` on pointer
// move/focus and `hide()` on leave. The tooltip is drawn outside the chart
// (issue #47): a chart is cut to the outline of its frame like every other
// panel, so its corners stay transparent, and a tooltip near its edge is not
// cut with it. It flips to the left in the right part of the chart.
export function useTooltip() {
  const [tip, setTip] = useState(null);
  const show = useCallback((event, content) => {
    const element = event.currentTarget;
    const box = element.closest('[data-tooltip-root]').getBoundingClientRect();
    let x;
    let y;
    if (event.clientX === undefined || (event.clientX === 0 && event.clientY === 0)) {
      const target = element.getBoundingClientRect();
      x = target.left + target.width / 2;
      y = target.top;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    const layer = layerOf(element);
    const origin = originOf(layer);
    setTip({ x: x - origin.left, y: y - origin.top, layer, content, flip: x - box.left > box.width * 0.6 });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

export function Tooltip({ tip }) {
  if (!tip) return null;
  return createPortal(
    <div className={`tooltip${tip.flip ? ' tooltip--flip' : ''}`} role="status" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>,
    tip.layer,
  );
}
