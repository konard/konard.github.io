import { localized } from '../i18n/localizer.js';
import { useLang } from '../i18n/prefs';
import { formatNumber } from './format';
import { DataMark } from './DataSources';
import { ArrowRight } from 'lucide-react';
import { iconProps } from './icons';

export default function SourceLines({ data }) {
  const { t, lang } = useLang();
  const number = (v) => formatNumber(v, lang);
  const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const major = languages.filter(([, count]) => count >= 1000);
  const minor = languages.filter(([, count]) => count < 1000);
  const other = minor.reduce((sum, [, count]) => sum + count, 0);
  const rows = [...major, ...(minor.length ? [[t(localized('m671783c5c71b')), other]] : [])];
  const largest = Math.max(1, ...rows.map(([, count]) => count));
  const total = languages.reduce((sum, [, count]) => sum + count, 0);
  return (
    <article className="source-lines">
      <h3>{t(localized('m22e66b4911a6'))}</h3>
      <p className="source-lines__total">
        <strong>{number(total)}</strong> <DataMark />
      </p>
      <p>{t(localized('m51453daa916f'))}</p>
      <p className="muted">{t(localized('m787865fefb00'))}</p>
      <p>
        {t(localized('m3110c150c7e7'))}{' '}
        <a href={`/cv/?lang=${lang}`}>
          {t(localized('mcb964b61da78'))} <ArrowRight {...iconProps} />
        </a>
      </p>
      <p className="muted">
        {t({
          en: `Measured ${data.measuredRepositories} public repositories. Effective`,
          ru: `Исследовано публичных репозиториев: ${data.measuredRepositories}. Актуально на`,
        })}{' '}
        <time dateTime={data.collectedAt}>{data.collectedAt.slice(0, 10)}</time> (UTC).
      </p>
      <table className="source-lines__table">
        <thead>
          <tr>
            <th>{t(localized('m6d23696c750e'))}</th>
            <th>
              {t(localized('m50395522765f'))} <DataMark />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([language, count]) => (
            <tr key={language}>
              <th scope="row">{language}</th>
              <td>
                <span className="source-lines__bar" style={{ '--line-share': `${(count / largest) * 100}%` }} />
                <span>{number(count)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>{t(localized('m3398e3ff6a01'))}</th>
            <td>{number(total)}</td>
          </tr>
        </tfoot>
      </table>
      {minor.length > 0 && (
        <details className="table-view">
          <summary>{t(localized('m99655ad35768'))}</summary>
          <ul>
            {minor.map(([language, count]) => (
              <li key={language}>
                {language}: {number(count)}
              </li>
            ))}
          </ul>
        </details>
      )}
      {data.excludedRepositories?.map((r) => (
        <p className="muted source-lines__excluded" key={r.fullName}>
          {t(localized('m578ecfab6fe2'))}{' '}
          <a href={`https://github.com/${r.fullName}/tree/${r.sha}`} target="_blank" rel="noopener noreferrer">
            {r.fullName}
          </a>{' '}
          ({number(r.lines)} <DataMark />) — {t(r.reason)}.
        </p>
      ))}
      <details className="table-view">
        <summary>{t(localized('m946392b06958'))}</summary>
        <ul>
          {data.authoredRepositories.map((r) => (
            <li key={r.fullName}>
              <a href={`https://github.com/${r.fullName}/tree/${r.sha}`} target="_blank" rel="noopener noreferrer">
                {r.fullName}
              </a>
              : {number(r.lines)} <DataMark />
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
