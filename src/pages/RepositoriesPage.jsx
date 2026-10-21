import Layout from '../components/Layout';
import { formatNumber } from '../components/format';
import RepoList, { RepoItem } from '../components/RepoList';
import Section from '../components/Section';
import { fields, professions } from '../data/fields';
import { allRepositories, byStars, inField, KINDS, ownRepositories, repo } from './repos';

const SECTIONS = [
  ['professions', 'By profession'],
  ['fields', 'By field'],
  ['all', 'All repositories'],
];

const owners = new Set(ownRepositories.map((r) => r.owner));
const stars = ownRepositories.reduce((sum, r) => sum + r.stars, 0);

/** Every repository of konard and the organizations, grouped by field and profession. */
export default function RepositoriesPage() {
  return (
    <Layout page="repositories" sections={SECTIONS}>
      <header className="page-hero" id="top">
        <p className="section__kicker">Open source</p>
        <h1 className="page-hero__title">Repositories</h1>
        <p className="page-hero__lead">
          {formatNumber(ownRepositories.length)} original repositories in {owners.size} accounts and organizations, with{' '}
          {formatNumber(stars)} stars. Each one is classified by the fields where it is useful; forks and mirrors are
          not counted, and empty repositories are not shown.
        </p>
        <ul className="page-stats">
          {Object.entries(KINDS).map(([id, k]) => (
            <li key={id}>
              <strong className="mono">{formatNumber(allRepositories.filter((r) => r.kind === id).length)}</strong>
              <span>{k.label}</span>
              <small>{k.summary}</small>
            </li>
          ))}
        </ul>
      </header>

      <Section id="professions" kicker="Best examples" title="Repositories by IT profession">
        <p className="section__lead">
          Hand-picked repositories that show the work of each profession best, from MLOps and DevOps to ML/AI, data,
          backend, frontend, systems, compilers and QA.
        </p>
        <div className="profession-grid">
          {professions.map((p) => (
            <article key={p.id} className="profession" id={`profession-${p.id}`}>
              <h3>{p.name}</h3>
              <p className="muted">{p.summary}</p>
              <ul className="repos repos--compact">
                {p.repos.map(([name, why]) => {
                  const r = repo(name);
                  return r ? (
                    <RepoItem key={name} repo={r} note={why} />
                  ) : (
                    <li key={name} className="repo">
                      <a href={`https://github.com/${name}`} target="_blank" rel="noopener noreferrer">
                        {name}
                      </a>
                      <p className="repo__description">{why}</p>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section id="fields" kicker="Fields" title="How the repositories are useful in different fields">
        <ul className="field-grid">
          {fields.map((f) => {
            const list = inField(f.id).sort(byStars);
            return (
              <li key={f.id} className="field-card" id={`field-${f.id}`}>
                <h3>
                  {f.name} <span className="mono muted">{list.length}</span>
                </h3>
                <p>{f.summary}</p>
                <p className="field-card__top">
                  {list.slice(0, 5).map((r, i) => (
                    <span key={r.fullName}>
                      {i > 0 && ' · '}
                      <a href={`https://github.com/${r.fullName}`} target="_blank" rel="noopener noreferrer">
                        {r.name}
                      </a>
                    </span>
                  ))}
                </p>
                <a className="field-card__all" href={`?field=${f.id}#all`}>
                  All {list.length} →
                </a>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="all" kicker="Catalog" title="All repositories">
        <RepoList items={allRepositories} label="All repositories" />
      </Section>
    </Layout>
  );
}
