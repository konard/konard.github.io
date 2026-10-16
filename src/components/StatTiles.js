import { formatCompact, formatNumber } from './format';

export function buildStats(github, codingSince, now = new Date()) {
  const packages = github.registries.reduce((sum, r) => sum + r.packages, 0);
  const lifetime = github.registries.filter((r) => r.downloadsUnit === 'downloads total');
  return [
    { id: 'contributions', value: github.totals.contributions, label: 'GitHub contributions', hint: `${github.contributions[0].year}–${github.contributions[github.contributions.length - 1].year}` },
    { id: 'repos', value: github.profile.publicRepos, label: 'Public repositories', hint: `${formatNumber(github.totals.ownRepositories)} original incl. organizations` },
    { id: 'gists', value: github.profile.publicGists, label: 'Public gists', hint: 'snippets, notes & logs' },
    { id: 'packages', value: packages, label: 'Published packages', hint: github.registries.map((r) => r.name).join(' · ') },
    { id: 'downloads', value: lifetime.reduce((sum, r) => sum + r.downloads, 0), label: 'Package downloads', hint: `lifetime, ${lifetime.map((r) => r.name).join(' + ')}` },
    { id: 'stars', value: github.totals.stars, label: 'Stars on own projects', hint: 'personal + organizations' },
    { id: 'followers', value: github.profile.followers, label: 'GitHub followers', hint: `following ${formatNumber(github.profile.following)}` },
    { id: 'years', value: now.getFullYear() - codingSince, label: 'Years of coding', hint: `since ${codingSince}` },
  ];
}

export default function StatTiles({ github, codingSince }) {
  const stats = buildStats(github, codingSince);
  return (
    <ul className="stats" aria-label="Key numbers">
      {stats.map((s) => (
        <li key={s.id} className="stat">
          <span className="stat__value" title={formatNumber(s.value)}>
            {s.value >= 10000 ? formatCompact(s.value) : formatNumber(s.value)}
          </span>
          <span className="stat__label">{s.label}</span>
          <span className="stat__hint">{s.hint}</span>
        </li>
      ))}
    </ul>
  );
}
