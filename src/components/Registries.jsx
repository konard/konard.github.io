import { formatCompact, formatNumber } from './format';

// One card per package registry. Units differ (npm reports monthly downloads,
// crates.io and NuGet report lifetime totals), so each card has its own scale.
export default function Registries({ registries }) {
  return (
    <ul className="registries">
      {registries.map((r) => {
        const max = Math.max(...r.top.map((p) => p.downloads));
        return (
          <li key={r.id} className="registry">
            <a className="registry__name" href={r.url} target="_blank" rel="noopener noreferrer">
              {r.name}
            </a>
            <div className="registry__numbers">
              <span>
                <strong>{formatNumber(r.packages)}</strong> packages
              </span>
              <span>
                <strong title={formatNumber(r.downloads)}>{formatCompact(r.downloads)}</strong> {r.downloadsUnit}
              </span>
            </div>
            <ul className="hbars hbars--compact" aria-label={`Top ${r.name} packages by ${r.downloadsUnit}`}>
              {r.top.map((p) => (
                <li key={p.name} className="hbars__row">
                  <a className="hbars__name" href={p.url} target="_blank" rel="noopener noreferrer">
                    {p.name}
                  </a>
                  <span className="hbars__track">
                    <span className="hbars__fill" style={{ width: `${(p.downloads / max) * 100}%` }} />
                  </span>
                  <span className="hbars__value" title={formatNumber(p.downloads)}>
                    {formatCompact(p.downloads)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
