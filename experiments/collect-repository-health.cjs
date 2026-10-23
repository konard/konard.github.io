#!/usr/bin/env node
// Collects the facts needed to hide repositories that are of no value to a
// visitor (issue 9): empty repositories (only a README and a license, like
// konard/TheAnime) and broken forks (history started by another account in a
// repository that no longer exists publicly, like konard/slava).
// For every repository of docs/case-studies/issue-7/data/repositories.json it
// records the disk usage, the top-level files with their sizes, the number of commits, the root
// commit (date and GitHub login of its author, never an e-mail) and, for
// copies of other repositories, whether the original is public.
// Usage: node experiments/collect-repository-health.cjs [output-file] [--verbose] [--only=owner/name,...]
// --only collects the given repositories and merges them into the existing output (issue #13).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const OUT =
  args.find((a) => !a.startsWith('--')) || path.join(root, 'docs/case-studies/issue-9/data/repository-health.json');
const only = (args.find((a) => a.startsWith('--only=')) || '').slice('--only='.length).split(',').filter(Boolean);
const repos = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/case-studies/issue-7/data/repositories.json'), 'utf8'),
).filter((r) => !only.length || only.includes(r.fullName));
const { CLIENTS } = require('../scripts/repositories.cjs');
const log = (...a) => verbose && console.error(...a);

function gh(argv) {
  for (let attempt = 1; ; attempt++) {
    try {
      return execFileSync('gh', argv, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      // GraphQL answers partial data (and exits with 1) when a repository was deleted since the collection.
      if (String(error.stdout).startsWith('{"data"')) return error.stdout;
      if (/Not Found|404/.test(String(error.stderr))) return null;
      if (attempt >= 3) throw error;
      execFileSync('sleep', [String(attempt * 5)]);
    }
  }
}

const gql = (query) => JSON.parse(gh(['api', 'graphql', '-f', `query=${query}`]) || '{}').data || {};
const quote = (s) => JSON.stringify(s);
const BATCH = 10;
const FILES = 60;

// Pass 1: size, files, number of commits and the head commit of every repository.
// GitHub answers 502 when a batch is too heavy (a huge top-level folder): then
// the batch is split into single repositories, and as the last resort the
// file sizes of that repository are not asked for.
const facts = {};
function pass1(batch, sizes = true) {
  const entry = sizes ? 'name object { ... on Blob { byteSize } }' : 'name';
  const body = batch
    .map(
      (r, k) => `r${k}: repository(owner: ${quote(r.owner)}, name: ${quote(r.name)}) {
        diskUsage isEmpty
        object(expression: "HEAD:") { ... on Tree { entries { ${entry} } } }
        defaultBranchRef { target { ... on Commit { oid history(first: 1) { totalCount } } } }
      }`,
    )
    .join('\n');
  let data;
  try {
    data = gql(`query { ${body} }`);
  } catch (error) {
    log(`failed (${batch.length} repositories, sizes: ${sizes}): ${String(error.stderr).trim()}`);
    if (batch.length > 1) return batch.forEach((r) => pass1([r], sizes));
    if (sizes) return pass1(batch, false);
    throw error;
  }
  batch.forEach((r, k) => {
    const d = data[`r${k}`];
    if (!d) {
      facts[r.fullName] = { missing: true };
      return log(`missing ${r.fullName}`);
    }
    const head = d.defaultBranchRef && d.defaultBranchRef.target;
    facts[r.fullName] = {
      diskUsage: d.diskUsage,
      isEmpty: d.isEmpty,
      // Top-level files and folders with their size in bytes (null for a folder or when unknown);
      // only the first FILES of them are kept, fileCount tells how many there are.
      fileCount: d.object ? d.object.entries.length : 0,
      files: Object.fromEntries(
        (d.object ? d.object.entries : [])
          .map((e) => [e.name, e.object && e.object.byteSize != null ? e.object.byteSize : null])
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, FILES),
      ),
      commits: head ? head.history.totalCount : 0,
      head: head ? head.oid : null,
    };
  });
}
for (let i = 0; i < repos.length; i += BATCH) {
  pass1(repos.slice(i, i + BATCH));
  console.error(`pass 1: ${Math.min(i + BATCH, repos.length)}/${repos.length}`);
}

// Pass 2: the root commit, reached with the "<head oid> <count - 2>" history cursor.
const withHistory = repos.filter((r) => facts[r.fullName]?.head);
for (let i = 0; i < withHistory.length; i += BATCH) {
  const batch = withHistory.slice(i, i + BATCH);
  const body = batch
    .map((r, k) => {
      const f = facts[r.fullName];
      const after = f.commits > 1 ? `, after: ${quote(`${f.head} ${f.commits - 2}`)}` : '';
      return `r${k}: repository(owner: ${quote(r.owner)}, name: ${quote(r.name)}) {
        defaultBranchRef { target { ... on Commit { history(first: 1${after}) {
          nodes { authoredDate author { user { login } } }
        } } } }
      }`;
    })
    .join('\n');
  const data = gql(`query { ${body} }`);
  batch.forEach((r, k) => {
    const node = data[`r${k}`]?.defaultBranchRef?.target?.history?.nodes?.[0];
    const f = facts[r.fullName];
    f.root = node ? { at: node.authoredDate, author: node.author.user ? node.author.user.login : null } : null;
    delete f.head;
    log(r.fullName, JSON.stringify(f.root));
  });
  console.error(`pass 2: ${Math.min(i + BATCH, withHistory.length)}/${withHistory.length}`);
}
for (const f of Object.values(facts)) delete f.head;

// Pass 3: is the original of a copy public? Copies named <client>-<name> without
// a known original are checked as <client>/<name> as well.
const clientPrefix = new RegExp(`^(${CLIENTS.join('|')})-(.+)$`, 'i');
for (const r of repos) {
  const match = r.owner === 'konard' && clientPrefix.exec(r.name);
  const original = r.copyOf || (match ? `${match[1]}/${match[2]}` : null);
  if (!original || !facts[r.fullName] || facts[r.fullName].missing) continue;
  const visibility = gh(['api', `repos/${original}`, '--jq', '.visibility']);
  // Nothing is recorded about an original that is not public (private or deleted).
  const isPublic = (visibility || '').trim() === 'public';
  facts[r.fullName].upstream = isPublic ? { fullName: original, public: true } : { public: false };
  log(r.fullName, isPublic ? `<- ${original}` : '<- (not public)');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const previous = only.length && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const merged = previous
  ? {
      collectedAt: previous.collectedAt,
      repositories: Object.fromEntries(
        Object.entries({ ...previous.repositories, ...facts }).sort(([a], [b]) => a.localeCompare(b)),
      ),
    }
  : { collectedAt: new Date().toISOString(), repositories: facts };
fs.writeFileSync(OUT, JSON.stringify(merged, null, 1) + '\n');
console.error(`wrote ${Object.keys(facts).length} repositories to ${path.relative(root, OUT)}`);
