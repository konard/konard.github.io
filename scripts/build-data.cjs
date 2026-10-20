#!/usr/bin/env node
// Aggregates raw public data from docs/case-studies/issue-1/data and
// docs/case-studies/issue-7/data into the compact src/data/github.json and
// src/data/repositories.json consumed by the website.
// Refresh the raw data with experiments/collect-github-data.sh,
// experiments/collect-contributions.sh, experiments/collect-repositories.cjs,
// experiments/collect-organizations.cjs and experiments/collect-registries.cjs,
// then run `npm run build:data`.
const fs = require('fs');
const path = require('path');

const { buildRegistries } = require('./registries.cjs');
const { buildRepositories, isNoise, readCollected } = require('./repositories.cjs');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'docs', 'case-studies', 'issue-1', 'data');
const issue7Dir = path.join(root, 'docs', 'case-studies', 'issue-7', 'data');
const outFile = path.join(root, 'src', 'data', 'github.json');
const habrFile = path.join(root, 'src', 'data', 'habr.json');

const read = (name, dir = dataDir) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));

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

// Every language GitHub detected (by bytes) in original repositories:
// count = repositories that contain the language, primary = repositories where it dominates.
function languageStats(repos) {
  const stats = new Map();
  for (const repo of repos) {
    for (const [name, bytes] of Object.entries(repo.languages || {})) {
      const entry = stats.get(name) || { name, count: 0, primary: 0, bytes: 0, color: null };
      entry.count += 1;
      entry.bytes += bytes;
      entry.color = entry.color || (repo.colors && repo.colors[name]) || null;
      if (repo.language === name) entry.primary += 1;
      stats.set(name, entry);
    }
  }
  return [...stats.values()].sort((a, b) => b.count - a.count || b.bytes - a.bytes || a.name.localeCompare(b.name));
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
  const { user: userNow, organizations } = read('organizations.json', issue7Dir);
  const collected = readCollected();
  const { items } = buildRepositories({ write, repos: collected });
  const kindByName = new Map(items.map((r) => [r.fullName, r]));
  const allRepos = collected.filter((r) => kindByName.get(r.fullName).kind === 'own');
  const kinds = countBy(items, (r) => r.kind);
  const ownerLogins = [...new Set(collected.map((r) => r.owner))];
  const owners = ownerLogins
    .map((login) => {
      const repos = allRepos.filter((r) => r.owner === login);
      const org = organizations.find((o) => o.login === login);
      return {
        login,
        name: org ? org.name || org.login : '@konard',
        description: (org && org.description) || null,
        url: `https://github.com/${login}`,
        createdAt: (org || user).createdAt || user.created_at,
        repositories: repos.length,
        stars: repos.reduce((sum, r) => sum + r.stars, 0),
        languages: topEntries(
          countBy(repos, (r) => r.language),
          5,
        ),
      };
    })
    .filter((o) => o.repositories > 0)
    .sort((a, b) => b.repositories - a.repositories || a.login.localeCompare(b.login));

  const languages = languageStats(allRepos);
  const byStars = allRepos
    .filter((r) => r.stars > 0)
    .sort((a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName));
  const mostStarred = byStars.slice(0, 40);
  const extra = allRepos.filter((r) => featured.has(r.fullName) && !mostStarred.includes(r));
  const projects = [...mostStarred, ...extra].map((r) => ({
    name: r.name,
    fullName: r.fullName,
    owner: r.owner,
    description: r.description,
    language: r.language,
    stars: r.stars,
    forks: r.forks,
    url: r.url,
    createdYear: Number(r.createdAt.slice(0, 4)),
    topics: r.topics || [],
    fields: kindByName.get(r.fullName).fields,
  }));

  const so = read('stackoverflow-user.json');
  const kindOf = (fullName) => {
    const repo = items.find((r) => r.fullName.toLowerCase() === fullName);
    return repo ? repo.kind : null;
  };
  const { registries, packageRegistries } = buildRegistries(kindOf);
  const stackOverflow = {
    url: so.user.link,
    reputation: so.user.reputation,
    badges: so.user.badge_counts,
    memberSince: new Date(so.user.creation_date * 1000).getUTCFullYear(),
    // Drop near-duplicate sub-tags (docker-desktop, docker-for-windows) of an already listed tag.
    topTags: so.top_tags
      .filter((t) => !/^docker-/.test(t.tag_name))
      .slice(0, 8)
      .map((t) => ({ name: t.tag_name, score: t.answer_score, answers: t.answer_count })),
  };

  const result = {
    generatedFrom: ['docs/case-studies/issue-1/data', 'docs/case-studies/issue-7/data'],
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
      followers: userNow.followers,
      following: userNow.following,
      // Includes forks of other people's projects; see totals for original work.
      publicRepos: userNow.publicRepos,
      publicGists: userNow.publicGists,
      createdAt: user.created_at,
    },
    totals: {
      ownRepositories: allRepos.length,
      personalRepositories: allRepos.filter((r) => r.owner === 'konard').length,
      organizationRepositories: allRepos.filter((r) => r.owner !== 'konard').length,
      organizations: owners.filter((o) => o.login !== 'konard').length,
      clientCopies: kinds.client || 0,
      mirrors: kinds.mirror || 0,
      stars: allRepos.reduce((sum, r) => sum + r.stars, 0),
      contributions: contributions.reduce((sum, c) => sum + c.total, 0),
      languages: languages.length,
    },
    contributions,
    languages,
    owners,
    projects,
    registries,
    packageRegistries,
    stackOverflow,
  };

  if (write) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n');
    fs.writeFileSync(habrFile, JSON.stringify(buildHabr(), null, 2) + '\n');
  }
  return result;
}

// Snapshot of the Deep.Foundation and @Konard Habr articles; the website
// refreshes the statistics live from the public Habr API when it can.
function buildHabr() {
  const habr = read('habr.json', issue7Dir);
  return {
    collectedAt: habr.collectedAt,
    company: habr.company,
    user: habr.user,
    articles: [...habr.articles]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map(({ id, title, url, publishedAt, lang, company, author, hubs, tags, lead, image, statistics }) => ({
        id,
        title,
        url,
        publishedAt,
        lang,
        company,
        author,
        hubs,
        tags,
        lead,
        image,
        statistics,
      })),
  };
}

if (require.main === module) {
  const result = build();
  console.log(
    `Wrote ${path.relative(root, outFile)}: ${result.projects.length} projects, ` +
      `${result.languages.length} languages, ${result.totals.contributions} contributions`,
  );
}

module.exports = { build, buildHabr, isNoise, languageStats };
