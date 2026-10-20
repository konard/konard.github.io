import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Section from '../components/Section';
import { formatNumber } from '../components/format';
import archive from '../data/posts.json';
import { dedupe, pick, readerLanguage, visibleFor } from './feed';
import { useQueryParam } from './query';

const NETWORKS = { x: 'X', vk: 'VK', telegram: 'Telegram' };
const LANGUAGES = { en: 'English', ru: 'Русский' };
const IN_LANGUAGE = { en: 'English', ru: 'Russian' };

const stories = dedupe(archive.posts);

const date = (iso, lang) =>
  new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// The official X embed as an iframe (no third-party script on the page). VK
// wall embeds need a per-post hash that is only issued to logged-in users, so
// VK posts are always shown from the archive.
function XEmbed({ id }) {
  return (
    <iframe
      className="post__embed"
      title="Post on X"
      src={`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true`}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}

// Archived copies (public/archive/media) first: CDN links of deleted posts stop working.
function Media({ items }) {
  if (!items.length) return null;
  return (
    <ul className={`post__media post__media--${Math.min(items.length, 4)}`}>
      {items.map((m) => (
        <li key={m.url}>
          {m.type === 'photo' ? (
            <img src={m.file || m.url} alt={m.alt || ''} loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <a href={m.url} target="_blank" rel="noopener noreferrer" className="post__video">
              {m.poster && <img src={m.posterFile || m.poster} alt="" loading="lazy" referrerPolicy="no-referrer" />}
              <span>▶ video</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/** One story: the version for the reader, links to the other versions and the original embed on demand. */
export function Story({ story, lang }) {
  const post = pick(story, lang);
  const [embedded, setEmbedded] = useState(false);
  const others = story.posts.filter((p) => p !== post);
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
            repost
          </a>
        )}
      </header>
      {embedded && post.embed?.type === 'x' ? (
        <XEmbed id={post.embed.id} />
      ) : (
        <>
          {/* The archived HTML is sanitized by experiments/archive-posts.cjs: only formatting tags and http(s) links. */}
          {post.html && <div className="post__body" dangerouslySetInnerHTML={{ __html: post.html }} />}
          <Media items={post.media} />
        </>
      )}
      <footer className="post__foot">
        {post.embed?.type === 'x' && (
          <button type="button" className="button button--small" onClick={() => setEmbedded(!embedded)}>
            {embedded ? 'Show archived copy' : 'Show embed'}
          </button>
        )}
        {others.length > 0 && (
          <span className="post__versions">
            Also:{' '}
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

/** One feed of the X, VK and Telegram posts: every post once, in the reader's language. */
export default function BlogPage({ initialLanguage = readerLanguage() }) {
  const [langParam, setLang] = useQueryParam('lang');
  const [network, setNetwork] = useQueryParam('network');
  const [onlyLang, setOnlyLang] = useState(false);
  const lang = LANGUAGES[langParam] ? langParam : initialLanguage;

  const list = useMemo(
    () =>
      stories
        .filter((s) => !onlyLang || visibleFor(s, lang))
        .filter((s) => !network || s.posts.some((p) => p.network === network)),
    [onlyLang, lang, network],
  );
  const merged = archive.posts.length - stories.length;

  return (
    <Layout page="blog" sections={[['feed', 'Feed']]}>
      <header className="page-hero" id="top">
        <p className="section__kicker">Blog</p>
        <h1 className="page-hero__title">Posts</h1>
        <p className="page-hero__lead">
          {formatNumber(archive.posts.length)} archived posts from{' '}
          {Object.entries(archive.counts)
            .map(([n, c]) => `${NETWORKS[n]} (${c})`)
            .join(' and ')}{' '}
          in {formatNumber(stories.length)} stories: {formatNumber(merged)} translations and cross-posts are merged, and
          every story is shown once, from X for English readers and from VK for Russian readers.
        </p>
      </header>

      <Section id="feed" kicker={`Archived ${archive.generatedAt.slice(0, 10)}`} title="Feed">
        <div className="filters" role="search">
          <label>
            <span>Language</span>
            <select value={langParam} onChange={(e) => setLang(e.target.value)}>
              <option value="">Auto ({LANGUAGES[initialLanguage]})</option>
              {Object.entries(LANGUAGES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Network</span>
            <select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="">All networks</option>
              {Object.keys(archive.counts).map((id) => (
                <option key={id} value={id}>
                  {NETWORKS[id]}
                </option>
              ))}
            </select>
          </label>
          <label className="filters__check">
            <input type="checkbox" checked={onlyLang} onChange={(e) => setOnlyLang(e.target.checked)} />
            <span>Only posts in {IN_LANGUAGE[lang]}</span>
          </label>
          <output className="filters__count mono" aria-live="polite">
            {formatNumber(list.length)} {list.length === 1 ? 'story' : 'stories'}
          </output>
        </div>
        <ol className="posts" aria-label="Posts">
          {list.map((s) => (
            <Story key={s.id} story={s} lang={lang} />
          ))}
        </ol>
        <p className="muted posts__note">
          Telegram: <a href="https://t.me/drakonard">t.me/drakonard</a> is a personal account without a public channel,
          so there is nothing public to archive yet. Posts on X are added by id because the X timeline is not public
          without a login.
        </p>
      </Section>
    </Layout>
  );
}
