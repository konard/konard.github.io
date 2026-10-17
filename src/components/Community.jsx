import { formatNumber } from './format';

// Stack Overflow reputation, badges and top answer tags plus the list of
// articles / talks and the education block.
export function StackOverflowCard({ so }) {
  const max = Math.max(...so.topTags.map((t) => t.score));
  return (
    <article className="card">
      <h3 className="card__title">
        <a href={so.url} target="_blank" rel="noopener noreferrer">
          Stack Overflow
        </a>
        <span className="muted"> · since {so.memberSince}</span>
      </h3>
      <div className="so__numbers">
        <span className="so__rep">
          <strong>{formatNumber(so.reputation)}</strong> reputation
        </span>
        <span className="badge badge--silver" aria-label={`${so.badges.silver} silver badges`}>
          ● {so.badges.silver}
        </span>
        <span className="badge badge--bronze" aria-label={`${so.badges.bronze} bronze badges`}>
          ● {so.badges.bronze}
        </span>
      </div>
      <ul className="hbars hbars--compact" aria-label="Top tags by answer score">
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
      <p className="muted small">Answer score per tag</p>
    </article>
  );
}

export function Publications({ items }) {
  return (
    <article className="card">
      <h3 className="card__title">Articles & talks</h3>
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

export function Education({ items, achievements }) {
  return (
    <article className="card">
      <h3 className="card__title">Education</h3>
      <ol className="pubs">
        {items.map((e) => (
          <li key={e.id}>
            <time className="mono">{e.period}</time>
            <strong>{e.title}</strong>
            <span className="muted"> · {e.detail}</span>
          </li>
        ))}
      </ol>
      <h3 className="card__title card__title--spaced">Highlights</h3>
      <ul className="highlights">
        {achievements.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </article>
  );
}
