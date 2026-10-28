// Public Stack Exchange API snapshot; retain provenance and collection time.
import fs from 'node:fs/promises';
const base = 'https://api.stackexchange.com/2.3/users/710069';
async function get(suffix = '') {
  const response = await fetch(`${base}${suffix}?site=stackoverflow&pagesize=100`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Stack Exchange returned ${response.status}`);
  const body = await response.json();
  if (body.has_more) throw new Error('Pagination required');
  return body.items;
}
const user = (await get())[0];
const top_tags = await get('/top-tags');
if (!user || !top_tags.length) throw new Error('Incomplete Stack Overflow snapshot');
await fs.writeFile(
  'docs/case-studies/issue-33/data/stackoverflow-user.json',
  JSON.stringify(
    {
      source: `${base}?site=stackoverflow`,
      fetched: new Date().toISOString(),
      user,
      top_tags,
    },
    null,
    2,
  ) + '\n',
);
console.log('Saved Stack Overflow user and top tags.');
