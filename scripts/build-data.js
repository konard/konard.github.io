#!/usr/bin/env node
// Aggregates raw public GitHub data from docs/case-studies/issue-1/data
// into the compact src/data/github.json consumed by the website.
// Refresh the raw data with experiments/collect-github-data.sh and
// experiments/collect-contributions.sh, then run `npm run build:data`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'docs', 'case-studies', 'issue-1', 'data');
const outFile = path.join(root, 'src', 'data', 'github.json');

const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));

const OWNERS = [
  { login: 'konard', file: 'repos-konard.json', name: '@konard' },
  { login: 'linksplatform', file: 'repos-linksplatform.json' },
  { login: 'deep-foundation', file: 'repos-deep-foundation.json' },
  { login: 'link-foundation', file: 'repos-link-foundation.json' },
  { login: 'link-assistant', file: 'repos-link-assistant.json' },
];

// Temporary/generated repositories that should not be shown as projects.
const isNoise = (repo) => /^log-tmp-|solution-draft-log/i.test(repo.name);

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = key(item);
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function topEntries(counts, limit) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// Featured repositories are curated in src/data/profile.js (an ES module);
// read their names textually so they are always present in the output even
// when they are not among the most starred repositories.
function featuredNames() {
  const source = fs.readFileSync(path.join(root, 'src', 'data', 'profile.js'), 'utf8');
  return new Set([...source.matchAll(/fullName: '([^']+)'/g)].map((m) => m[1]));
}

function build({ write = true } = {}) {
  const featured = featuredNames();
  const user = read('github-user.json');
  const contributions = read('github-contributions.json');
  const allRepos = [];
  const owners = OWNERS.map((owner) => {
    const repos = read(owner.file).filter((r) => !r.fork && !isNoise(r));
    repos.forEach((r) => allRepos.push({ ...r, owner: owner.login }));
    const org = owner.login === 'konard' ? null : read(`org-${owner.login}.json`);
    return {
      login: owner.login,
      name: owner.name || (org && org.name) || owner.login,
      description: org ? org.description : null,
      url: `https://github.com/${owner.login}`,
      createdAt: (org || user).created_at,
      repositories: repos.length,
      stars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
      languages: topEntries(countBy(repos, (r) => r.language), 5),
    };
  });

  const languageCounts = countBy(allRepos, (r) => r.language);
  const byStars = allRepos
    .filter((r) => r.stargazers_count > 0)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name));
  const mostStarred = byStars.slice(0, 40);
  const extra = allRepos.filter((r) => featured.has(r.full_name) && !mostStarred.includes(r));
  const projects = [...mostStarred, ...extra]
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      owner: r.owner,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      createdYear: Number(r.created_at.slice(0, 4)),
      topics: r.topics || [],
    }));

  const npm = read('npm-packages.json');
  const crates = read('crates.json');
  const nuget = read('nuget-packages.json')['owner:LinksPlatform'];
  const so = read('stackoverflow-user.json');
  const top = (items, value, limit = 6) => [...items].sort((a, b) => value(b) - value(a)).slice(0, limit);
  const registries = [
    {
      id: 'npm',
      name: 'npm',
      url: 'https://www.npmjs.com/~konard',
      packages: npm.total,
      downloads: npm.packages.reduce((sum, p) => sum + ((p.downloads && p.downloads.monthly) || 0), 0),
      downloadsUnit: 'downloads / month',
      top: top(npm.packages, (p) => (p.downloads && p.downloads.monthly) || 0)
        .map((p) => ({ name: p.name, downloads: p.downloads.monthly, url: p.npm })),
    },
    {
      id: 'crates',
      name: 'crates.io',
      url: crates.user,
      packages: crates.total,
      downloads: crates.crates.reduce((sum, c) => sum + c.downloads, 0),
      downloadsUnit: 'downloads total',
      top: top(crates.crates, (c) => c.downloads)
        .map((c) => ({ name: c.name, downloads: c.downloads, url: `https://crates.io/crates/${c.name}` })),
    },
    {
      id: 'nuget',
      name: 'NuGet',
      url: 'https://www.nuget.org/profiles/LinksPlatform',
      packages: nuget.totalHits,
      downloads: nuget.totalDownloads,
      downloadsUnit: 'downloads total',
      top: top(nuget.packages, (p) => p.totalDownloads)
        .map((p) => ({ name: p.id, downloads: p.totalDownloads, url: `https://www.nuget.org/packages/${p.id}` })),
    },
  ];
  const stackOverflow = {
    url: so.user.link,
    reputation: so.user.reputation,
    badges: so.user.badge_counts,
    memberSince: new Date(so.user.creation_date * 1000).getUTCFullYear(),
    // Drop near-duplicate sub-tags (docker-desktop, docker-for-windows) of an already listed tag.
    topTags: so.top_tags.filter((t) => !/^docker-/.test(t.tag_name)).slice(0, 8).map((t) => ({ name: t.tag_name, score: t.answer_score, answers: t.answer_count })),
  };

  const result = {
    generatedFrom: 'docs/case-studies/issue-1/data',
    profile: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      url: user.html_url,
      bio: user.bio,
      location: user.location,
      email: user.email,
      twitter: user.twitter_username,
      hireable: user.hireable,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      createdAt: user.created_at,
    },
    totals: {
      ownRepositories: allRepos.length,
      stars: allRepos.reduce((sum, r) => sum + r.stargazers_count, 0),
      contributions: contributions.reduce((sum, c) => sum + c.total, 0),
      languages: Object.keys(languageCounts).length,
    },
    contributions,
    languages: topEntries(languageCounts, 30),
    owners,
    projects,
    registries,
    stackOverflow,
  };

  if (write) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n');
  }
  return result;
}

if (require.main === module) {
  const result = build();
  console.log(`Wrote ${path.relative(root, outFile)}: ${result.projects.length} projects, ` +
    `${result.languages.length} languages, ${result.totals.contributions} contributions`);
}

module.exports = { build, isNoise };
