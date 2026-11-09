import { nextValue } from '@link-foundation/ui-components/controls';

/** Consistent range keys across engines. Number fields keep text navigation
 * and platform editing shortcuts; blank overrides step from their inheritance.
 */
export function focusSlider(event) {
  // Safari's pointer-focus policy depends on platform settings. Establish
  // focus on pointer down and again on click: its native mouse action may
  // clear early focus. Neither handler cancels thumb dragging or scrolling.
  event.currentTarget.focus({ preventScroll: true });
}

export function numericKey(event, change, fallback = 0) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const input = event.currentTarget;
  const range = input.type === 'range';
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'];
  if (range) keys.push('ArrowLeft', 'ArrowRight', 'Home', 'End');
  if (!keys.includes(event.key)) return;
  const next = nextValue(event.key, {
    value: input.value === '' ? fallback : Number(input.value),
    min: input.min === '' ? undefined : Number(input.min),
    max: input.max === '' ? undefined : Number(input.max),
    step: Number(input.step) || 1,
    // Preserve the site's ten-step Page keys; Shift multiplies arrow keys.
    shift: event.shiftKey && !event.key.startsWith('Page'),
    snapping: 'directional',
  });
  if (next === null) return;
  event.preventDefault();
  change(next);
}
