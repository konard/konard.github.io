import { useState } from 'react';
import { linksNotation, mathNotation, randomCode } from '../links/configurations';
import { tr, useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import Glyph from './Glyph';
import { networkHref } from './NetworkGallery';

const gh = (fullName) => `https://github.com/${fullName}`;
// "a network of N links": Russian needs the genitive after «из».
const OF_LINKS = { en: ['link', 'links'], ru: ['связи', 'связей', 'связей'] };
const LANGUAGE_NAMES = {
  en: { en: 'English', ru: 'на английском' },
  ru: { en: 'Russian', ru: 'на русском' },
};

/**
 * A doublet network with its math and links notation. Clicking the symbol
 * shows a random network of 1–4 links (`random` is injectable for tests).
 */
export function NetworkExample({ example, random = Math.random }) {
  const [code, setCode] = useState(example.code);
  const size = code.split(' ').length;
  const isExample = code === example.code;
  const { lang, t } = useLang();
  const links = `${size} ${plural(size, lang, OF_LINKS)}`;
  return (
    <div className="theory__example">
      <button
        type="button"
        className="theory__network"
        onClick={() => setCode(randomCode(random))}
        title={t({ en: 'Show a random network of 1–4 links', ru: 'Показать случайную сеть из 1–4 связей' })}
      >
        <Glyph code={code} size={96} title={`${t({ en: 'Network of', ru: 'Сеть из' })} ${links}: ${code}`} />
      </button>
      <dl className="theory__notations">
        <dt>{t({ en: 'math notation', ru: 'математическая нотация' })}</dt>
        <dd className="mono" data-notation="math">
          {mathNotation(code)}
        </dd>
        <dt>{t({ en: 'links notation', ru: 'нотация связей' })}</dt>
        <dd className="mono" data-notation="links">
          {linksNotation(code).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </dd>
      </dl>
      <p className="muted">
        {isExample
          ? t({
              en: 'Two links refer to themselves (points), the third connects them: a graph edge is just a link.',
              ru: 'Две связи ссылаются сами на себя (точки), третья соединяет их: ребро графа — это просто связь.',
            })
          : `${t({ en: 'A random network of', ru: 'Случайная сеть из' })} ${links}.`}{' '}
        {t({
          en: `Every link is (index: source target), 0 is nothing; the math notation writes the same sources and targets as digits in base ${size + 1}. Click the symbol for another random network.`,
          ru: `Каждая связь — это (индекс: начало конец), 0 означает «ничего»; математическая нотация записывает те же начала и концы цифрами в системе счисления с основанием ${size + 1}. Нажмите на символ, чтобы увидеть другую случайную сеть.`,
        })}{' '}
        <a className="theory__edit" href={networkHref(code)}>
          {t({ en: 'Edit and share this network', ru: 'Изменить эту сеть и поделиться ею' })}
        </a>
      </p>
    </div>
  );
}

/** The links meta-theory: the formula, its definitions, versions and PDFs. */
export default function MetaTheory({ theory, detailed = false }) {
  const { t } = useLang();
  const { notation, n } = useNotation();
  return (
    <div className="theory">
      <div className="theory__hero" data-notation={notation}>
        <div
          className="theory__formula"
          aria-label={`${t({ en: 'Links theory in four symbols', ru: 'Теория связей в четырёх символах' })}: ${n(theory.tldr)}`}
        >
          <span className="mono">{n(theory.tldr)}</span>
        </div>
        <div>
          <p className="theory__summary">{t(theory.summary)}</p>
          <NetworkExample example={theory.example} />
          <p className="theory__actions">
            <a className="button button--primary" href={theory.repo} target="_blank" rel="noopener noreferrer">
              link-foundation/meta-theory
            </a>
            <a className="button" href={theory.pdfs} target="_blank" rel="noopener noreferrer">
              {t({ en: 'All PDFs (ZIP)', ru: 'Все PDF (ZIP)' })}
            </a>
          </p>
        </div>
      </div>

      <ol className="theory__formulas">
        {theory.formulas.map((f) => (
          <li key={f.formula.L}>
            <span className="mono theory__math">{n(f.formula)}</span>
            <span>{t(n(f.text))}</span>
          </li>
        ))}
      </ol>

      <div
        className="theory__versions"
        role="list"
        aria-label={t({ en: 'Versions of the links theory', ru: 'Версии теории связей' })}
      >
        {theory.versions.map((v) => (
          <article key={v.version} className="version" role="listitem">
            <span className="version__number mono">{v.version}</span>
            <h3>
              <a href={v.url} target="_blank" rel="noopener noreferrer" lang={v.lang}>
                {v.title}
              </a>
            </h3>
            <span className="muted">
              {t(v.status)} · {t(LANGUAGE_NAMES[v.lang])} ·{' '}
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
              <li key={tr(c, 'en')}>{t(c)}</li>
            ))}
          </ul>
          <ul className="theory__related">
            {theory.related.map(([repo, why]) => (
              <li key={repo}>
                <a href={gh(repo)} target="_blank" rel="noopener noreferrer" className="mono">
                  {repo}
                </a>{' '}
                — {t(why)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
