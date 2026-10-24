// Helpers that describe one setting each (issue #13, split out in issue #15):
// `range` is a slider, `toggle` a switch, `select` a list of choices and
// `color` a colour picker. `extra` adds `unit`, `hint` and the like.

export const range = (key, d, min, max, step, label, extra = {}) => ({
  key,
  type: 'range',
  d,
  min,
  max,
  step,
  label,
  ...extra,
});
export const toggle = (key, d, label, extra = {}) => ({ key, type: 'toggle', d, label, ...extra });
export const select = (key, d, options, label, extra = {}) => ({ key, type: 'select', d, options, label, ...extra });
export const color = (key, d, label, extra = {}) => ({ key, type: 'color', d, label, ...extra });
export const option = (value, en, ru = en) => ({ value, label: { en, ru } });

const decimals = (step) => (String(step).split('.')[1] || '').length;

/**
 * A value as people read it: shares as percents (0.6 → 60%), factors with ×,
 * the rest with its unit (75 ms, 64 px, 90°). Used by the settings page and
 * the network editor (issue #17).
 */
export function formatValue(field, value) {
  const { unit = '', step = 1, max } = field;
  if (unit === '%' && max <= 2) return `${Math.round(value * 100)}%`;
  const number = value.toFixed(decimals(step));
  if (unit === '%' || unit === '×' || unit === '°') return `${number}${unit}`;
  return unit ? `${number} ${unit}` : number;
}
