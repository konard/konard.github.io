import { formatNumber, formatPercent, SERIES } from './format';
import { Tooltip, useTooltip } from './Tooltip';

const LIMIT = 10;

export function topWithOther(languages, limit = LIMIT) {
  const top = languages.slice(0, limit);
  const rest = languages.slice(limit).reduce((sum, l) => sum + l.count, 0);
  return rest > 0 ? [...top, { name: 'Other', count: rest, isOther: true }] : top;
}

export default function LanguagesChart({ languages, favorites }) {
  const { tip, show, hide } = useTooltip();
  const rows = topWithOther(languages);
  const total = rows.reduce((sum, l) => sum + l.count, 0);
  const max = Math.max(...rows.map((l) => l.count));

  const tipContent = (l) => (
    <>
      <strong>{l.name}{favorites.includes(l.name) ? ' ★' : ''}</strong>
      <span className="tooltip__value">{formatNumber(l.count)} repositories</span>
      <span className="tooltip__row">{formatPercent(l.count / total)} of repositories with a detected language</span>
    </>
  );

  return (
    <div className="chart" data-tooltip-root>
      <p className="chart__caption">
        Primary language of {formatNumber(total)} original public repositories with a detected language (personal + organizations).
        <span className="muted"> ★ = favorite language</span>
      </p>
      <ul className="hbars" aria-label="Repositories by primary language">
        {rows.map((l) => (
          <li
            key={l.name}
            className={`hbars__row${l.isOther ? ' is-other' : ''}`}
            tabIndex={0}
            onPointerMove={(e) => show(e, tipContent(l))}
            onFocus={(e) => show(e, tipContent(l))}
            onPointerLeave={hide}
            onBlur={hide}
          >
            <span className="hbars__name">
              {l.name}
              {favorites.includes(l.name) && <span className="hbars__fav" aria-label="favorite"> ★</span>}
            </span>
            <span className="hbars__track">
              <span
                className="hbars__fill"
                style={{ width: `${(l.count / max) * 100}%`, background: l.isOther ? 'var(--muted)' : SERIES[0] }}
              />
            </span>
            <span className="hbars__value">{formatNumber(l.count)}</span>
          </li>
        ))}
      </ul>
      <Tooltip tip={tip} />
    </div>
  );
}
