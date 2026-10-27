/** Consistent range keys across engines. Number fields keep text navigation
 * and platform editing shortcuts; blank overrides step from their inheritance.
 */
export function numericKey(event, change, fallback = 0) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const input = event.currentTarget;
  const range = input.type === 'range';
  const directions = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
  if (range) Object.assign(directions, { ArrowRight: 1, ArrowLeft: -1 });
  const direction = directions[event.key];
  const boundary = range && ['Home', 'End'].includes(event.key);
  if (!direction && !boundary) return;
  event.preventDefault();
  const min = input.min === '' ? -Infinity : Number(input.min);
  const max = input.max === '' ? Infinity : Number(input.max);
  const step = Number(input.step) || 1;
  const current = input.value === '' ? fallback : Number(input.value);
  const base = Number.isFinite(min) ? min : 0;
  const position = (current - base) / step;
  const ticks = direction * (event.shiftKey && Math.abs(direction) === 1 ? 10 : 1);
  const snapped = direction > 0 ? Math.floor(position + 1e-9) : Math.ceil(position - 1e-9);
  const next = boundary ? (event.key === 'Home' ? min : max) : base + (snapped + ticks) * step;
  // Avoid accumulating binary decimal error in React state and shared URLs.
  change(Number(Math.min(max, Math.max(min, next)).toFixed(10)));
}
