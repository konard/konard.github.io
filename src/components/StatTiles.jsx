import { formatCompact, formatNumber } from './format';

// Repository counts only include original work of konard and of his
// organizations: forks, copies of client projects, mirrors and generated test
// repositories are excluded (see scripts/repositories.cjs).
export function buildStats(github, codingSince, now = new Date(), habr = null) {
  const { totals } = github;
  const packages = github.registries.reduce((sum, r) => sum + r.packages, 0);
  const lifetime = github.registries.filter((r) => r.downloadsUnit === 'downloads total');
  const habrViews = habr ? habr.articles.reduce((sum, a) => sum + a.statistics.views, 0) : 0;
  return [
    {
      id: 'contributions',
      value: github.totals.contributions,
      label: 'GitHub contributions',
      hint: `${github.contributions[0].year}–${github.contributions[github.contributions.length - 1].year}`,
    },
    {
      id: 'repos',
      value: totals.ownRepositories,
      label: 'Original repositories',
      hint: `${formatNumber(totals.personalRepositories)} personal + ${formatNumber(totals.organizationRepositories)} in organizations, no forks`,
    },
    {
      id: 'organizations',
      value: totals.organizations,
      label: 'GitHub organizations',
      hint: 'founded, led or co-created',
    },
    {
      id: 'languages',
      value: totals.languages,
      label: 'Programming languages',
      hint: 'detected by GitHub in original repositories',
    },
    { id: 'gists', value: github.profile.publicGists, label: 'Public gists', hint: 'snippets, notes & logs' },
    {
      id: 'packages',
      value: packages,
      label: 'Published packages',
      hint: github.registries.map((r) => r.name).join(' · '),
    },
    {
      id: 'downloads',
      value: lifetime.reduce((sum, r) => sum + r.downloads, 0),
      label: 'Package downloads',
      hint: `lifetime, ${lifetime.map((r) => r.name).join(' + ')}`,
    },
    { id: 'stars', value: github.totals.stars, label: 'Stars on own projects', hint: 'personal + organizations' },
    {
      id: 'followers',
      value: github.profile.followers,
      label: 'GitHub followers',
      hint: `following ${formatNumber(github.profile.following)}`,
    },
    {
      id: 'reputation',
      value: github.stackOverflow.reputation,
      label: 'Stack Overflow reputation',
      hint: `member since ${github.stackOverflow.memberSince}`,
    },
    ...(habr
      ? [
          {
            id: 'habr',
            value: habrViews,
            label: 'Habr article views',
            hint: `${habr.articles.length} articles on links theory & Deep`,
          },
        ]
      : []),
    { id: 'years', value: now.getFullYear() - codingSince, label: 'Years of coding', hint: `since ${codingSince}` },
  ];
}

export default function StatTiles({ github, codingSince, habr }) {
  const stats = buildStats(github, codingSince, new Date(), habr);
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
