import { useMemo, useState } from 'react';
import { formatNumber } from './format';

export function mergeProjects(featured, projects) {
  const byName = new Map(projects.map((p) => [p.fullName, p]));
  return featured
    .map((f) => {
      const p = byName.get(f.fullName);
      const [owner, name] = f.fullName.split('/');
      return {
        owner,
        name,
        language: null,
        stars: 0,
        createdYear: null,
        url: `https://github.com/${f.fullName}`,
        ...p,
        fullName: f.fullName,
        tagline: f.tagline,
      };
    });
}

export default function Projects({ featured, projects }) {
  const all = useMemo(() => mergeProjects(featured, projects), [featured, projects]);
  const languages = useMemo(() => ['All', ...new Set(all.map((p) => p.language).filter(Boolean))], [all]);
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? all : all.filter((p) => p.language === filter);
  const maxStars = Math.max(1, ...all.map((p) => p.stars));

  return (
    <>
      <div className="chips" role="group" aria-label="Filter projects by language">
        {languages.map((l) => (
          <button
            key={l}
            type="button"
            className={`chip${filter === l ? ' is-active' : ''}`}
            aria-pressed={filter === l}
            onClick={() => setFilter(l)}
          >
            {l}
          </button>
        ))}
      </div>
      <ul className="projects">
        {shown.map((p) => (
          <li key={p.fullName} className="project">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="project__link">
              <span className="project__owner mono">{p.owner}/</span>
              <span className="project__name">{p.name}</span>
            </a>
            <p className="project__tagline">{p.tagline}</p>
            <div className="project__meter" aria-label={`${p.stars} stars`}>
              <span style={{ width: `${(p.stars / maxStars) * 100}%` }} />
            </div>
            <p className="project__meta">
              <span>★ {formatNumber(p.stars)}</span>
              {p.language && <span>{p.language}</span>}
              {p.createdYear && <span>since {p.createdYear}</span>}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
