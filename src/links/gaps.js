// Per-link overrides share the global units: reference gaps in layout units,
// middle cuts in 1/100 of the symbol. Null inherits, including after global edits.
export const GAP_FIELDS = [
  { key: 'startGap', max: 1, step: 0.01, label: { en: 'Gap at the source reference', ru: 'Зазор у начальной ссылки' } },
  { key: 'endGap', max: 1, step: 0.01, label: { en: 'Gap at the target reference', ru: 'Зазор у конечной ссылки' } },
  { key: 'middleGapStart', max: 30, step: 0.1, label: { en: 'Cut before the middle', ru: 'Разрыв перед серединой' } },
  { key: 'middleGapEnd', max: 30, step: 0.1, label: { en: 'Cut after the middle', ru: 'Разрыв после середины' } },
];
export function normalizeGaps(value) {
  const rows = String(value ?? '')
    .split(',')
    .map((row) => {
      const values = row.trim().split(/\s+/);
      return GAP_FIELDS.map(({ max }, i) => {
        const raw = values[i];
        const number = raw === undefined || raw === '~' || raw === '' ? NaN : Number(raw);
        return Number.isFinite(number) ? Math.round(Math.min(max, Math.max(0, number)) * 1000) / 1000 : null;
      });
    });
  while (rows.length && rows.at(-1).every((v) => v === null)) rows.pop();
  return rows.map((row) => row.map((v) => (v === null ? '~' : v)).join(' ')).join(',');
}
export function linkGaps(style, n) {
  const rows = style.gaps
    ? style.gaps.split(',').map((row) => row.split(' ').map((v) => (v === '~' ? null : Number(v))))
    : [];
  return Array.from({ length: n }, (_, i) => rows[i] || [null, null, null, null]);
}
export const gapsText = (rows) => rows.map((row) => row.map((v) => (v == null ? '~' : v)).join(' ')).join(',');
export const withGaps = (style, rows) => ({ ...style, gaps: normalizeGaps(gapsText(rows)) });
