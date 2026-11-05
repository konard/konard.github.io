// Snapshot only distributable files until upstream publishes its workspaces.
// SOURCE=/path/to/link-foundation/ui node experiments/framework-migration/vendor.mjs
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const source = process.env.SOURCE || '/tmp/issue54-ui';
const directory = resolve('vendor/link-ui');
await mkdir(directory, { recursive: true });
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
const packages = [
  'core',
  'store',
  'config',
  'tokens',
  'style',
  'dom',
  'react',
  'settings',
  'components',
  'themes',
  'i18n',
  'animation',
  'sound',
  'convert',
  'devmode',
];
const manifest = { repository: 'https://github.com/link-foundation/ui', revision, packages: [] };
for (const suffix of packages) {
  const cwd = resolve(source, `packages/ui-${suffix}`);
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    }),
  );
  const bytes = await readFile(resolve(directory, packed.filename));
  manifest.packages.push({
    name: packed.name,
    version: packed.version,
    file: packed.filename,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    source: `https://github.com/link-foundation/ui/tree/${revision}/packages/ui-${suffix}`,
  });
  console.log(packed.filename, bytes.length);
}
await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
