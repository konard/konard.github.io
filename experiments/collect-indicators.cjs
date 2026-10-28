#!/usr/bin/env node
// Public-only indicator discovery. Never persist repository records with private visibility.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const OUT = process.argv[2] || 'docs/case-studies/issue-33/data';
const api = (args) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return JSON.parse(
        execFileSync('gh', ['api', ...args], {
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      );
    } catch (error) {
      // Never log raw authenticated API responses: they may contain private names.
      if (attempt === 3) {
        let partial;
        try {
          partial = JSON.parse(error.stdout);
        } catch {
          /* no usable partial response */
        }
        if (partial?.data?.user?.pullRequests && partial.errors?.every((e) => e.type === 'INTERNAL')) {
          console.log('GitHub returned unavailable pull-request nodes; retaining the remaining public results.');
          return { data: partial.data };
        }
        // Raw causes contain authenticated responses, including private repository names.
        // eslint-disable-next-line preserve-caught-error
        throw new Error('GitHub API request failed after three attempts');
      }
      execFileSync('sleep', [String(attempt * 2)]);
    }
  }
};
const gql = (query) => {
  const r = api(['graphql', '-f', `query=${query}`]);
  if (r.errors) throw new Error(JSON.stringify(r.errors));
  return r.data.user;
};
const write = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n');
fs.mkdirSync(OUT, { recursive: true });
const progressFile = path.join(OUT, 'indicator-progress.json');
const progress = fs.existsSync(progressFile)
  ? JSON.parse(fs.readFileSync(progressFile, 'utf8'))
  : { years: [], repositories: [], after: null };
const collectedAt = new Date().toISOString();
const years = progress.years;
const repositories = new Set(progress.repositories);
function checkpoint(after = null) {
  write('indicator-progress.json', { years, repositories: [...repositories].sort(), after });
}
const fields = 'nameWithOwner isPrivate visibility';
function discover(from, to) {
  const c = gql(`query { user(login:"konard") { contributionsCollection(from:"${from}",to:"${to}") {
    totalRepositoriesWithContributedCommits
    commitContributionsByRepository(maxRepositories:100) { repository { ${fields} } }
  } } }`).contributionsCollection;
  if (c.totalRepositoriesWithContributedCommits > 100) {
    const start = new Date(from),
      end = new Date(to);
    if (end - start < 86400000) {
      // The calendar API caps repositories even for a single busy day. Commit
      // search is independently paginated and restricted to public results.
      const day = from.slice(0, 10);
      let page = 1,
        total;
      do {
        const result = api([`search/commits?q=author%3Akonard+author-date%3A${day}&per_page=100&page=${page}`]);
        total = result.total_count;
        if (result.incomplete_results || total > 1000) throw new Error(`Commit search truncated on ${day}`);
        for (const { repository: r } of result.items) if (!r.private) repositories.add(r.full_name);
        page++;
      } while ((page - 1) * 100 < total);
      return;
    }
    const mid = new Date(Math.floor((+start + +end) / 2));
    discover(from, mid.toISOString());
    discover(new Date(+mid + 1).toISOString(), to);
  } else {
    for (const { repository: r } of c.commitContributionsByRepository)
      if (!r.isPrivate && r.visibility === 'PUBLIC') repositories.add(r.nameWithOwner);
  }
}
const calendar = gql(`query { user(login:"konard") { contributionsCollection {
  contributionCalendar { totalContributions colors months { firstDay name totalWeeks year }
    weeks { firstDay contributionDays { date weekday contributionCount contributionLevel color } } }
  restrictedContributionsCount
} } }`).contributionsCollection;
write('contributions.json', {
  collectedAt,
  years,
  calendar: { ...calendar.contributionCalendar, restrictedContributionsCount: calendar.restrictedContributionsCount },
});

for (let year = 2012; year <= new Date().getUTCFullYear(); year++) {
  if (years.some((y) => y.year === year)) continue;
  const from = `${year}-01-01T00:00:00Z`;
  const to = year === new Date().getUTCFullYear() ? collectedAt : `${year}-12-31T23:59:59Z`;
  const c = gql(`query { user(login:"konard") { contributionsCollection(from:"${from}",to:"${to}") {
    contributionCalendar { totalContributions } totalCommitContributions totalIssueContributions
    totalPullRequestContributions totalPullRequestReviewContributions totalRepositoryContributions
  } } }`).contributionsCollection;
  years.push({
    year,
    total: c.contributionCalendar.totalContributions,
    commits: c.totalCommitContributions,
    issues: c.totalIssueContributions,
    pullRequests: c.totalPullRequestContributions,
    reviews: c.totalPullRequestReviewContributions,
    repositories: c.totalRepositoryContributions,
  });
  if (year < new Date(collectedAt).getUTCFullYear()) discover(from, to);
  else {
    // Recent contributions are also available without the per-calendar cap.
    let cursor = null;
    do {
      const conn = gql(
        `query { user(login:"konard") { repositoriesContributedTo(first:100,privacy:PUBLIC,contributionTypes:[COMMIT,PULL_REQUEST]${cursor ? `,after:"${cursor}"` : ''}) { pageInfo { hasNextPage endCursor } nodes { nameWithOwner isPrivate visibility } } } }`,
      ).repositoriesContributedTo;
      for (const r of conn.nodes) if (!r.isPrivate && r.visibility === 'PUBLIC') repositories.add(r.nameWithOwner);
      cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (cursor);
  }
  checkpoint();
  console.log(
    `${year}: ${c.contributionCalendar.totalContributions} contributions; ${repositories.size} public repositories discovered`,
  );
}
// Pull requests also cover proposed contributions not yet on a default branch.
let after = progress.after;
do {
  const c = gql(`query { user(login:"konard") { pullRequests(first:100${after ? `,after:"${after}"` : ''}) {
    pageInfo { endCursor hasNextPage } nodes { repository { ${fields} } }
  } } }`).pullRequests;
  for (const node of c.nodes) {
    const r = node?.repository;
    if (r && !r.isPrivate && r.visibility === 'PUBLIC') repositories.add(r.nameWithOwner);
  }
  after = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  checkpoint(after);
  console.log(`Pull request discovery: ${repositories.size} public repositories; ${after ? 'next page' : 'complete'}`);
} while (after);
write('contributions.json', {
  collectedAt,
  years,
  calendar: { ...calendar.contributionCalendar, restrictedContributionsCount: calendar.restrictedContributionsCount },
});
write('contributed-repositories.json', {
  collectedAt,
  repositories: [...repositories].sort(),
  discovery:
    'Historical contribution years recursively split below the 100-repository cap; paginated recent contributed repositories and every public pull request. Default branches only for surviving lines.',
});
fs.unlinkSync(progressFile);
console.log(`Saved calendar and ${repositories.size} public contribution repositories.`);
