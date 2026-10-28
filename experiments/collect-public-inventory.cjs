#!/usr/bin/env node
// Audit every public repository, including forks and public memberships omitted
// from the curated project catalog. Never persist authenticated private nodes.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { isNoise } = require('../scripts/repositories.cjs');
const dir = 'docs/case-studies/issue-33/data/';
const read = (name) => JSON.parse(fs.readFileSync(dir + name + '.json', 'utf8'));
const write = (name, data) => fs.writeFileSync(dir + name + '.json', JSON.stringify(data, null, 2) + '\n');
function gql(query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return JSON.parse(
        execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], {
          encoding: 'utf8',
          maxBuffer: 64 * 1024 ** 2,
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      ).data;
    } catch (error) {
      let partial;
      try {
        partial = JSON.parse(error.stdout);
      } catch {
        /* No public response can be retained. */
      }
      if (partial?.data && partial.errors?.every((e) => e.type === 'NOT_FOUND')) return partial.data;
      if (attempt < 3) execFileSync('sleep', [String(attempt * 2)]);
      if (attempt === 3) {
        console.error(
          JSON.stringify({
            operation: 'public-inventory',
            processStatus: error.status,
            apiErrorTypes: partial?.errors?.map((e) => e.type),
            apiMessage: partial?.message,
            responseBytes: error.stdout?.length,
          }),
        );
        // Do not expose authenticated response bodies in an exception.
        // eslint-disable-next-line preserve-caught-error
        throw new Error('Public inventory query failed after three attempts');
      }
    }
  }
}
const user = gql('query { user(login:"konard") { id } }').user;
// This username endpoint lists public memberships, unlike /user/orgs.
const memberships = JSON.parse(
  execFileSync('gh', ['api', 'users/konard/orgs', '--paginate', '--slurp'], { encoding: 'utf8' }),
).flat();
const owners = new Set([
  'konard',
  ...read('organizations').organizations.map((o) => o.login),
  ...memberships.map((o) => o.login),
]);
const head = `defaultBranchRef { target { ... on Commit {
  oid history(first:1,author:{id:"${user.id}"}) { nodes { oid author { email } } }
} } }`;
const inventory = [];
const checkpointFile = dir + 'public-inventory.checkpoint.json';
const checkpoint = fs.existsSync(checkpointFile)
  ? JSON.parse(fs.readFileSync(checkpointFile, 'utf8'))
  : { accounts: [], repositories: [], heads: {} };
inventory.push(...checkpoint.repositories.filter((repo) => owners.has(repo.owner)));
const allowedHeads = new Set([
  ...inventory.map((repo) => repo.fullName),
  ...read('contributed-repositories').repositories,
]);
const heads = Object.fromEntries(Object.entries(checkpoint.heads).filter(([name]) => allowedHeads.has(name)));
const accountCounts = checkpoint.accounts.filter((account) => owners.has(account.login));
const emailFile = '/tmp/issue33-source-cache/verified-account-emails.json';
const verifiedEmails = new Set(fs.existsSync(emailFile) ? JSON.parse(fs.readFileSync(emailFile, 'utf8')) : []);
function saveCheckpoint() {
  fs.writeFileSync(
    checkpointFile + '.tmp',
    JSON.stringify({ accounts: accountCounts, repositories: inventory, heads }),
  );
  fs.renameSync(checkpointFile + '.tmp', checkpointFile);
  fs.mkdirSync('/tmp/issue33-source-cache', { recursive: true });
  fs.writeFileSync(emailFile, JSON.stringify([...verifiedEmails]));
}
function retain(r, checkedAt, catalog = false) {
  if (!r || r.isPrivate || r.visibility !== 'PUBLIC') return;
  const target = r.defaultBranchRef?.target;
  if (!catalog) {
    heads[r.nameWithOwner] = {
      sha: target?.oid || null,
      hasPersonalCommits: Boolean(target?.history?.nodes.length),
      checkedAt,
    };
    for (const commit of target?.history?.nodes || []) {
      if (commit.author?.email) verifiedEmails.add(commit.author.email.toLowerCase());
    }
  }
  if (catalog) {
    const [owner, name] = r.nameWithOwner.split('/');
    const repo = {
      owner,
      name,
      fullName: r.nameWithOwner,
      description: r.description,
      fork: r.isFork,
      language: r.primaryLanguage?.name || null,
      topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
    };
    inventory.push({ ...repo, generatedNoise: isNoise(repo) });
  }
}
for (const login of [...owners].sort()) {
  if (accountCounts.some((account) => account.login === login)) continue;
  const endpoint =
    login === 'konard' ? 'users/konard/repos?type=owner&per_page=100' : `orgs/${login}/repos?type=public&per_page=100`;
  const pages = JSON.parse(
    execFileSync('gh', ['api', endpoint, '--paginate', '--slurp'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 ** 2,
    }),
  );
  let count = 0;
  for (const r of pages.flat()) {
    if (r.private || r.visibility !== 'public') continue;
    retain(
      {
        nameWithOwner: r.full_name,
        description: r.description,
        isPrivate: false,
        visibility: 'PUBLIC',
        isFork: r.fork,
        primaryLanguage: { name: r.language },
        repositoryTopics: { nodes: (r.topics || []).map((name) => ({ topic: { name } })) },
      },
      new Date().toISOString(),
      true,
    );
    count++;
  }
  accountCounts.push({ login, publicRepositories: count });
  saveCheckpoint();
  console.log(`${login}: ${count} public repositories, including forks`);
}
const pending = [
  ...new Set([
    ...inventory.filter((repo) => !repo.generatedNoise).map((repo) => repo.fullName),
    ...read('contributed-repositories').repositories,
  ]),
].filter((name) => !heads[name]);
function checkHeads(batch) {
  let data;
  try {
    data = gql(
      `query { ${batch
        .map((name, i) => {
          const [owner, repo] = name.split('/');
          return `r${i}:repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(repo)}) { nameWithOwner isPrivate visibility ${head} }`;
        })
        .join('\n')} }`,
    );
  } catch (error) {
    if (batch.length === 1) throw error;
    const middle = Math.ceil(batch.length / 2);
    checkHeads(batch.slice(0, middle));
    checkHeads(batch.slice(middle));
    return;
  }
  const checkedAt = new Date().toISOString();
  for (const r of Object.values(data)) retain(r, checkedAt);
  saveCheckpoint();
}
for (let start = 0; start < pending.length; start += 25) {
  checkHeads(pending.slice(start, start + 25));
  console.log(`Public account history checks: ${Math.min(start + 25, pending.length)}/${pending.length}`);
}
const collectedAt = new Date().toISOString();
write('public-inventory', {
  collectedAt,
  method:
    'All public repositories, including forks, of curated organizations and every public GitHub organization membership; generated logs remain in the audit but are excluded from source indicators.',
  accounts: accountCounts,
  repositories: inventory.sort((a, b) => a.fullName.localeCompare(b.fullName)),
});
write('author-heads', {
  collectedAt,
  method:
    'Public default-branch commit history filtered by the verified GitHub user ID. An empty history proves no currently mapped konard commits at the recorded SHA; private nodes are discarded before persistence.',
  repositories: heads,
});
fs.unlinkSync(checkpointFile);
console.log(`Saved ${inventory.length} public repository records and ${Object.keys(heads).length} public heads.`);
