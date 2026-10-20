import { formatNumber } from './format';

/**
 * Every language GitHub detected in original repositories, sized by the
 * number of repositories using it, plus languages known from other sources
 * (CodersRank, Habr Career, gists) that GitHub does not detect.
 */
export default function LanguageCloud({ languages, extra = [], favorites = [] }) {
  const detected = new Set(languages.map((l) => l.name));
  const max = Math.log(Math.max(...languages.map((l) => l.count)) + 1);
  const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
  const others = extra.filter((name) => !detected.has(name));
  return (
    <div className="cloud">
      <p className="chart__caption">
        All {formatNumber(languages.length)} languages detected by GitHub
        {others.length > 0 && <> and {others.length} more from the skills list</>}. Size shows how many repositories use
        the language.
      </p>
      <ul className="cloud__list" aria-label="All languages">
        {sorted.map((l) => (
          <li
            key={l.name}
            className={favorites.includes(l.name) ? 'is-favorite' : undefined}
            style={{ '--weight': (Math.log(l.count + 1) / max).toFixed(3), '--color': l.color || 'var(--text-2)' }}
            title={`${l.name}: ${formatNumber(l.count)} repositories, primary in ${formatNumber(l.primary)}`}
          >
            {l.name}
            <span className="cloud__count">{formatNumber(l.count)}</span>
          </li>
        ))}
        {others.map((name) => (
          <li key={name} className="is-extra" title={`${name}: known from the skills list`}>
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
