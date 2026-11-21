import { localized } from '../i18n/localizer.js';
import { useState } from 'react';
import { linksNotation, mathNotation, randomCode } from '../links/configurations';
import { tr, useLang, useResolvedTheme } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import Glyph from './Glyph';
import { networkHref } from './NetworkGallery';

const gh = (fullName) => `https://github.com/${fullName}`;
// "a network of N links": Russian needs the genitive after «из».
const OF_LINKS = { en: ['link', 'links'], ru: ['связи', 'связей', 'связей'] };
const LANGUAGE_NAMES = {
  en: localized('m6ca16c00b0a1'),
  ru: localized('ma1c9226b6cb5'),
};

/**
 * A doublet network with its math and links notation. Clicking the symbol
 * shows a random network of 1–4 links (`random` is injectable for tests).
 */
export function NetworkExample({ example, random = Math.random }) {
  const theme = useResolvedTheme();
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
        title={t(localized('mb27108d2fe71'))}
      >
        <Glyph code={code} size={96} title={`${t(localized('mc8ffa35f52c7'))} ${links}: ${code}`} />
      </button>
      <dl className="theory__notations">
        <dt>{t(localized('m0f48683d5dec'))}</dt>
        <dd className="mono" data-notation="math">
          {mathNotation(code)}
        </dd>
        <dt>{t(localized('mfe944d2cc5a8'))}</dt>
        <dd className="mono" data-notation="links">
          {linksNotation(code).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </dd>
      </dl>
      <p className="muted">
        {isExample ? t(localized('m1a288f0f8783')) : `${t(localized('md1ec4dcd2955'))} ${links}.`}{' '}
        {t({
          en: `Every link is (index: source target), 0 is nothing; the math notation writes the same sources and targets as digits in base ${size + 1}. Click the symbol for another random network.`,
          ru: `Каждая связь — это (индекс: начало конец), 0 означает «ничего»; математическая нотация записывает те же начала и концы цифрами в системе счисления с основанием ${size + 1}. Нажмите на символ, чтобы увидеть другую случайную сеть.`,
        })}{' '}
        <a className="theory__edit" href={networkHref(code, theme)}>
          {t(localized('m7373953f825d'))}
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
        <div className="theory__formula" aria-label={`${t(localized('m237f2c82faf9'))}: ${n(theory.tldr)}`}>
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
              {t(localized('m949a0cb8187b'))}
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

      <div className="theory__versions" role="list" aria-label={t(localized('m8dedf7ef0b06'))}>
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
