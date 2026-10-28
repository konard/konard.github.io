// Reproduce npm's macOS-only advisory on Linux without loading a native binary.
// Uses just the locked registry package; npm --os selects its install platform.
// First populate the cache with: npm cache add fsevents@2.3.3
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const dependency = { ...lock.packages['node_modules/fsevents'] };
delete dependency.dev;
const dir = mkdtempSync(join(tmpdir(), 'issue31-fsevents-'));
try {
  const fixture = {
    name: 'issue31-install-script-probe',
    version: '1.0.0',
    private: true,
    optionalDependencies: { fsevents: dependency.version },
  };
  writeFileSync(
    join(dir, 'package-lock.json'),
    JSON.stringify({
      name: fixture.name,
      version: fixture.version,
      lockfileVersion: 3,
      packages: { '': fixture, 'node_modules/fsevents': dependency },
    }),
  );
  for (const reviewed of [false, true]) {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ ...fixture, ...(reviewed ? { allowScripts: manifest.allowScripts } : {}) }),
    );
    const result = spawnSync('npm', ['ci', '--os=darwin', '--offline', '--no-audit', '--no-fund'], {
      cwd: dir,
      encoding: 'utf8',
    });
    const output = result.stdout + result.stderr;
    console.log(`Policy: ${reviewed ? 'repository review' : 'unreviewed baseline'}\n${output}`);
    assert.equal(result.status, 0, output);
    assert.equal(/npm warn install-scripts/.test(output), !reviewed);
  }
  console.log('PASS: the actual npm install warns before review and is clean with repository policy.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
