import { localized } from '../i18n/localizer.js';
import { useLang } from '../i18n/prefs';
import { formatNumber } from './format';
import { DataMark } from './DataSources';
import { Dot } from './icons';

// Stack Overflow reputation, badges and top answer tags plus the list of
// articles / talks and the education block with spoken languages.
export function StackOverflowCard({ so }) {
  const { lang, t } = useLang();
  const max = Math.max(...so.topTags.map((t) => t.score));
  return (
    <article className="card">
      <h3 className="card__title">
        <a href={so.url} target="_blank" rel="noopener noreferrer">
          Stack Overflow
        </a>
        <span className="muted"> · {t({ en: `since ${so.memberSince}`, ru: `с ${so.memberSince} года` })}</span>
      </h3>
      <div className="so__numbers">
        <span className="so__rep">
          <strong>{formatNumber(so.reputation, lang)}</strong> {t(localized('ma8285943f85a'))}
        </span>
        <span
          className="badge badge--silver"
          aria-label={t({ en: `${so.badges.silver} silver badges`, ru: `серебряных значков: ${so.badges.silver}` })}
        >
          <Dot /> {so.badges.silver}
        </span>
        <span
          className="badge badge--bronze"
          aria-label={t({ en: `${so.badges.bronze} bronze badges`, ru: `бронзовых значков: ${so.badges.bronze}` })}
        >
          <Dot /> {so.badges.bronze}
        </span>
      </div>
      <ul className="hbars hbars--compact" aria-label={t(localized('mdb757478e630'))}>
        {so.topTags.map((t) => (
          <li key={t.name} className="hbars__row">
            <span className="hbars__name mono">{t.name}</span>
            <span className="hbars__track">
              <span className="hbars__fill" style={{ width: `${(t.score / max) * 100}%` }} />
            </span>
            <span className="hbars__value">{t.score}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">
        {t(localized('mf20283a4a356'))} <DataMark />
      </p>
    </article>
  );
}

export function Publications({ items }) {
  const { t } = useLang();
  return (
    <article className="card">
      <h3 className="card__title">{t(localized('me0e075a61e22'))}</h3>
      <ol className="pubs">
        {items.map((p) => (
          <li key={p.url}>
            <time className="mono" dateTime={p.date}>
              {p.date.slice(0, 7)}
            </time>
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              {p.title}
            </a>
            <span className="muted"> · {p.venue}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function Education({ items, achievements, languages = [] }) {
  const { t } = useLang();
  return (
    <article className="card">
      <h3 className="card__title">{t(localized('m7c3e62ff78aa'))}</h3>
      <ol className="pubs">
        {items.map((e) => (
          <li key={e.id}>
            <time className="mono">{t(e.period)}</time>
            <strong>{t(e.title)}</strong>
            <span className="muted"> · {t(e.detail)}</span>
          </li>
        ))}
      </ol>
      {languages.length > 0 && (
        <>
          <h3 className="card__title card__title--spaced">{t(localized('mae10e11a3d25'))}</h3>
          <ul className="highlights">
            {languages.map((l) => (
              <li key={l.id}>
                <strong>{t(l.name)}</strong> — {t(l.level)}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="card__title card__title--spaced">{t(localized('m7b3aa149a04c'))}</h3>
      <ul className="highlights">
        {achievements.map((a) => (
          <li key={a.en}>{t(a)}</li>
        ))}
      </ul>
    </article>
  );
}
