// Deliberately anonymous: authenticated self-profile responses include private settings.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const fields = new Set(
  `login id node_id avatar_url gravatar_id url html_url followers_url following_url
  gists_url starred_url subscriptions_url organizations_url repos_url events_url
  received_events_url type user_view_type site_admin name company blog location
  email hireable bio twitter_username public_repos public_gists followers following
  created_at updated_at`.split(/\s+/),
);

export async function collectPublicProfile(fetcher = fetch) {
  const response = await fetcher('https://api.github.com/users/konard', {
    credentials: 'omit',
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Public GitHub profile returned ${response.status}`);
  const profile = await response.json();
  if (profile.login !== 'konard' || profile.user_view_type !== 'public') {
    throw new Error('Expected an anonymous public profile');
  }
  return Object.fromEntries(Object.entries(profile).filter(([key]) => fields.has(key)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[2] || 'docs/case-studies/issue-33/data/github-user.json';
  await writeFile(output, JSON.stringify(await collectPublicProfile(), null, 2) + '\n');
  console.log('Saved anonymous public GitHub profile.');
}
