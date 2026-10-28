import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
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

test('build identity also works from a source archive without Git metadata', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'issue31-no-git-'));
  try {
    writeFileSync(path.join(dir, 'git'), '#!/bin/sh\nexit 128\n', { mode: 0o755 });
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      const config = (await import('./vite.config.js')).default;
      config.plugins.find(p => p.name === 'build-identity').generateBundle.call({
        emitFile: asset => console.log(asset.source)
      });
    `,
      ],
      {
        cwd: root,
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_SHA: '' },
        stdio: 'pipe',
        encoding: 'utf8',
      },
    );
    expect(JSON.parse(output).sha).toBe('unversioned');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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

test('the commit hook applies repository lint rules to archived package examples', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'issue31-hooks-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    mkdirSync(path.join(dir, 'archive'));
    const eslintCommand = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))['lint-staged'][
      '*.{js,jsx,cjs,mjs}'
    ][0].replace(/^eslint\b/, `node ${path.join(root, 'node_modules/eslint/bin/eslint.js')}`);
    const config = (command) => JSON.stringify({ type: 'module', 'lint-staged': { '*.js': command } });
    writeFileSync(path.join(dir, 'package.json'), config(eslintCommand));
    writeFileSync(path.join(dir, 'eslint.config.js'), 'export default [{ignores:["archive/**"]}];\n');
    writeFileSync(path.join(dir, 'archive/package.json'), config('node -e "process.exit(17)"'));
    writeFileSync(path.join(dir, 'archive/eslint.config.js'), 'throw new Error("Archived config executed");\n');
    writeFileSync(path.join(dir, 'archive/probe.js'), '// historical example\n');
    execFileSync('git', ['add', '.'], { cwd: dir });
    const invocation = readFileSync(path.join(root, '.husky/pre-commit'), 'utf8')
      .split('\n')
      .find((line) => line.startsWith('npx lint-staged'));
    expect(invocation).toBeDefined();
    const args = invocation.slice('npx lint-staged'.length).trim().split(/\s+/).filter(Boolean);
    expect(() =>
      execFileSync(process.execPath, [path.join(root, 'node_modules/lint-staged/bin/lint-staged.js'), ...args], {
        cwd: dir,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
