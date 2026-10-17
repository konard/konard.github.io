const ICONS = {
  github: 'GH',
  telegram: 'TG',
  x: 'X',
  youtube: 'YT',
  vk: 'VK',
  discord: 'DC',
  stackoverflow: 'SO',
  codersrank: 'CR',
  email: '@',
  habr: 'H',
  habrcareer: 'HC',
  linkedin: 'IN',
  npm: 'npm',
  nuget: 'NG',
  crates: 'RS',
};

export default function Contacts({ socials }) {
  return (
    <ul className="socials">
      {socials.map((s) => (
        <li key={s.id}>
          <a className="social" href={s.url} target="_blank" rel="noopener noreferrer me">
            <span className="social__icon mono" aria-hidden="true">
              {ICONS[s.id] || s.label[0]}
            </span>
            <span className="social__label">{s.label}</span>
            <span className="social__handle">{s.handle}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
