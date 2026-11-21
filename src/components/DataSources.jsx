import { localized } from '../i18n/localizer.js';
import { useLang } from '../i18n/prefs';
import { sources } from '../data/indicators.lino';
import '../indicators.css';

export function DataMark() {
  const { t } = useLang();
  return (
    <a
      className="data-mark"
      href="#data-sources"
      onClick={() => {
        const details = document.getElementById('data-sources');
        if (details) details.open = true;
      }}
      aria-label={t(localized('mf1c5c4b168a4'))}
    >
      (*)
    </a>
  );
}

export default function DataSources() {
  const { t } = useLang();
  return (
    <details className="data-sources" id="data-sources">
      <summary>{t(localized('md7fa65fb6906'))}</summary>
      <p>{t(localized('mda95a3f8e008'))}</p>
      <ul>
        {Object.entries(sources).map(([name, source]) => (
          <li key={name}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {t(source.label)}
            </a>
            : <time dateTime={source.effectiveAt}>{source.effectiveAt.slice(0, 10)}</time> (UTC)
          </li>
        ))}
      </ul>
      <p>{t(localized('m7beccb866795'))}</p>
      <a href="https://github.com/konard/konard.github.io/tree/main/docs/case-studies/issue-33">
        {t(localized('ma43d97d42b2f'))}
      </a>
    </details>
  );
}
