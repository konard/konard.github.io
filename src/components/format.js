const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatNumber = (value) => numberFormat.format(value);
export const formatCompact = (value) => compactFormat.format(value);
export const formatPercent = (value) => `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;

// Categorical slots validated for the dark surface (#0d1220) with the dataviz
// palette validator: CVD ΔE ≥ 8.4 on adjacent pairs, contrast ≥ 3:1.
export const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
