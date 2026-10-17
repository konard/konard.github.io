export default function Hero({ profile, github }) {
  return (
    <header className="hero" id="top">
      <div className="hero__avatar">
        <span className="hero__ring" aria-hidden="true" />
        <img src={github.avatarUrl} alt={`${profile.name} avatar`} width="180" height="180" />
      </div>
      <div className="hero__text">
        <p className="hero__kicker">
          <span className="pulse" aria-hidden="true" />
          {profile.openToWork ? 'Open to collaboration & hire' : 'Public biography'}
        </p>
        <h1 className="hero__name">
          <span className="glitch" data-text={profile.name}>
            {profile.name}
          </span>
        </h1>
        <p className="hero__alt" lang="ru">
          {profile.nameAlt} · <span className="mono">@{profile.handle}</span>
        </p>
        <p className="hero__headline">{profile.headline}</p>
        {profile.bio.map((line) => (
          <p key={line} className="hero__bio">
            {line}
          </p>
        ))}
        <p className="hero__meta">
          <span>📍 {profile.location}</span>
          <span className="mono hero__motto">{profile.motto}</span>
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href={github.url} target="_blank" rel="noopener noreferrer">
            GitHub profile
          </a>
          <a className="button" href="#contacts">
            Contacts
          </a>
          <button className="button" type="button" onClick={() => window.print()}>
            Print / PDF CV
          </button>
        </div>
      </div>
    </header>
  );
}
