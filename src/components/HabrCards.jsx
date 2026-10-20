import { useEffect, useState } from 'react';
import { fetchHabrCards, fetchHabrStatistics, mergeHabr } from '../data/habrLive';
import { formatCompact, formatNumber } from './format';

const STATS = [
  ['views', 'views', '👁'],
  ['score', 'karma', '▲'],
  ['bookmarks', 'bookmarks', '🔖'],
  ['comments', 'comments', '💬'],
];

const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });

/**
 * Floating cards of Deep.Foundation and konard articles on Habr. Shows the
 * committed snapshot at once and refreshes views, karma, bookmarks and
 * comments from the Habr API when it is reachable.
 */
export default function HabrCards({ snapshot, live = true, fetchImpl }) {
  const doFetch = live ? fetchImpl || (typeof fetch === 'function' ? fetch : null) : null;
  const [habr, setHabr] = useState(snapshot);
  const [status, setStatus] = useState(doFetch ? 'loading' : 'snapshot');

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
          rating <strong>{habr.company.rating}</strong> · {formatNumber(habr.company.subscribers)} subscribers
        </span>
        <span>
          <a href={habr.user.url} target="_blank" rel="noopener noreferrer">
            @{habr.user.alias}
          </a>{' '}
          karma <strong>{habr.user.karma}</strong>
        </span>
        <span>
          {habr.articles.length} articles · {formatNumber(totals.views)} views · {formatNumber(totals.bookmarks)}{' '}
          bookmarks
        </span>
        <span className={`habr__status habr__status--${status}`} aria-live="polite">
          {status === 'live' && 'live numbers from the Habr API'}
          {status === 'loading' && 'refreshing from Habr…'}
          {status === 'snapshot' && `snapshot of ${habr.collectedAt.slice(0, 10)}`}
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
                {date(a.publishedAt)} · {a.lang.toUpperCase()}
                {a.company ? ' · Deep.Foundation' : ''}
              </span>
              <h3 className="habr-card__title">{a.title}</h3>
              <span className="habr-card__hubs">{a.hubs.slice(0, 3).join(' · ')}</span>
            </a>
            <dl className="habr-card__stats">
              {STATS.map(([key, label, icon]) => (
                <div key={key} title={`${formatNumber(a.statistics[key])} ${label}`}>
                  <dt>
                    <span aria-hidden="true">{icon}</span> {label}
                  </dt>
                  <dd>{formatCompact(a.statistics[key])}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
