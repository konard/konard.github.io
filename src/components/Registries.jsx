import { formatCompact, formatNumber } from './format';

function Bars({ registry }) {
  const max = Math.max(...registry.top.map((p) => p.downloads || 0));
  return (
    <ul className="hbars hbars--compact" aria-label={`Top ${registry.name} packages by ${registry.downloadsUnit}`}>
      {registry.top.map((p) => (
        <li key={p.name} className="hbars__row">
          <a className="hbars__name" href={p.url} target="_blank" rel="noopener noreferrer">
            {p.name}
          </a>
          <span className="hbars__track">
            <span className="hbars__fill" style={{ width: `${max ? ((p.downloads || 0) / max) * 100 : 0}%` }} />
          </span>
          <span className="hbars__value" title={formatNumber(p.downloads || 0)}>
            {formatCompact(p.downloads || 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// One card per package registry. Units differ (npm and PyPI report monthly
// downloads, crates.io and NuGet lifetime totals, Docker Hub pulls; Go, Nimble
// and Homebrew publish no counts), so each card has its own scale.
export default function Registries({ registries, summary }) {
  return (
    <>
      <ul className="registries">
        {registries.map((r) => (
          <li key={r.id} className="registry">
            <a className="registry__name" href={r.url} target="_blank" rel="noopener noreferrer">
              {r.name}
            </a>
            <div className="registry__numbers">
              <span>
                <strong>{formatNumber(r.packages)}</strong> packages
              </span>
              {r.downloadsUnit ? (
                <span>
                  <strong title={formatNumber(r.downloads)}>{formatCompact(r.downloads)}</strong> {r.downloadsUnit}
                </span>
              ) : (
                <span className="muted">no public download counts</span>
              )}
            </div>
            {r.downloadsUnit ? (
              <Bars registry={r} />
            ) : (
              <ul className="registry__packages">
                {r.top.map((p) => (
                  <li key={p.name}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mono">
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {summary && (
        <p className="registries__note muted">
          {summary.checked} registries checked on {summary.collectedAt.slice(0, 10)}, by account and by the manifests of
          every original repository; packages of forks and mirrors are not counted. Nothing published on{' '}
          {summary.empty.join(', ')}.{summary.blocked.map((b) => ` ${b.name}: ${b.note}.`)}
        </p>
      )}
    </>
  );
}
