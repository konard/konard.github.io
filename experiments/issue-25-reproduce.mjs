// Run the issue regressions against the prepared branch's original source,
// restoring current edits even when the expected failing test run returns 1.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const files = execFileSync('git', ['diff', 'a80408d', '--name-only', '--diff-filter=M', '--', 'src/'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter((p) => p.startsWith('src/'));
const edited = files.map((path) => [path, readFileSync(path)]);
try {
  for (const [path] of edited) writeFileSync(path, execFileSync('git', ['show', `a80408d:${path}`]));
  const result = spawnSync(
    'npx',
    ['vitest', 'run', 'src/links/issue-25.test.js', 'src/pages/network-25.test.jsx', '--maxWorkers=1'],
    { encoding: 'utf8' },
  );
  writeFileSync('docs/case-studies/issue-25/logs/reproduce-tests.log', result.stdout + result.stderr);
  console.log(`Original-source regression exit: ${result.status} (expected 1)`);
  if (result.status !== 1) process.exitCode = 1;
} finally {
  for (const [path, content] of edited) writeFileSync(path, content);
}
