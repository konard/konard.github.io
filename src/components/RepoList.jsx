import { useMemo, useState } from 'react';
import { fields } from '../data/fields';
import { githubUrl, KINDS, matches, SORTS } from '../pages/repos';
import { useQueryParam } from '../pages/query';
import { formatNumber } from './format';

const FIELD_NAMES = Object.fromEntries(fields.map((f) => [f.id, f.name]));

/** One repository row: name, description, language, stars, last push and fields. */
export function RepoItem({ repo, note = null }) {
  return (
    <li className="repo">
      <div className="repo__head">
        <a href={githubUrl(repo)} target="_blank" rel="noopener noreferrer" className="repo__name">
          <span className="muted">{repo.owner}/</span>
          {repo.name}
        </a>
        <span className="repo__meta mono">
          {repo.language && <span>{repo.language}</span>}
          {repo.stars > 0 && <span aria-label={`${repo.stars} stars`}>★ {formatNumber(repo.stars)}</span>}
          <span title="last push">{repo.pushedAt.slice(0, 7)}</span>
          {repo.archived && <span>archived</span>}
        </span>
      </div>
      {(note || repo.description) && <p className="repo__description">{note || repo.description}</p>}
      {repo.fields.length > 0 && (
        <ul className="repo__fields" aria-label="Fields">
          {repo.fields.map((f) => (
            <li key={f}>{FIELD_NAMES[f] || f}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Searchable, filterable list of repositories. Filters live in the query
 * string (`?q=`, `?field=`, `?kind=`, `?sort=`) so every view can be shared.
 */
export default function RepoList({
  items,
  label = 'Repositories',
  fieldOptions = fields,
  showKinds = true,
  limit = 60,
}) {
  const [query, setQuery] = useQueryParam('q');
  const [field, setField] = useQueryParam('field');
  const [kind, setKind] = useQueryParam('kind', 'own');
  const [sort, setSort] = useQueryParam('sort', 'stars');
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(
    () =>
      items
        .filter((r) => !showKinds || kind === 'all' || r.kind === kind)
        .filter((r) => !field || r.fields.includes(field))
        .filter((r) => matches(r, query))
        .sort((SORTS[sort] || SORTS.stars).compare),
    [items, showKinds, kind, field, query, sort],
  );
  const shown = expanded ? list : list.slice(0, limit);

  return (
    <div className="repo-list">
      <div className="filters" role="search">
        <label>
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="name, language, topic…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span>Field</span>
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">All fields</option>
            {fieldOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        {showKinds && (
          <label>
            <span>Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(KINDS).map(([id, k]) => (
                <option key={id} value={id}>
                  {k.label}
                </option>
              ))}
              <option value="all">All kinds</option>
            </select>
          </label>
        )}
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <output className="filters__count mono" aria-live="polite">
          {formatNumber(list.length)} {list.length === 1 ? 'repository' : 'repositories'}
        </output>
      </div>
      <ul className="repos" aria-label={label}>
        {shown.map((r) => (
          <RepoItem key={r.fullName} repo={r} />
        ))}
      </ul>
      {list.length > shown.length && (
        <button type="button" className="button repo-list__more" onClick={() => setExpanded(true)}>
          Show all {formatNumber(list.length)}
        </button>
      )}
    </div>
  );
}
