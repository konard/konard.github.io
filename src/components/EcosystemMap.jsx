import { useLang } from '../i18n/prefs';
import { plural } from '../i18n/plural';
import { formatNumber, SERIES } from './format';
import { Tooltip, useTooltip } from './Tooltip';
import { DataMark } from './DataSources';

const SIZE = 520;
const C = SIZE / 2;
const ORBIT = 175;
const ORIGINAL = {
  en: ['original repository', 'original repositories'],
  ru: ['собственный репозиторий', 'собственных репозитория', 'собственных репозиториев'],
};
const REPOSITORIES = { en: ['repository', 'repositories'], ru: ['репозиторий', 'репозитория', 'репозиториев'] };
const STARS = { en: ['star', 'stars'], ru: ['звезда', 'звезды', 'звёзд'] };

// Orbit diagram: the person in the center, every GitHub owner (personal
// account + organizations) as a satellite whose area encodes repository count.
export default function EcosystemMap({ owners, avatarUrl }) {
  const { tip, show, hide } = useTooltip();
  const { lang, t } = useLang();
  const count = (n, forms) => `${formatNumber(n, lang)} ${plural(n, lang, forms)}`;
  const maxRepos = Math.max(...owners.map((o) => o.repositories));
  const nodes = owners.map((o, i) => {
    const angle = (i / owners.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...o,
      color: SERIES[i % SERIES.length],
      x: C + Math.cos(angle) * ORBIT,
      y: C + Math.sin(angle) * ORBIT,
      r: 16 + Math.sqrt(o.repositories / maxRepos) * 40,
    };
  });

  const tipContent = (o) => (
    <>
      <strong>{o.name}</strong>
      <span className="tooltip__value">{count(o.repositories, ORIGINAL)}</span>
      <span className="tooltip__row">
        ★ {count(o.stars, STARS)} ·{' '}
        {t({ en: `since ${o.createdAt.slice(0, 4)}`, ru: `с ${o.createdAt.slice(0, 4)} года` })}
      </span>
      <span className="tooltip__row">
        {o.languages
          .slice(0, 3)
          .map((l) => l.name)
          .join(' · ')}
      </span>
    </>
  );

  return (
    <div className="chart ecosystem" data-tooltip-root>
      <svg
        className="ecosystem__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={t({ en: 'Ecosystem of GitHub organizations', ru: 'Экосистема организаций на GitHub' })}
      >
        <defs>
          <clipPath id="eco-avatar">
            <circle cx={C} cy={C} r={52} />
          </clipPath>
          <radialGradient id="eco-glow">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={ORBIT} className="ecosystem__orbit" />
        <circle cx={C} cy={C} r={ORBIT * 0.55} className="ecosystem__orbit ecosystem__orbit--inner" />
        {nodes.map((n) => (
          <line key={`l-${n.login}`} x1={C} y1={C} x2={n.x} y2={n.y} className="ecosystem__link" />
        ))}
        <circle cx={C} cy={C} r={95} fill="url(#eco-glow)" />
        <image href={avatarUrl} x={C - 52} y={C - 52} width={104} height={104} clipPath="url(#eco-avatar)" />
        <circle cx={C} cy={C} r={54} className="ecosystem__core" />
        {nodes.map((n) => (
          <g
            key={n.login}
            className="ecosystem__node"
            tabIndex={0}
            aria-label={`${n.name}: ${count(n.repositories, REPOSITORIES)}, ${count(n.stars, STARS)}`}
            onPointerMove={(e) => show(e, tipContent(n))}
            onFocus={(e) => show(e, tipContent(n))}
            onPointerLeave={hide}
            onBlur={hide}
            onClick={() => window.open(n.url, '_blank', 'noopener')}
          >
            <circle cx={n.x} cy={n.y} r={n.r + 8} fill="transparent" />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity="0.22" stroke={n.color} strokeWidth="2" />
            <text x={n.x} y={n.y - 2} textAnchor="middle" className="ecosystem__count">
              {formatNumber(n.repositories, lang)}
            </text>
            <text x={n.x} y={n.y + 13} textAnchor="middle" className="ecosystem__unit">
              {t({ en: 'repos', ru: 'репо' })}
            </text>
            <text x={n.x} y={n.y + n.r + 18} textAnchor="middle" className="ecosystem__name">
              {n.name}
            </text>
          </g>
        ))}
      </svg>
      <Tooltip tip={tip} />
      <DataMark />
    </div>
  );
}
