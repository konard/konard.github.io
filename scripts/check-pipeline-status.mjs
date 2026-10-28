import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as yaml from 'js-yaml';

export function pipelineFailures(needs, allowedSkips, expectedJobs) {
  if (!needs || typeof needs !== 'object' || Array.isArray(needs)) throw new Error('Missing job results');
  const allowed = new Set(allowedSkips);
  const failures = [];
  for (const name of expectedJobs) {
    const result = needs[name]?.result;
    if (result === 'success') continue;
    if (result === 'skipped' && allowed.has(name)) {
      console.log(`::notice::${name} skipped by its documented event/change condition.`);
      continue;
    }
    failures.push(`${name}: ${result || 'missing result'}`);
  }
  for (const name of Object.keys(needs)) if (!expectedJobs.includes(name)) failures.push(`${name}: unexpected job`);
  return failures;
}

function main() {
  const workflow = yaml.load(readFileSync('.github/workflows/github-pages.yml', 'utf8'));
  const expected = Object.keys(workflow.jobs).filter((name) => name !== 'pipeline-status');
  const needs = JSON.parse(process.env.NEEDS_JSON || 'null');
  const allowed = [];
  if (process.env.CODE_CHANGED === 'false') allowed.push('network-browsers', 'test');
  if (process.env.DOCS_CHANGED === 'false') allowed.push('docs');
  if (process.env.SHOULD_DEPLOY !== 'true') allowed.push('deploy');
  const failures = pipelineFailures(needs, allowed, expected);
  if (failures.length) throw new Error(`Pipeline failed: ${failures.join('; ')}`);
  console.log('All required jobs succeeded; every deliberate skip is listed above.');
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
