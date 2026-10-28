import { useLang } from '../i18n/prefs';
import { formatNumber } from './format';
import { DataMark } from './DataSources';

export default function SourceLines({ data }) {
  const { t, lang } = useLang();
  const number = (v) => formatNumber(v, lang);
  const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = languages.reduce((sum, [, count]) => sum + count, 0);
  return (
    <article className="source-lines">
      <h3>{t({ en: 'My open-source code', ru: 'Мой открытый код' })}</h3>
      <p className="source-lines__total">
        <strong>{number(total)}</strong> <DataMark />
      </p>
      <p>
        {t({
          en: 'Surviving nonblank source lines attributed to my commits in public repositories, including contributions to projects I do not own.',
          ru: 'Сохранившиеся непустые строки исходного кода, отнесённые к моим коммитам в публичных репозиториях, включая вклад в чужие проекты.',
        })}
      </p>
      <p className="muted">
        {t({
          en: 'Includes comments; excludes Markdown, JSON and other prose/data formats, saved patches and dependency/build directories. Shared history is counted once. Git attribution measures responsibility for the current lines, including work done with tools; it cannot establish manual typing or count deleted work.',
          ru: 'Включает комментарии; исключает Markdown, JSON и другие форматы текста и данных, сохранённые патчи и каталоги зависимостей и сборки. Общая история учитывается один раз. Git определяет авторство текущих строк, в том числе работы с инструментами; он не устанавливает ручной набор и не учитывает удалённый код.',
        })}
      </p>
      <p>
        {t({
          en: 'Closed-source experience is much broader; see the positions in my CV.',
          ru: 'Опыт закрытой разработки значительно шире — см. должности в моём резюме.',
        })}{' '}
        <a href={`/cv/?lang=${lang}`}>{t({ en: 'View CV', ru: 'Открыть резюме' })} →</a>
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
            <th>{t({ en: 'Language', ru: 'Язык' })}</th>
            <th>
              {t({ en: 'Attributed source lines', ru: 'Строки с установленным авторством' })} <DataMark />
            </th>
          </tr>
        </thead>
        <tbody>
          {languages.map(([language, count]) => (
            <tr key={language}>
              <th scope="row">{language}</th>
              <td>
                <span
                  className="source-lines__bar"
                  style={{ '--line-share': `${(count / Math.max(...languages.map(([, n]) => n))) * 100}%` }}
                />
                <span>{number(count)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>{t({ en: 'Total', ru: 'Всего' })}</th>
            <td>{number(total)}</td>
          </tr>
        </tfoot>
      </table>
      <details className="table-view">
        <summary>
          {t({ en: 'Public repositories with attributed lines', ru: 'Публичные репозитории со строками автора' })}
        </summary>
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
