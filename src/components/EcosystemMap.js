import { formatNumber, SERIES } from './format';
import { Tooltip, useTooltip } from './Tooltip';

const SIZE = 520;
const C = SIZE / 2;
const ORBIT = 175;

// Orbit diagram: the person in the center, every GitHub owner (personal
// account + organizations) as a satellite whose area encodes repository count.
export default function EcosystemMap({ owners, avatarUrl }) {
  const { tip, show, hide } = useTooltip();
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
      <span className="tooltip__value">{formatNumber(o.repositories)} original repositories</span>
      <span className="tooltip__row">★ {formatNumber(o.stars)} stars · since {o.createdAt.slice(0, 4)}</span>
      <span className="tooltip__row">{o.languages.slice(0, 3).map((l) => l.name).join(' · ')}</span>
    </>
  );

  return (
    <div className="chart ecosystem" data-tooltip-root>
      <svg className="ecosystem__svg" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Ecosystem of GitHub organizations">
        <defs>
          <clipPath id="eco-avatar"><circle cx={C} cy={C} r={52} /></clipPath>
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
            aria-label={`${n.name}: ${n.repositories} repositories, ${n.stars} stars`}
            onPointerMove={(e) => show(e, tipContent(n))}
            onFocus={(e) => show(e, tipContent(n))}
            onPointerLeave={hide}
            onBlur={hide}
            onClick={() => window.open(n.url, '_blank', 'noopener')}
          >
            <circle cx={n.x} cy={n.y} r={n.r + 8} fill="transparent" />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity="0.22" stroke={n.color} strokeWidth="2" />
            <text x={n.x} y={n.y - 2} textAnchor="middle" className="ecosystem__count">{formatNumber(n.repositories)}</text>
            <text x={n.x} y={n.y + 13} textAnchor="middle" className="ecosystem__unit">repos</text>
            <text x={n.x} y={n.y + n.r + 18} textAnchor="middle" className="ecosystem__name">{n.name}</text>
          </g>
        ))}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}
