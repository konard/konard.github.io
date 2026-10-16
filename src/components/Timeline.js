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

// Gantt-style timeline: one row per position, years on the x axis.
// Employment and open-source ventures differ by fill style (solid vs. hatched)
// as well as color, so the distinction never relies on color alone.
export default function Timeline({ items, endYear }) {
  const startYear = Math.floor(Math.min(...items.map((i) => toYear(i.start))));
  const span = endYear + 1 - startYear;
  const pos = (year) => ((year - startYear) / span) * 100;
  const ticks = [];
  for (let y = startYear; y <= endYear; y += 2) ticks.push(y);

  return (
    <div className="timeline">
      <ul className="legend" aria-label="Timeline legend">
        {Object.entries(TYPES).map(([type, label]) => (
          <li key={type}><span className={`legend__swatch timeline__swatch--${type}`} />{label}</li>
        ))}
      </ul>
      <div className="timeline__grid">
        <div className="timeline__axis" aria-hidden="true">
          {ticks.map((y) => (
            <span key={y} className="timeline__year" style={{ left: `${pos(y)}%` }}>{y}</span>
          ))}
        </div>
        <ol className="timeline__rows">
          {items.map((item) => {
            const from = toYear(item.start);
            const to = item.end ? toYear(item.end) + 1 / 12 : endYear + 1;
            const period = formatPeriod(item.start, item.end);
            const Title = item.url ? 'a' : 'span';
            return (
              <li key={item.id} className={`timeline__row timeline__row--${item.type}`}>
                <div className="timeline__label">
                  <Title
                    className="timeline__title"
                    {...(item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.title}
                  </Title>
                  <span className="timeline__meta">{item.role}</span>
                </div>
                <div className="timeline__track">
                  {ticks.map((y) => <span key={y} className="timeline__tick" style={{ left: `${pos(y)}%` }} />)}
                  <span
                    className={`timeline__bar timeline__bar--${item.type}${item.end ? '' : ' is-ongoing'}`}
                    style={{ left: `${pos(from)}%`, width: `${Math.max(0.8, pos(to) - pos(from))}%` }}
                  />
                </div>
                <div className="timeline__details">
                  <span className="timeline__period mono">{period}</span>
                  <p>{item.summary}</p>
                  <ul className="tags">
                    {item.tags.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
