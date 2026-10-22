import { useLang } from '../i18n/prefs';

/** A titled section; `kicker` and `title` are strings or `{ en, ru }` objects. */
export default function Section({ id, kicker, title, children, className = '' }) {
  const { t } = useLang();
  return (
    <section id={id} className={`section ${className}`} aria-labelledby={`${id}-title`}>
      <header className="section__header">
        {kicker && <span className="section__kicker">{t(kicker)}</span>}
        <h2 id={`${id}-title`} className="section__title">
          {t(title)}
        </h2>
      </header>
      {children}
    </section>
  );
}
