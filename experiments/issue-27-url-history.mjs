// Audit every revision that changed the URL style schema. Archived metadata
// becomes a stable fixture; runtime tests never depend on Git/network access.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
const revisions = execFileSync(
  'git',
  ['log', '--format=%H', '406a2b4', '--', 'src/links/style.js', 'src/links/style-geometry.js'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n');
const server = await createServer({ server: { middlewareMode: true } });
const data = [];
try {
  const current = await server.ssrLoadModule('/src/links/style.js');
  const keys = new Set(current.STYLE_FIELDS.map((field) => field.key));
  for (const sha of revisions) {
    const dir = `experiments/out/issue-27-history/${sha}`;
    await mkdir(dir, { recursive: true });
    const archive = execFileSync('git', ['archive', sha, 'src'], { maxBuffer: 16 * 1024 * 1024 });
    execFileSync('tar', ['-x', '-C', dir], { input: archive });
    const legacy = await server.ssrLoadModule(`/${dir}/src/links/style.js`);
    const fields = legacy.STYLE_FIELDS.map(({ key, type, d, min, max, options }) => ({
      key,
      type,
      d,
      min,
      max,
      options: options?.map((option) => option.value),
    }));
    for (const field of fields) {
      assert(keys.has(field.key), `Removed historical URL key: ${sha} ${field.key}`);
      const now = current.STYLE_FIELDS.find(({ key }) => key === field.key);
      if (field.type === 'range') {
        assert(now.min <= field.min && now.max >= field.max, `Narrowed historical range: ${sha} ${field.key}`);
      }
      if (field.type === 'select')
        for (const value of field.options)
          assert(
            now.options.some((item) => item.value === value),
            `Removed historical enum: ${sha} ${field.key}=${value}`,
          );
    }
    data.push({ sha, fields });
  }
  await writeFile('docs/case-studies/issue-27/data/url-schema-history.json', JSON.stringify(data, null, 2));
  console.log(`All ${data.length} historical schemas retain all keys, valid numeric ranges and enum values.`);
} finally {
  await server.close();
  await rm('experiments/out/issue-27-history', { recursive: true, force: true });
}
