import Select from './Select';
import { useMemo, useState } from 'react';
import { fields } from '../data/fields';
import { githubUrl, KINDS, matches, SORTS } from '../pages/repos';
import { useQueryParam } from '../pages/query';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { plural } from '../i18n/plural';
import { formatNumber } from './format';
import { DataMark } from './DataSources';
import { StarMark } from './icons';

const FIELD_NAMES = Object.fromEntries(fields.map((f) => [f.id, f.name]));
const STARS = { en: ['star', 'stars'], ru: ['звезда', 'звезды', 'звёзд'] };
const REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозиторий', 'репозитория', 'репозиториев'] };

/**
 * One repository row: name, description, language, stars, last push and fields.
 * `note` may be a `{ en, ru }` object; GitHub descriptions stay in their own language.
 */
export function RepoItem({ repo, note = null }) {
  const { lang, t } = useLang();
  const { n } = useNotation();
  const text = n(t(note)) || repo.description;
  return (
    <li className="repo">
      <div className="repo__head">
        <a href={githubUrl(repo)} target="_blank" rel="noopener noreferrer" className="repo__name">
          <span className="muted">{repo.owner}/</span>
          {repo.name}
        </a>
        <span className="repo__meta mono">
          {repo.language && <span>{repo.language}</span>}
          {repo.stars > 0 && (
            <span aria-label={`${formatNumber(repo.stars, lang)} ${plural(repo.stars, lang, STARS)}`}>
              <StarMark /> {formatNumber(repo.stars, lang)}
              <DataMark />
            </span>
          )}
          <span title={t({ en: 'last push', ru: 'последнее обновление' })}>{repo.pushedAt?.slice(0, 7)}</span>
          {repo.archived && <span>{t({ en: 'archived', ru: 'в архиве' })}</span>}
        </span>
      </div>
      {text && <p className="repo__description">{text}</p>}
      {repo.kind === 'fork' && repo.copyOf && (
        <p className="repo__description muted">
          {t({ en: 'Fork of', ru: 'Форк' })}{' '}
          <a href={`https://github.com/${repo.copyOf}`} target="_blank" rel="noopener noreferrer">
            {repo.copyOf}
          </a>
        </p>
      )}
      {repo.sourceLines ? (
        <details className="repo__lines">
          <summary>
            {formatNumber(
              Object.values(repo.sourceLines).reduce((sum, l) => sum + l.code, 0),
              lang,
            )}{' '}
            {t({ en: 'source lines', ru: 'строк кода' })} <DataMark />
          </summary>
          <ul>
            {Object.entries(repo.sourceLines)
              .sort((a, b) => b[1].code - a[1].code)
              .map(([language, counts]) => (
                <li key={language}>
                  {language}: {formatNumber(counts.code, lang)} {t({ en: 'code', ru: 'код' })} ·{' '}
                  {formatNumber(counts.comment, lang)} {t({ en: 'comments', ru: 'комментарии' })} ·{' '}
                  {formatNumber(counts.blank, lang)} {t({ en: 'blank', ru: 'пустые' })}
                </li>
              ))}
          </ul>
          {repo.sourceSha && (
            <a
              href={`https://github.com/${repo.fullName}/tree/${repo.sourceSha}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t({ en: 'Measured revision', ru: 'Измеренная версия' })} · {repo.sourceCollectedAt?.slice(0, 10)}
            </a>
          )}
        </details>
      ) : (
        <p className="repo__lines muted">
          {t({ en: 'Line count unavailable', ru: 'Число строк недоступно' })} <DataMark />
        </p>
      )}
      {repo.fields.length > 0 && (
        <ul className="repo__fields" aria-label={t({ en: 'Fields', ru: 'Области' })}>
          {repo.fields.map((f) => (
            <li key={f}>{t(FIELD_NAMES[f]) || f}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Searchable, filterable list of repositories. Filters live in the query
 * string (`?q=`, `?field=`, `?kind=`, `?sort=`) so every view can be shared.
 */
export default function RepoList({
  items,
  label = { en: 'Repositories', ru: 'Репозитории' },
  fieldOptions = fields,
  showKinds = true,
  limit = 60,
}) {
  const [query, setQuery] = useQueryParam('q');
  const [field, setField] = useQueryParam('field');
  const [kind, setKind] = useQueryParam('kind', 'own');
  const [sort, setSort] = useQueryParam('sort', 'stars');
  const [expanded, setExpanded] = useState(false);
  const { lang, t } = useLang();

  const list = useMemo(
    () =>
      items
        .filter((r) => !showKinds || kind === 'all' || r.kind === kind)
        .filter((r) => !field || r.fields.includes(field))
        .filter((r) => matches(r, query))
        .sort((SORTS[sort] || SORTS.stars).compare),
    [items, showKinds, kind, field, query, sort],
  );
  const shown = expanded ? list : list.slice(0, limit);

  return (
    <div className="repo-list">
      <div className="filters" role="search">
        <label>
          <span>{t({ en: 'Search', ru: 'Поиск' })}</span>
          <input
            type="search"
            value={query}
            placeholder={t({ en: 'name, language, topic…', ru: 'название, язык, тема…' })}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span>{t({ en: 'Field', ru: 'Область' })}</span>
          <Select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">{t({ en: 'All fields', ru: 'Все области' })}</option>
            {fieldOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {t(f.name)}
              </option>
            ))}
          </Select>
        </label>
        {showKinds && (
          <label>
            <span>{t({ en: 'Kind', ru: 'Вид' })}</span>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(KINDS).map(([id, k]) => (
                <option key={id} value={id}>
                  {t(k.label)}
                </option>
              ))}
              <option value="all">{t({ en: 'All kinds', ru: 'Все виды' })}</option>
            </Select>
          </label>
        )}
        <label>
          <span>{t({ en: 'Sort', ru: 'Сортировка' })}</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>
                {t(s.label)}
              </option>
            ))}
          </Select>
        </label>
        <output className="filters__count mono" aria-live="polite">
          {formatNumber(list.length, lang)} {plural(list.length, lang, REPOSITORIES)}
        </output>
      </div>
      <ul className="repos" aria-label={t(label)}>
        {shown.map((r) => (
          <RepoItem key={r.fullName} repo={r} />
        ))}
      </ul>
      {list.length > shown.length && (
        <button type="button" className="button repo-list__more" onClick={() => setExpanded(true)}>
          {t({ en: 'Show all', ru: 'Показать все' })} {formatNumber(list.length, lang)}
        </button>
      )}
    </div>
  );
}
