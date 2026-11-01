import { useLang } from '../i18n/prefs';
import { ContactIcon, hasContactIcon } from './icons';

export default function Contacts({ socials }) {
  const { t } = useLang();
  return (
    <ul className="socials">
      {socials.map((s) => (
        <li key={s.id}>
          <a className="social" href={s.url} target="_blank" rel="noopener noreferrer me">
            {/* The brand mark in SVG (issue #47), the first letter for a contact without one. */}
            <span className="social__icon" aria-hidden="true">
              {hasContactIcon(s.id) ? <ContactIcon id={s.id} /> : t(s.label)[0]}
            </span>
            <span className="social__label">{t(s.label)}</span>
            <span className="social__handle">{s.handle}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
