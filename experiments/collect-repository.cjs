#!/usr/bin/env node
// Adds (or refreshes) single repositories in the collected data, in the same
// shape as experiments/collect-repositories.cjs, without refreshing the others.
// Used for link-foundation/lfs, created after the last full collection (issue #13).
// Usage: node experiments/collect-repository.cjs owner/name [...] && npm run build:data
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FILE = path.join('docs', 'case-studies', 'issue-7', 'data', 'repositories.json');

const query = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name nameWithOwner description homepageUrl url isArchived isFork isPrivate
    stargazerCount forkCount createdAt pushedAt
    primaryLanguage { name }
    licenseInfo { spdxId }
    repositoryTopics(first: 20) { nodes { topic { name } } }
    languages(first: 50, orderBy: { field: SIZE, direction: DESC }) {
      edges { size node { name color } }
    }
  }
}`;

const all = JSON.parse(fs.readFileSync(FILE, 'utf8'));
for (const fullName of process.argv.slice(2)) {
  const [owner, name] = fullName.split('/');
  const args = ['api', 'graphql', '-f', `query=${query}`, '-F', `owner=${owner}`, '-F', `name=${name}`];
  const r = JSON.parse(execFileSync('gh', args, { encoding: 'utf8' })).data.repository;
  if (r.isFork || r.isPrivate) throw new Error(`${fullName} is a fork or private`);
  const record = {
    owner,
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
  };
  const at = all.findIndex((x) => x.fullName === record.fullName);
  if (at >= 0) all[at] = record;
  else all.push(record);
  console.error(`${record.fullName}: ${at >= 0 ? 'refreshed' : 'added'}`);
}
all.sort((a, b) => a.fullName.localeCompare(b.fullName));
fs.writeFileSync(FILE, JSON.stringify(all, null, 1) + '\n');
