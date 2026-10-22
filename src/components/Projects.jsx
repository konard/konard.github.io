import { useMemo, useState } from 'react';
import { useLang } from '../i18n/prefs';
import { formatNumber } from './format';

const ALL = 'All';

export function mergeProjects(featured, projects) {
  const byName = new Map(projects.map((p) => [p.fullName, p]));
  return featured.map((f) => {
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
  const { lang, t } = useLang();
  const all = useMemo(() => mergeProjects(featured, projects), [featured, projects]);
  const languages = useMemo(() => [ALL, ...new Set(all.map((p) => p.language).filter(Boolean))], [all]);
  const [filter, setFilter] = useState(ALL);
  const shown = filter === ALL ? all : all.filter((p) => p.language === filter);
  const maxStars = Math.max(1, ...all.map((p) => p.stars));

  return (
    <>
      <div
        className="chips"
        role="group"
        aria-label={t({ en: 'Filter projects by language', ru: 'Фильтр проектов по языку' })}
      >
        {languages.map((l) => (
          <button
            key={l}
            type="button"
            className={`chip${filter === l ? ' is-active' : ''}`}
            aria-pressed={filter === l}
            onClick={() => setFilter(l)}
          >
            {l === ALL ? t({ en: 'All', ru: 'Все' }) : l}
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
            <p className="project__tagline">{t(p.tagline)}</p>
            <div className="project__meter" aria-label={t({ en: `${p.stars} stars`, ru: `звёзд: ${p.stars}` })}>
              <span style={{ width: `${(p.stars / maxStars) * 100}%` }} />
            </div>
            <p className="project__meta">
              <span>★ {formatNumber(p.stars, lang)}</span>
              {p.language && <span>{p.language}</span>}
              {p.createdYear && <span>{t({ en: `since ${p.createdYear}`, ru: `с ${p.createdYear}` })}</span>}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
