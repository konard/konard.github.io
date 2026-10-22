import { PAGES } from '../pages/pages';
import { useLang } from '../i18n/prefs';
import Glyph from './Glyph';

/** Links to the other pages of the site, each with its own link symbol. */
export default function PageCards({ current = 'home' }) {
  const { t } = useLang();
  return (
    <ul className="page-cards">
      {PAGES.filter((p) => p.id !== current).map((p) => (
        <li key={p.id}>
          <a href={p.href} className="page-card">
            <Glyph code={p.glyph} size={56} />
            <span className="page-card__title">{t(p.title)}</span>
            <span className="page-card__summary">{t(p.summary)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
