import { useState } from 'react';
import { linksNotation, mathNotation, randomCode } from '../links/configurations';
import Glyph from './Glyph';

const gh = (fullName) => `https://github.com/${fullName}`;

/**
 * A doublet network with its math and links notation. Clicking the symbol
 * shows a random network of 1–4 links (`random` is injectable for tests).
 */
export function NetworkExample({ example, random = Math.random }) {
  const [code, setCode] = useState(example.code);
  const size = code.split(' ').length;
  const isExample = code === example.code;
  return (
    <div className="theory__example">
      <button
        type="button"
        className="theory__network"
        onClick={() => setCode(randomCode(random))}
        title="Show a random network of 1–4 links"
      >
        <Glyph code={code} size={96} title={`Network of ${size} ${size === 1 ? 'link' : 'links'}: ${code}`} />
      </button>
      <dl className="theory__notations">
        <dt>math notation</dt>
        <dd className="mono" data-notation="math">
          {mathNotation(code)}
        </dd>
        <dt>links notation</dt>
        <dd className="mono" data-notation="links">
          {linksNotation(code).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </dd>
      </dl>
      <p className="muted">
        {isExample
          ? 'Two links refer to themselves (points), the third connects them: a graph edge is just a link.'
          : `A random network of ${size} ${size === 1 ? 'link' : 'links'}.`}{' '}
        Every link is (index: source target), 0 is nothing; the math notation writes the same sources and targets as
        digits in base {size + 1}. Click the symbol for another random network.
      </p>
    </div>
  );
}

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
          <NetworkExample example={theory.example} />
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
