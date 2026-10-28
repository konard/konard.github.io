import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function classifyChanges(files, force = false) {
  const code = force || files.some((file) => !/^(docs\/|dev\/)|\.md$|^\.gitkeep$/.test(file));
  return { code, docs: force || files.some((file) => /\.md$|\.html$|^docs\//.test(file)) };
}

function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const kind = process.env.GITHUB_EVENT_NAME;
  let base;
  if (kind === 'pull_request') {
    const branch = event.pull_request.base.ref;
    execFileSync('git', ['check-ref-format', '--branch', branch], { stdio: 'pipe' });
    execFileSync('git', ['fetch', '--no-tags', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], {
      stdio: 'inherit',
    });
    base = `refs/remotes/origin/${branch}`;
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', base, 'HEAD']);
    } catch {
      throw new Error(`The PR merge preview is behind ${branch}. Merge the latest base into the PR and rerun checks.`);
    }
  } else if (kind === 'push' && !/^0+$/.test(event.before || '0')) base = event.before;
  const files = base
    ? execFileSync('git', ['diff', '--name-only', '-z', base, 'HEAD'], { encoding: 'utf8' }).split('\0').filter(Boolean)
    : [];
  const result = classifyChanges(files, kind === 'workflow_dispatch' || (!base && kind !== 'schedule'));
  for (const [name, value] of Object.entries(result)) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  const report = `Changed files: ${files.length}; application checks: ${result.code}; documentation checks: ${result.docs}.`;
  console.log(report);
  if (!result.code)
    console.log(
      '::notice::Skipping browser/build/PDF jobs: no application, dependency, experiment or CI inputs changed.',
    );
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
