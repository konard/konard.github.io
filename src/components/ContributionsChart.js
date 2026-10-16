import { useMemo, useState } from 'react';
import { formatCompact, formatNumber, formatPercent, SERIES } from './format';
import { Tooltip, useTooltip } from './Tooltip';

const WIDTH = 760;
const HEIGHT = 280;
const PAD = { top: 28, right: 12, bottom: 32, left: 48 };

const MIX = [
  { key: 'commits', label: 'Commits' },
  { key: 'pullRequests', label: 'Pull requests' },
  { key: 'issues', label: 'Issues' },
  { key: 'reviews', label: 'Reviews' },
];

function niceTicks(max, scale) {
  if (scale === 'log') {
    const ticks = [1];
    while (ticks[ticks.length - 1] * 10 <= max * 1.0001) ticks.push(ticks[ticks.length - 1] * 10);
    return ticks;
  }
  const step = 10 ** Math.floor(Math.log10(max)) * (max / 10 ** Math.floor(Math.log10(max)) > 5 ? 2 : 1);
  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);
  return ticks;
}

export function contributionScale(scale, max, height) {
  if (scale === 'log') {
    const top = Math.log10(max + 1);
    return (v) => (Math.log10(v + 1) / top) * height;
  }
  return (v) => (v / max) * height;
}

export default function ContributionsChart({ data }) {
  const [scale, setScale] = useState('log');
  const { tip, show, hide } = useTooltip();
  const max = Math.max(...data.map((d) => d.total));
  const peak = data.reduce((a, b) => (b.total > a.total ? b : a));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const barW = Math.max(4, band - 2 - band * 0.35);
  const y = contributionScale(scale, max, innerH);
  const ticks = niceTicks(max, scale);

  const mix = useMemo(() => {
    const totals = MIX.map((m) => ({ ...m, value: data.reduce((s, d) => s + (d[m.key] || 0), 0) }));
    const sum = totals.reduce((s, m) => s + m.value, 0);
    return totals.map((m) => ({ ...m, share: m.value / sum }));
  }, [data]);

  const tipContent = (d) => (
    <>
      <strong>{d.year}</strong>
      <span className="tooltip__value">{formatNumber(d.total)} contributions</span>
      {MIX.map((m) => (
        <span key={m.key} className="tooltip__row">{m.label}: {formatNumber(d[m.key])}</span>
      ))}
    </>
  );

  return (
    <div className="chart" data-tooltip-root>
      <div className="chart__toolbar">
        <p className="chart__caption">
          Public GitHub contributions per year · peak <strong>{formatNumber(peak.total)}</strong> in {peak.year}
        </p>
        <div className="segmented" role="group" aria-label="Y axis scale">
          {['log', 'linear'].map((s) => (
            <button
              key={s}
              type="button"
              className={scale === s ? 'is-active' : ''}
              aria-pressed={scale === s}
              onClick={() => setScale(s)}
            >
              {s === 'log' ? 'Log scale' : 'Linear'}
            </button>
          ))}
        </div>
      </div>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Bar chart of contributions per year from ${data[0].year} to ${data[data.length - 1].year}, ${scale} scale`}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t) => (
            <g key={t} transform={`translate(0,${innerH - y(t)})`}>
              <line className="chart__grid" x1={0} x2={innerW} />
              <text className="chart__tick" x={-8} dy="0.32em" textAnchor="end">{formatCompact(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const h = Math.max(d.total > 0 ? 2 : 0, y(d.total));
            const x = i * band + (band - barW) / 2;
            const r = Math.min(4, barW / 2, h);
            // Direct-label only local peaks; the tooltip and table carry the rest.
            const isLabeled = d.total > (data[i - 1]?.total ?? 0) && d.total >= (data[i + 1]?.total ?? 0);
            return (
              <g key={d.year}>
                <path
                  className="chart__bar"
                  fill={SERIES[0]}
                  d={`M${x},${innerH} V${innerH - h + r} Q${x},${innerH - h} ${x + r},${innerH - h} H${x + barW - r} Q${x + barW},${innerH - h} ${x + barW},${innerH - h + r} V${innerH} Z`}
                />
                {isLabeled && d.total > 0 && (
                  <text className="chart__label" x={x + barW / 2} y={innerH - h - 6} textAnchor="middle">
                    {formatCompact(d.total)}
                  </text>
                )}
                <text className="chart__tick" x={x + barW / 2} y={innerH + 18} textAnchor="middle">
                  {`'${String(d.year).slice(2)}`}
                </text>
                <rect
                  className="chart__hit"
                  x={i * band}
                  y={0}
                  width={band}
                  height={innerH}
                  tabIndex={0}
                  aria-label={`${d.year}: ${formatNumber(d.total)} contributions`}
                  onPointerMove={(e) => show(e, tipContent(d))}
                  onFocus={(e) => show(e, tipContent(d))}
                  onPointerLeave={hide}
                  onBlur={hide}
                />
              </g>
            );
          })}
          <line className="chart__axis" x1={0} x2={innerW} y1={innerH} y2={innerH} />
        </g>
      </svg>
      <Tooltip tip={tip} />

      <div className="mix" aria-label="Contribution mix across all years">
        <div className="mix__bar">
          {mix.map((m, i) => (
            <span
              key={m.key}
              className="mix__segment"
              style={{ flexGrow: m.share, background: SERIES[i] }}
              title={`${m.label}: ${formatNumber(m.value)} (${formatPercent(m.share)})`}
            />
          ))}
        </div>
        <ul className="legend">
          {mix.map((m, i) => (
            <li key={m.key}>
              <span className="legend__swatch" style={{ background: SERIES[i] }} />
              {m.label} <strong>{formatNumber(m.value)}</strong> <span className="muted">{formatPercent(m.share)}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="table-view">
        <summary>Show data table</summary>
        <table>
          <thead>
            <tr><th>Year</th><th>Total</th>{MIX.map((m) => <th key={m.key}>{m.label}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year}>
                <td>{d.year}</td><td>{formatNumber(d.total)}</td>
                {MIX.map((m) => <td key={m.key}>{formatNumber(d[m.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
