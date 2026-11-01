import { cvPagePath } from '../cv/paths';
import { useLang } from '../i18n/prefs';
import { useNotation } from '../links/notation';
import { MapPin } from 'lucide-react';
import { BioText, iconProps } from './icons';

const TEXT = {
  open: { en: 'Open to collaboration & hire', ru: 'Открыт к сотрудничеству и найму' },
  bio: { en: 'Public biography', ru: 'Публичная биография' },
  avatar: { en: 'avatar', ru: 'аватар' },
  github: { en: 'GitHub profile', ru: 'Профиль GitHub' },
  contacts: { en: 'Contacts', ru: 'Контакты' },
  cv: { en: 'Download CV', ru: 'Скачать резюме' },
};

export default function Hero({ profile, github }) {
  const { lang, t } = useLang();
  const { n } = useNotation();
  const name = t(profile.name);
  return (
    <header className="hero" id="top">
      <div className="hero__avatar">
        <span className="hero__ring" aria-hidden="true" />
        <img src={github.avatarUrl} alt={`${name} ${t(TEXT.avatar)}`} width="180" height="180" />
      </div>
      <div className="hero__text">
        <p className="hero__kicker">
          <span className="pulse" aria-hidden="true" />
          {t(profile.openToWork ? TEXT.open : TEXT.bio)}
        </p>
        <h1 className="hero__name">
          <span className="glitch" data-text={name}>
            {name}
          </span>
        </h1>
        <p className="hero__alt" lang={lang === 'ru' ? 'en' : 'ru'}>
          {t(profile.nameAlt)} · <span className="mono">@{profile.handle}</span>
        </p>
        <p className="hero__headline">{t(profile.headline)}</p>
        {profile.bio.map((line) => (
          <p key={line.en} className="hero__bio">
            <BioText text={t(line)} lang={lang} />
          </p>
        ))}
        <p className="hero__meta">
          <span>
            <MapPin {...iconProps} /> {t(profile.location)}
          </span>
          <span className="mono hero__motto">{n(profile.motto)}</span>
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href={cvPagePath({ lang })}>
            {t(TEXT.cv)}
          </a>
          <a className="button" href={github.url} target="_blank" rel="noopener noreferrer">
            {t(TEXT.github)}
          </a>
          <a className="button" href="#contacts">
            {t(TEXT.contacts)}
          </a>
        </div>
      </div>
    </header>
  );
}
