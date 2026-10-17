import { Tooltip, useTooltip } from './Tooltip';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM' -> fractional year (start of month).
export const toYear = (ym) => {
  const [year, month] = ym.split('-').map(Number);
  return year + (month - 1) / 12;
};

export const formatPeriod = (start, end) => {
  const fmt = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  };
  return `${fmt(start)} – ${end ? fmt(end) : 'present'}`;
};

const TYPES = {
  company: 'Employment',
  'open-source': 'Founded / led open-source',
};

const linkProps = (url) => (url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {});

// Gantt-style overview (one row per position, years on the x axis) followed by
// position cards, most recent first. Employment and open-source ventures differ
// by fill style (solid vs. hatched) as well as color, so the distinction never
// relies on color alone.
export default function Timeline({ items, endYear }) {
  const { tip, show, hide } = useTooltip();
  const startYear = Math.floor(Math.min(...items.map((i) => toYear(i.start))));
  const span = endYear + 1 - startYear;
  const pos = (year) => ((year - startYear) / span) * 100;
  const ticks = [];
  for (let y = startYear; y <= endYear; y += 2) ticks.push(y);
  const recentFirst = [...items].sort(
    (a, b) => (b.end || '9999').localeCompare(a.end || '9999') || b.start.localeCompare(a.start),
  );

  const tipContent = (item) => (
    <>
      <strong>{item.title}</strong>
      <span className="tooltip__value">{formatPeriod(item.start, item.end)}</span>
      <span className="tooltip__row">
        {item.role} · {TYPES[item.type]}
      </span>
    </>
  );

  return (
    <div className="timeline">
      <div className="chart timeline__chart" data-tooltip-root>
        <ul className="legend" aria-label="Timeline legend">
          {Object.entries(TYPES).map(([type, label]) => (
            <li key={type}>
              <span className={`legend__swatch timeline__swatch--${type}`} />
              {label}
            </li>
          ))}
        </ul>
        <div className="timeline__axis" aria-hidden="true">
          {ticks.map((y) => (
            <span key={y} className="timeline__year" style={{ left: `${pos(y)}%` }}>
              {y}
            </span>
          ))}
        </div>
        <ol className="timeline__rows" aria-label="Career timeline">
          {items.map((item) => {
            const from = toYear(item.start);
            const to = item.end ? toYear(item.end) + 1 / 12 : endYear + 1;
            return (
              <li key={item.id} className="timeline__row">
                <span className="timeline__label">{item.title}</span>
                <span className="timeline__track">
                  {ticks.map((y) => (
                    <span key={y} className="timeline__tick" style={{ left: `${pos(y)}%` }} />
                  ))}
                  <span
                    className={`timeline__bar timeline__bar--${item.type}${item.end ? '' : ' is-ongoing'}`}
                    style={{ left: `${pos(from)}%`, width: `${Math.max(0.8, pos(to) - pos(from))}%` }}
                    tabIndex={0}
                    aria-label={`${item.title}, ${item.role}: ${formatPeriod(item.start, item.end)}`}
                    onPointerMove={(e) => show(e, tipContent(item))}
                    onFocus={(e) => show(e, tipContent(item))}
                    onPointerLeave={hide}
                    onBlur={hide}
                  />
                </span>
              </li>
            );
          })}
        </ol>
        <Tooltip tip={tip} />
      </div>

      <ol className="positions">
        {recentFirst.map((item) => {
          const Title = item.url ? 'a' : 'span';
          return (
            <li key={item.id} className={`position position--${item.type}`}>
              <span className="position__period mono">{formatPeriod(item.start, item.end)}</span>
              <h3 className="position__title">
                <Title {...linkProps(item.url)}>{item.title}</Title>
              </h3>
              <span className="position__role">{item.role}</span>
              <p className="position__summary">{item.summary}</p>
              <ul className="tags">
                {item.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
