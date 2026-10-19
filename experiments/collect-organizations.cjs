#!/usr/bin/env node
// Collects public metadata of the organizations whose repositories are listed
// in docs/case-studies/issue-7/data/repositories.json.
// Usage: node experiments/collect-organizations.cjs [output-dir]
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'docs/case-studies/issue-7/data';
const repos = JSON.parse(fs.readFileSync(path.join(OUT, 'repositories.json'), 'utf8'));
const logins = [...new Set(repos.map((r) => r.owner))].filter((login) => login !== 'konard');
const api = (url) => JSON.parse(execFileSync('gh', ['api', url], { encoding: 'utf8' }));

const organizations = logins.map((login) => {
  const org = api(`orgs/${login}`);
  return {
    login: org.login,
    name: org.name,
    description: org.description,
    blog: org.blog || null,
    url: org.html_url,
    createdAt: org.created_at,
    publicRepos: org.public_repos,
    followers: org.followers,
  };
});
const user = api('users/konard');
const result = {
  collectedAt: new Date().toISOString(),
  user: {
    login: user.login,
    createdAt: user.created_at,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    followers: user.followers,
    following: user.following,
  },
  organizations,
};
fs.writeFileSync(path.join(OUT, 'organizations.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`organizations: ${organizations.length}`);
