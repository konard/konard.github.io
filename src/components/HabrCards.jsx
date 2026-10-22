import { useEffect, useState } from 'react';
import { fetchHabrCards, fetchHabrStatistics, mergeHabr } from '../data/habrLive';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatCompact, formatNumber } from './format';

const STATS = [
  ['views', { en: 'views', ru: 'просмотры' }, '👁'],
  ['score', { en: 'karma', ru: 'карма' }, '▲'],
  ['bookmarks', { en: 'bookmarks', ru: 'закладки' }, '🔖'],
  ['comments', { en: 'comments', ru: 'комментарии' }, '💬'],
];
const SUBSCRIBERS = { en: ['subscriber', 'subscribers'], ru: ['подписчик', 'подписчика', 'подписчиков'] };
const ARTICLES = { en: ['article', 'articles'], ru: ['статья', 'статьи', 'статей'] };
const VIEWS = { en: ['view', 'views'], ru: ['просмотр', 'просмотра', 'просмотров'] };
const BOOKMARKS = { en: ['bookmark', 'bookmarks'], ru: ['закладка', 'закладки', 'закладок'] };

const date = (iso, lang) =>
  new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { year: 'numeric', month: 'short' });

/**
 * Floating cards of Deep.Foundation and konard articles on Habr. Shows the
 * committed snapshot at once and refreshes views, karma, bookmarks and
 * comments from the Habr API when it is reachable.
 */
export default function HabrCards({ snapshot, live = true, fetchImpl }) {
  const doFetch = live ? fetchImpl || (typeof fetch === 'function' ? fetch : null) : null;
  const [habr, setHabr] = useState(snapshot);
  const [status, setStatus] = useState(doFetch ? 'loading' : 'snapshot');
  const { lang, t } = useLang();
  const count = (n, forms) => `${formatNumber(n, lang)} ${plural(n, lang, forms)}`;

  useEffect(() => {
    if (!doFetch) return undefined;
    let cancelled = false;
    Promise.all([fetchHabrStatistics(doFetch), fetchHabrCards(doFetch).catch(() => null)])
      .then(([stats, cards]) => {
        if (cancelled) return;
        setHabr(mergeHabr(snapshot, stats, cards));
        setStatus('live');
      })
      .catch(() => !cancelled && setStatus('snapshot'));
    return () => {
      cancelled = true;
    };
  }, [snapshot, doFetch]);

  const totals = Object.fromEntries(
    STATS.map(([key]) => [key, habr.articles.reduce((sum, a) => sum + a.statistics[key], 0)]),
  );

  return (
    <div className="habr">
      <div className="habr__summary">
        <a href={habr.company.url} target="_blank" rel="noopener noreferrer" className="habr__company">
          {habr.company.title}
        </a>
        <span>
          {t({ en: 'rating', ru: 'рейтинг' })} <strong>{formatNumber(habr.company.rating, lang)}</strong> ·{' '}
          {count(habr.company.subscribers, SUBSCRIBERS)}
        </span>
        <span>
          <a href={habr.user.url} target="_blank" rel="noopener noreferrer">
            @{habr.user.alias}
          </a>{' '}
          {t({ en: 'karma', ru: 'карма' })} <strong>{formatNumber(habr.user.karma, lang)}</strong>
        </span>
        <span>
          {count(habr.articles.length, ARTICLES)} · {count(totals.views, VIEWS)} · {count(totals.bookmarks, BOOKMARKS)}
        </span>
        <span className={`habr__status habr__status--${status}`} aria-live="polite">
          {status === 'live' && t({ en: 'live numbers from the Habr API', ru: 'актуальные данные из API Хабра' })}
          {status === 'loading' && t({ en: 'refreshing from Habr…', ru: 'обновление с Хабра…' })}
          {status === 'snapshot' &&
            t({ en: `snapshot of ${habr.collectedAt.slice(0, 10)}`, ru: `снимок от ${habr.collectedAt.slice(0, 10)}` })}
        </span>
      </div>
      <ul className="habr__cards">
        {habr.articles.map((a, i) => (
          <li
            key={a.id}
            className="habr-card"
            style={{ '--float-delay': `${-(i % 5) * 1.3}s`, '--float-time': `${7 + (i % 4)}s` }}
          >
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="habr-card__link" lang={a.lang}>
              {a.image && <img src={a.image} alt="" loading="lazy" className="habr-card__image" />}
              <span className="habr-card__meta">
                {date(a.publishedAt, lang)} · {a.lang.toUpperCase()}
                {a.company ? ' · Deep.Foundation' : ''}
              </span>
              <h3 className="habr-card__title">{a.title}</h3>
              <span className="habr-card__hubs">{a.hubs.slice(0, 3).join(' · ')}</span>
            </a>
            <dl className="habr-card__stats">
              {STATS.map(([key, label, icon]) => (
                <div
                  key={key}
                  title={t({
                    en: `${formatNumber(a.statistics[key], lang)} ${label.en}`,
                    ru: `${label.ru}: ${formatNumber(a.statistics[key], lang)}`,
                  })}
                >
                  <dt>
                    <span aria-hidden="true">{icon}</span> {t(label)}
                  </dt>
                  <dd>{formatCompact(a.statistics[key], lang)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
