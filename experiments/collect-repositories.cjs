#!/usr/bin/env node
// Collects every non-fork public repository of konard and of the organizations
// konard founded or worked in, with languages by bytes, topics, stars and dates.
// Usage: node experiments/collect-repositories.cjs [output-dir]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'docs/case-studies/issue-7/data';
const OWNERS = [
  ['konard', 'user'],
  ['linksplatform', 'org'],
  ['deep-foundation', 'org'],
  ['link-foundation', 'org'],
  ['link-assistant', 'org'],
  ['deep-assistant', 'org'],
  ['OSWS', 'org'],
  ['EfficiencyParadigm', 'org'],
  ['meteor-shuttler', 'org'],
  ['styleschool', 'org'],
  ['Qvinciy', 'org'],
  ['open-online-tools', 'org'],
  ['correlation-center', 'org'],
  ['Svetozar-Technologies', 'org'],
  ['Gls-full', 'org'],
  ['links-games', 'org'],
];
const isNoise = (name) => /^log-tmp-|solution-draft-log/i.test(name);

const query = (kind) => `query($login: String!, $after: String) {
  ${kind === 'user' ? 'user' : 'organization'}(login: $login) {
    repositories(first: 50, after: $after, privacy: PUBLIC, isFork: false${kind === 'user' ? ', ownerAffiliations: OWNER' : ''}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name nameWithOwner description homepageUrl url isArchived
        stargazerCount forkCount createdAt pushedAt
        primaryLanguage { name }
        licenseInfo { spdxId }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        languages(first: 50, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

function gql(q, vars) {
  const args = ['api', 'graphql', '-f', `query=${q}`];
  for (const [k, v] of Object.entries(vars)) if (v != null) args.push('-F', `${k}=${v}`);
  for (let attempt = 1; ; attempt++) {
    try {
      return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 1 << 28 }));
    } catch (error) {
      if (attempt >= 4) throw error;
      execFileSync('sleep', [String(attempt * 5)]);
    }
  }
}

const all = [];
for (const [login, kind] of OWNERS) {
  let after = null;
  let count = 0;
  do {
    const data = gql(query(kind), { login, after });
    const conn = data.data[kind === 'user' ? 'user' : 'organization'].repositories;
    for (const r of conn.nodes) {
      if (isNoise(r.name)) continue;
      count++;
      all.push({
        owner: login,
        name: r.name,
        fullName: r.nameWithOwner,
        description: r.description,
        homepage: r.homepageUrl || null,
        url: r.url,
        archived: r.isArchived,
        stars: r.stargazerCount,
        forks: r.forkCount,
        createdAt: r.createdAt,
        pushedAt: r.pushedAt,
        language: r.primaryLanguage?.name || null,
        license: r.licenseInfo?.spdxId || null,
        topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
        languages: Object.fromEntries(r.languages.edges.map((e) => [e.node.name, e.size])),
        colors: Object.fromEntries(r.languages.edges.map((e) => [e.node.name, e.node.color])),
      });
    }
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  console.error(`${login}: ${count}`);
}
all.sort((a, b) => a.fullName.localeCompare(b.fullName));
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'repositories.json'), JSON.stringify(all, null, 1) + '\n');
console.error(`total: ${all.length}`);

// konard/<user>-<repo> repositories are non-fork copies of other people's
// projects (imported for paid or AI-assisted work). Detect them by checking
// whether <user>/<repo> exists on GitHub, so they are not counted as original work.
const exists = (fullName) => {
  try {
    execFileSync('gh', ['api', `repos/${fullName}`, '--jq', '.full_name'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};
for (const repo of all.filter((r) => r.owner === 'konard' && r.name.includes('-'))) {
  const parts = repo.name.split('-');
  for (let k = 1; k < parts.length && !repo.copyOf; k++) {
    const candidate = `${parts.slice(0, k).join('-')}/${parts.slice(k).join('-')}`;
    if (candidate.toLowerCase().startsWith('konard/')) continue;
    if (exists(candidate)) repo.copyOf = candidate;
  }
}
// link-foundation re-hosts the deep-foundation repositories with the same names.
const deepNames = new Set(all.filter((r) => r.owner === 'deep-foundation').map((r) => r.name.toLowerCase()));
for (const repo of all.filter((r) => r.owner === 'link-foundation'))
  if (deepNames.has(repo.name.toLowerCase())) repo.copyOf = `deep-foundation/${repo.name}`;
fs.writeFileSync(path.join(OUT, 'repositories.json'), JSON.stringify(all, null, 1) + '\n');
console.error(`copies: ${all.filter((r) => r.copyOf).length}`);
