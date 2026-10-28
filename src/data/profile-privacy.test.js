import fs from 'node:fs';
import { collectPublicProfile } from '../../experiments/collect-public-profile.mjs';

it('preserves public profile fields without authenticated account settings', () => {
  const profile = JSON.parse(fs.readFileSync('docs/case-studies/issue-33/data/github-user.json', 'utf8'));
  const privateFields = [
    'collaborators',
    'disk_usage',
    'owned_private_repos',
    'plan',
    'private_gists',
    'total_private_repos',
    'two_factor_authentication',
  ];
  expect(privateFields.filter((field) => Object.hasOwn(profile, field))).toEqual([]);
  expect(profile.login).toBe('konard');
  expect(profile.user_view_type).toBe('public');
});

it('requests the profile anonymously and drops fields outside the public schema', async () => {
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ login: 'konard', user_view_type: 'public', followers: 376, private_gists: 7, plan: {} }),
  });
  expect(await collectPublicProfile(fetcher)).toEqual({ login: 'konard', user_view_type: 'public', followers: 376 });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('https://api.github.com/users/konard');
  expect(options.credentials).toBe('omit');
  expect(options.headers).toEqual({ Accept: 'application/vnd.github+json' });
});

it('rejects authenticated self-profile responses instead of publishing their values', async () => {
  await expect(
    collectPublicProfile(async () => ({
      ok: true,
      json: async () => ({ login: 'konard', user_view_type: 'private', email: 'unpublished@example.invalid' }),
    })),
  ).rejects.toThrow('anonymous public profile');
});
