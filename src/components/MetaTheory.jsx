import Glyph from './Glyph';

const gh = (fullName) => `https://github.com/${fullName}`;

/** The links meta-theory: the formula, its definitions, versions and PDFs. */
export default function MetaTheory({ theory, detailed = false }) {
  return (
    <div className="theory">
      <div className="theory__hero">
        <div className="theory__formula" aria-label={`Links theory in four symbols: ${theory.tldr}`}>
          <span className="mono">{theory.tldr}</span>
        </div>
        <div>
          <p className="theory__summary">{theory.summary}</p>
          <div className="theory__example">
            <Glyph code={theory.example.code} size={96} title="Doublet network of three links" />
            <ul className="mono">
              {theory.example.links.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="muted">
              Two links refer to themselves (points), the third connects them: a graph edge is just a link.
            </p>
          </div>
          <p className="theory__actions">
            <a className="button button--primary" href={theory.repo} target="_blank" rel="noopener noreferrer">
              link-foundation/meta-theory
            </a>
            <a className="button" href={theory.pdfs} target="_blank" rel="noopener noreferrer">
              All PDFs (ZIP)
            </a>
          </p>
        </div>
      </div>

      <ol className="theory__formulas">
        {theory.formulas.map((f) => (
          <li key={f.formula}>
            <span className="mono theory__math">{f.formula}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ol>

      <div className="theory__versions" role="list" aria-label="Versions of the links theory">
        {theory.versions.map((v) => (
          <article key={v.version} className="version" role="listitem">
            <span className="version__number mono">{v.version}</span>
            <h3>
              <a href={v.url} target="_blank" rel="noopener noreferrer" lang={v.lang}>
                {v.title}
              </a>
            </h3>
            <span className="muted">
              {v.status} · {v.lang === 'en' ? 'English' : 'Russian'} ·{' '}
              <a href={v.pdf} target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            </span>
          </article>
        ))}
      </div>

      {detailed && (
        <>
          <ul className="theory__claims">
            {theory.claims.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <ul className="theory__related">
            {theory.related.map(([repo, why]) => (
              <li key={repo}>
                <a href={gh(repo)} target="_blank" rel="noopener noreferrer" className="mono">
                  {repo}
                </a>{' '}
                — {why}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
