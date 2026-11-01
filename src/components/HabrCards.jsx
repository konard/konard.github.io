import { useEffect, useState } from 'react';
import { fetchHabrCards, fetchHabrStatistics, mergeHabr } from '../data/habrLive';
import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatCompact, formatNumber } from './format';
import { DataMark } from './DataSources';
import { HABR_NOTE_ID, habrAuthorship } from '../data/habrAuthorship';
import { ArrowBigUp, Bookmark, Eye, MessageSquare } from 'lucide-react';
import { iconProps } from './icons';

const STATS = [
  ['views', { en: 'views', ru: 'просмотры' }, Eye],
  ['score', { en: 'karma', ru: 'карма' }, ArrowBigUp],
  ['bookmarks', { en: 'bookmarks', ru: 'закладки' }, Bookmark],
  ['comments', { en: 'comments', ru: 'комментарии' }, MessageSquare],
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
        const updated = snapshot.articles.filter((article) => stats[article.id]).length;
        setStatus(cards && updated === snapshot.articles.length ? 'live' : cards || updated ? 'partial' : 'snapshot');
      })
      .catch(() => !cancelled && setStatus('snapshot'));
    return () => {
      cancelled = true;
    };
  }, [snapshot, doFetch]);

  const authors = habrAuthorship(habr);
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
          {count(habr.articles.length, ARTICLES)}{' '}
          {t({
            en: `(${formatNumber(authors.mine, lang)} by me, ${formatNumber(authors.team, lang)} by the team)`,
            ru: `(${formatNumber(authors.mine, lang)} моих, ${formatNumber(authors.team, lang)} команды)`,
          })}{' '}
          <a className="data-mark" href={`#${HABR_NOTE_ID}`}>
            (**)
          </a>{' '}
          · {count(totals.views, VIEWS)} · {count(totals.bookmarks, BOOKMARKS)}
        </span>
        <span className={`habr__status habr__status--${status}`} aria-live="polite">
          {status === 'live' && t({ en: 'live numbers from the Habr API', ru: 'актуальные данные из API Хабра' })}
          {status === 'loading' && t({ en: 'refreshing from Habr…', ru: 'обновление с Хабра…' })}
          {status === 'partial' &&
            t({
              en: `Some numbers updated from Habr; remaining figures use the snapshot of ${snapshot.collectedAt.slice(0, 10)}`,
              ru: `Часть чисел обновлена с Хабра; остальные показатели — из снимка от ${snapshot.collectedAt.slice(0, 10)}`,
            })}
          {status === 'snapshot' &&
            t({
              en: `snapshot of ${habr.collectedAt.slice(0, 10)}`,
              ru: `снимок от ${habr.collectedAt.slice(0, 10)}`,
            })}{' '}
          <DataMark />
        </span>
      </div>
      <p className="habr__note muted" id={HABR_NOTE_ID}>
        {t({
          en: `(**) ${formatNumber(authors.mine, lang)} of the ${count(habr.articles.length, ARTICLES)} are written by me. The other ${formatNumber(authors.team, lang)} are written by members of the Deep.Foundation team; most of them were crafted with my direct participation, in consultation with me or under my direction. Views, bookmarks and other figures here count all ${formatNumber(habr.articles.length, lang)}.`,
          ru: `(**) Мной написано: ${count(authors.mine, ARTICLES)} из ${formatNumber(habr.articles.length, lang)}. Остальные ${formatNumber(authors.team, lang)} написаны участниками команды Deep.Foundation; большинство из них подготовлено при моём непосредственном участии, в консультации со мной или под моим руководством. Просмотры, закладки и другие показатели здесь учитывают все ${formatNumber(habr.articles.length, lang)}.`,
        })}
      </p>
      <ul className="habr__cards">
        {habr.articles.map((a, i) => (
          // The card floats in a plain wrapper: an animated element is restyled on every frame, and
          // restyling the framed card (its outline, corners and surface) took most of the frame (issue #47).
          <li
            key={a.id}
            className="habr__float"
            style={{ '--float-delay': `${-(i % 5) * 1.3}s`, '--float-time': `${7 + (i % 4)}s` }}
          >
            <div className="habr-card">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="habr-card__link" lang={a.lang}>
                {a.image && <img src={a.image} alt="" loading="lazy" className="habr-card__image" />}
                <span className="habr-card__meta">
                  {date(a.publishedAt, lang)} · {a.lang.toUpperCase()}
                  {a.company ? ' · Deep.Foundation' : ''}
                </span>
                <span className="habr-card__author">
                  {authors.own(a)
                    ? t({ en: 'by me', ru: 'автор — я' })
                    : `${t({ en: 'by', ru: 'автор —' })} @${a.author?.alias ?? '?'}`}
                </span>
                <h3 className="habr-card__title">{a.title}</h3>
                <span className="habr-card__hubs">{a.hubs.slice(0, 3).join(' · ')}</span>
              </a>
              <dl className="habr-card__stats">
                {STATS.map(([key, label, Icon]) => (
                  <div
                    key={key}
                    title={t({
                      en: `${formatNumber(a.statistics[key], lang)} ${label.en}`,
                      ru: `${label.ru}: ${formatNumber(a.statistics[key], lang)}`,
                    })}
                  >
                    <dt>
                      <Icon {...iconProps} /> {t(label)}
                    </dt>
                    <dd>
                      {formatCompact(a.statistics[key], lang)} <DataMark />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
