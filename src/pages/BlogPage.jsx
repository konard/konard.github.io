import SocialEmbed from '../components/SocialEmbed';
import { embedUrl } from '../components/socialWidgets';
export { embedUrl } from '../components/socialWidgets';
import Select from '../components/Select';
import { useCallback, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Section from '../components/Section';
import { formatNumber } from '../components/format';
import archive from '../data/posts.json';
import { useLang, useResolvedTheme } from '../i18n/prefs';
import { DataMark } from '../components/DataSources';
import { plural } from '../i18n/plural';
import { dedupe, pick, visibleFor } from './feed';
import { useQueryParam } from './query';
import { Play } from 'lucide-react';
import { iconProps } from '../components/icons';

const NETWORKS = { x: 'X', vk: 'VK', telegram: 'Telegram' };
const LANGUAGES = { en: 'English', ru: 'Русский' };
// "Only posts in English": the language name after «на» is in the prepositional case.
const IN_LANGUAGE = {
  en: { en: 'English', ru: 'английском' },
  ru: { en: 'Russian', ru: 'русском' },
};
const FEED = { en: 'Feed', ru: 'Лента' };
// "in N stories": Russian needs the prepositional case after «в».
const IN_STORIES = { en: ['story', 'stories'], ru: ['истории', 'историях', 'историях'] };
const STORIES = { en: ['story', 'stories'], ru: ['история', 'истории', 'историй'] };
const POSTS = {
  en: ['archived post', 'archived posts'],
  ru: ['сохранённая запись', 'сохранённые записи', 'сохранённых записей'],
};
const TRANSLATIONS = {
  en: ['translation or cross-post is', 'translations and cross-posts are'],
  ru: ['перевод или кросспост объединён', 'перевода и кросспоста объединены', 'переводов и кросспостов объединены'],
};

const stories = dedupe(archive.posts);

const date = (iso, lang) =>
  new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// A picture that is not archived and no longer served by the CDN becomes a note instead of a broken image.
function Picture({ src, alt = '' }) {
  const [failed, setFailed] = useState(false);
  const { t } = useLang();
  if (failed)
    return (
      <span className="post__missing muted">
        {t({ en: 'Picture no longer available', ru: 'Изображение больше недоступно' })}
      </span>
    );
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

// Archived copies (public/archive/media) first: CDN links of deleted posts stop working.
function Media({ items }) {
  const { t } = useLang();
  if (!items.length) return null;
  return (
    <ul className={`post__media post__media--${Math.min(items.length, 4)}`}>
      {items.map((m) => (
        <li key={m.url}>
          {m.type === 'photo' ? (
            <Picture src={m.file || m.url} alt={m.alt} />
          ) : (
            <a href={m.url} target="_blank" rel="noopener noreferrer" className="post__video">
              {m.poster && <Picture src={m.posterFile || m.poster} />}
              <span>
                <Play {...iconProps} /> {t({ en: 'video', ru: 'видео' })}
              </span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Prefer the original public message; keep a readable archive even when a provider is blocked. */
export function Story({ story, lang }) {
  const post = pick(story, lang);
  const [embedded, setEmbedded] = useState(true);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const theme = useResolvedTheme();
  const src = embedUrl(post.embed, theme);
  const showEmbed = src && embedded && !failed;
  const others = story.posts.filter((p) => p !== post);
  const { t } = useLang();
  const archived = (
    <>
      {/* Collector permits formatting tags and http(s) links only. */}
      {post.html && <div className="post__body" dangerouslySetInnerHTML={{ __html: post.html }} />}
      <Media items={post.media} />
    </>
  );
  return (
    <li className="post" lang={post.lang}>
      <header className="post__head">
        <span className={`post__network post__network--${post.network}`}>{NETWORKS[post.network]}</span>
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="post__date">
          <time dateTime={post.publishedAt} lang={lang}>
            {date(post.publishedAt, lang)}
          </time>
        </a>
        {post.repostOf && (
          <a href={post.repostOf} target="_blank" rel="noopener noreferrer" className="muted">
            {t({ en: 'repost', ru: 'репост' })}
          </a>
        )}
      </header>
      {showEmbed ? (
        <>
          <SocialEmbed key={`${post.id}:${theme}`} embed={post.embed} theme={theme} onError={fail} />
          <details className="post__fallback">
            <summary>
              {t({
                en: 'Historical copy if the original is unavailable',
                ru: 'Сохранённая копия, если оригинал недоступен',
              })}{' '}
              <DataMark />
            </summary>
            {archived}
          </details>
        </>
      ) : (
        <>
          <p className="muted">
            {t({
              en: 'Historical copy · original embed unavailable',
              ru: 'Сохранённая копия · оригинальный виджет недоступен',
            })}{' '}
            <DataMark />
          </p>
          {archived}
        </>
      )}
      <footer className="post__foot">
        {src && (
          <button
            type="button"
            className="button button--small"
            onClick={() => {
              setEmbedded(!showEmbed);
              setFailed(false);
            }}
          >
            {showEmbed
              ? t({ en: 'Show archived copy', ru: 'Показать сохранённую копию' })
              : t({ en: 'Show embed', ru: 'Показать оригинал' })}
          </button>
        )}
        {others.length > 0 && (
          <span className="post__versions">
            {t({ en: 'Also:', ru: 'Также:' })}{' '}
            {others.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <a href={p.url} target="_blank" rel="noopener noreferrer" hrefLang={p.lang}>
                  {NETWORKS[p.network]} · {p.lang.toUpperCase()}
                </a>
              </span>
            ))}
          </span>
        )}
      </footer>
    </li>
  );
}

/**
 * One feed of the X, VK and Telegram posts: every post once, in the reader's language.
 * The posts follow the site language unless the reader picks another one; that
 * choice is kept in `?posts=`, because `?lang=` is the language of the site.
 */
export default function BlogPage({ initialLanguage }) {
  const { lang: siteLang, t } = useLang();
  const auto = LANGUAGES[initialLanguage] ? initialLanguage : siteLang;
  const [langParam, setLangParam] = useQueryParam('posts');
  const [network, setNetwork] = useQueryParam('network');
  const [onlyLang, setOnlyLang] = useState(false);
  const lang = LANGUAGES[langParam] ? langParam : auto;
  const number = (v) => formatNumber(v, siteLang);
  const words = (v, forms) => plural(v, siteLang, forms);

  const list = useMemo(
    () =>
      stories
        .filter((s) => !onlyLang || visibleFor(s, lang))
        .filter((s) => !network || s.posts.some((p) => p.network === network)),
    [onlyLang, lang, network],
  );
  const merged = archive.posts.length - stories.length;
  const sources = Object.entries(archive.counts)
    .map(([n, c]) => `${NETWORKS[n]} (${c})`)
    .join(t({ en: ' and ', ru: ' и ' }));

  return (
    <Layout page="blog" sections={[['feed', FEED]]}>
      <header className="page-hero" id="top">
        <p className="section__kicker">{t({ en: 'Blog', ru: 'Блог' })}</p>
        <h1 className="page-hero__title">{t({ en: 'Posts', ru: 'Записи' })}</h1>
        <p className="page-hero__lead">
          {t({
            en: `${number(archive.posts.length)} ${words(archive.posts.length, POSTS)} from ${sources} in ${number(stories.length)} ${words(stories.length, STORIES)}: ${number(merged)} ${words(merged, TRANSLATIONS)} merged, and every story is shown once, from X for English readers and from VK for Russian readers.`,
            ru: `${number(archive.posts.length)} ${words(archive.posts.length, POSTS)} из ${sources} в ${number(stories.length)} ${words(stories.length, IN_STORIES)}: ${number(merged)} ${words(merged, TRANSLATIONS)}, и каждая история показана один раз — из X для англоязычных читателей и из VK для русскоязычных.`,
          })}{' '}
          <DataMark />
        </p>
      </header>

      <Section
        id="feed"
        kicker={{
          en: `Archived ${archive.generatedAt.slice(0, 10)}`,
          ru: `Сохранено ${archive.generatedAt.slice(0, 10)}`,
        }}
        title={FEED}
      >
        <div className="filters" role="search">
          <label>
            <span>{t({ en: 'Language', ru: 'Язык' })}</span>
            <Select value={langParam} onChange={(e) => setLangParam(e.target.value)}>
              <option value="">
                {t({ en: 'Auto', ru: 'Авто' })} ({LANGUAGES[auto]})
              </option>
              {Object.entries(LANGUAGES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span>{t({ en: 'Network', ru: 'Сеть' })}</span>
            <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="">{t({ en: 'All networks', ru: 'Все сети' })}</option>
              {Object.keys(archive.counts).map((id) => (
                <option key={id} value={id}>
                  {NETWORKS[id]}
                </option>
              ))}
            </Select>
          </label>
          <label className="filters__check">
            <input type="checkbox" checked={onlyLang} onChange={(e) => setOnlyLang(e.target.checked)} />
            <span>
              {t({ en: 'Only posts in', ru: 'Только записи на' })} {t(IN_LANGUAGE[lang])}
            </span>
          </label>
          <output className="filters__count mono" aria-live="polite">
            {number(list.length)} {words(list.length, STORIES)}
          </output>
        </div>
        <ol className="posts" aria-label={t({ en: 'Posts', ru: 'Записи' })}>
          {list.map((s) => (
            <Story key={`${s.id}:${lang}`} story={s} lang={lang} />
          ))}
        </ol>
        <p className="muted posts__note">
          Telegram: <a href="https://t.me/drakonard">t.me/drakonard</a>{' '}
          {t({
            en: 'is a personal account without a public channel, so there is nothing public to archive yet. Posts on X are added by id because the X timeline is not public without a login.',
            ru: '— личный аккаунт без публичного канала, поэтому сохранять пока нечего. Записи из X добавляются по id, потому что лента X без входа не публична.',
          })}
        </p>
      </Section>
    </Layout>
  );
}
