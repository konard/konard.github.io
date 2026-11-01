import { useLang } from '../i18n/prefs';
import { SkillIcon, StarMark } from './icons';

export default function Skills({ groups, favorites }) {
  const { t } = useLang();
  return (
    <ul className="skills">
      {groups.map((g) => (
        <li key={g.id} className="skills__group">
          <h3 className="skills__title">
            <SkillIcon name={g.icon} /> {t(g.title)}
          </h3>
          <ul className="tags tags--large">
            {g.items.map((item) => (
              <li key={item} className={favorites.includes(item) ? 'is-favorite' : ''}>
                {item}
                {favorites.includes(item) && (
                  <span role="img" aria-label={t({ en: 'favorite', ru: 'любимый' })}>
                    {' '}
                    <StarMark />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
