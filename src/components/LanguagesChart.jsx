import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber, SERIES } from './format';
import { Tooltip, useTooltip } from './Tooltip';
import { DataMark } from './DataSources';

const LIMIT = 10;
// "in N repositories": Russian needs the prepositional case after «в».
const IN_REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозитории', 'репозиториях', 'репозиториях'] };
const OF_LANGUAGES = { en: ['language', 'languages'], ru: ['языка', 'языков', 'языков'] };
const OTHER = { en: 'Other', ru: 'Другие' };

/** The top languages and the rest summed up as `{ name: 'Other', isOther: true }` (translated when drawn). */
export function topWithOther(languages, limit = LIMIT) {
  const top = languages.slice(0, limit);
  const rest = languages.slice(limit).reduce((sum, l) => sum + l.count, 0);
  return rest > 0 ? [...top, { name: 'Other', count: rest, isOther: true }] : top;
}

export default function LanguagesChart({ languages, favorites }) {
  const { tip, show, hide } = useTooltip();
  const { lang, t } = useLang();
  const number = (v) => formatNumber(v, lang);
  const name = (l) => (l.isOther ? t(OTHER) : l.name);
  const rows = topWithOther(languages);
  const max = Math.max(...rows.map((l) => l.count));

  const tipContent = (l) => (
    <>
      <strong>
        {name(l)}
        {favorites.includes(l.name) ? ' ★' : ''}
      </strong>
      <span className="tooltip__value">
        {t({ en: 'used in', ru: 'используется в' })} {number(l.count)} {plural(l.count, lang, IN_REPOSITORIES)}
      </span>
      {!l.isOther && (
        <span className="tooltip__row">
          {t({ en: 'primary language in', ru: 'основной язык в' })} {number(l.primary)}{' '}
          {plural(l.primary, lang, IN_REPOSITORIES)}
        </span>
      )}
    </>
  );

  return (
    <div className="chart" data-tooltip-root>
      <p className="chart__caption">
        {t({
          en: `Repositories that use each of the ${number(languages.length)} ${plural(languages.length, 'en', OF_LANGUAGES)} GitHub detected in original public repositories (personal + organizations); a repository counts once for every language in it.`,
          ru: `Сколько репозиториев использует каждый из ${number(languages.length)} ${plural(languages.length, 'ru', OF_LANGUAGES)}, найденных GitHub в собственных публичных репозиториях (личных и организаций); репозиторий учитывается по разу для каждого своего языка.`,
        })}
        <span className="muted"> {t({ en: '★ = favorite language', ru: '★ — любимый язык' })}</span>
        <DataMark />
      </p>
      <ul
        className="hbars"
        aria-label={t({ en: 'Repositories by primary language', ru: 'Репозитории по основному языку' })}
      >
        {rows.map((l) => (
          <li
            key={l.name}
            className={`hbars__row${l.isOther ? ' is-other' : ''}`}
            tabIndex={0}
            onPointerMove={(e) => show(e, tipContent(l))}
            onFocus={(e) => show(e, tipContent(l))}
            onPointerLeave={hide}
            onBlur={hide}
          >
            <span className="hbars__name">
              {name(l)}
              {favorites.includes(l.name) && (
                <span className="hbars__fav" aria-label={t({ en: 'favorite', ru: 'любимый' })}>
                  {' '}
                  ★
                </span>
              )}
            </span>
            <span className="hbars__track">
              <span
                className="hbars__fill"
                style={{ width: `${(l.count / max) * 100}%`, background: l.isOther ? 'var(--muted)' : SERIES[0] }}
              />
            </span>
            <span className="hbars__value">{number(l.count)}</span>
          </li>
        ))}
      </ul>
      <Tooltip tip={tip} />
    </div>
  );
}
