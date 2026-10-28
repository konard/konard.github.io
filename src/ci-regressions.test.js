import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

test('the complete Vite configuration dependency graph loads with native ESM', () => {
  expect(() =>
    execFileSync(process.execPath, ['--input-type=module', '-e', 'await import("./vite.config.js")'], {
      cwd: root,
      stdio: 'pipe',
    }),
  ).not.toThrow();
});

test('deployment verification rejects old assets and HTML pretending to be a PDF', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'issue31-deploy-'));
  try {
    const curl = path.join(dir, 'curl');
    writeFileSync(
      curl,
      '#!/bin/bash\ncase "$*" in\n *build-info.json*) echo \'{"sha":"old-sha"}\' ;;\n */cv/pdf/*) echo "<html>not a PDF</html>" ;;\n *assets/*) echo "/* old asset */" ;;\n *) echo \'<div id="root"></div><script src="/assets/index-old.js"></script>\' ;;\nesac\n',
      { mode: 0o755 },
    );
    let failed = false;
    try {
      execFileSync('bash', ['scripts/check-deployed-site.sh', 'https://example.test', '1', '0'], {
        cwd: root,
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_SHA: 'new-sha' },
        stdio: 'pipe',
      });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('line limits cover Python, spaces and unterminated final lines', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'issue31-lines-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    writeFileSync(path.join(dir, 'large file.py'), Array(1501).fill('pass').join('\n'));
    execFileSync('git', ['add', '.'], { cwd: dir });
    expect(() =>
      execFileSync('bash', [path.join(root, 'scripts/check-file-line-limits.sh')], { cwd: dir, stdio: 'pipe' }),
    ).toThrow();
    writeFileSync(path.join(dir, 'large file.py'), 'pass');
    expect(
      execFileSync('bash', [path.join(root, 'scripts/check-file-line-limits.sh')], { cwd: dir, encoding: 'utf8' }),
    ).toContain('Checked 1 files');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
