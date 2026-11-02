import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as yaml from 'js-yaml';

// `superseded` holds the jobs a newer commit explains (see supersededJobs): their
// cancellation, or the skip it caused, is a warning, not a failure.
export function pipelineFailures(needs, allowedSkips, expectedJobs, log = console.log, superseded = new Set()) {
  if (!needs || typeof needs !== 'object' || Array.isArray(needs)) throw new Error('Missing job results');
  const allowed = new Set(allowedSkips);
  const failures = [];
  for (const name of expectedJobs) {
    const result = needs[name]?.result;
    if (result === 'success') continue;
    if (result === 'skipped' && allowed.has(name)) {
      log(`::notice::${name} skipped by its documented event/change condition.`);
      continue;
    }
    if ((result === 'cancelled' || result === 'skipped') && superseded.has(name)) {
      log(`::warning::${name} ${result}: a newer commit superseded this run.`);
      continue;
    }
    failures.push(`${name}: ${result || 'missing result'}`);
  }
  for (const name of Object.keys(needs)) if (!expectedJobs.includes(name)) failures.push(`${name}: unexpected job`);
  return failures;
}

// A newer push to the same pull request or branch starts a run whose jobs share the
// concurrency groups of this one, and cancel-in-progress cancels the older jobs. Run
// 41493732556 then failed with "test: skipped; network-browsers: cancelled" on a
// commit nobody was waiting for (issue #51). Only those cancellations are explained:
// a job without cancel-in-progress: true, or a cancellation while this run is still
// the head (a timeout), still fails, and so does a skip that no such job caused.
export function supersededJobs(needs, jobs) {
  const explained = new Set(
    Object.keys(needs).filter(
      (name) => needs[name]?.result === 'cancelled' && jobs[name]?.concurrency?.['cancel-in-progress'] === true,
    ),
  );
  for (let grew = true; grew;) {
    grew = false;
    for (const name of Object.keys(needs)) {
      if (explained.has(name) || needs[name]?.result !== 'skipped') continue;
      if ([jobs[name]?.needs ?? []].flat().some((dependency) => explained.has(dependency))) {
        explained.add(name);
        grew = true;
      }
    }
  }
  return explained;
}

// The current head of the ref this run tests, or null when it cannot be read, in
// which case the run counts as current and every cancellation fails.
export function headSha(ref, run = execFileSync) {
  if (!ref) return null;
  try {
    const line = run('git', ['ls-remote', 'origin', ref], { encoding: 'utf8', timeout: 30000 }).split('\n')[0];
    return /^[0-9a-f]{40}\t/.test(line) ? line.slice(0, 40) : null;
  } catch {
    return null;
  }
}

function main() {
  const workflow = yaml.load(readFileSync('.github/workflows/github-pages.yml', 'utf8'));
  const expected = Object.keys(workflow.jobs).filter((name) => name !== 'pipeline-status');
  const needs = JSON.parse(process.env.NEEDS_JSON || 'null');
  const allowed = [];
  if (process.env.CODE_CHANGED === 'false') allowed.push('network-browsers', 'test');
  if (process.env.DOCS_CHANGED === 'false') allowed.push('docs');
  if (process.env.SHOULD_DEPLOY !== 'true') allowed.push('deploy');
  const head =
    needs && Object.values(needs).some((job) => job?.result === 'cancelled') && headSha(process.env.HEAD_REF);
  const superseded = Boolean(head && process.env.RUN_SHA && head !== process.env.RUN_SHA);
  if (head) console.log(`This run tests ${process.env.RUN_SHA}; ${process.env.HEAD_REF} is at ${head}.`);
  const excused = superseded ? supersededJobs(needs, workflow.jobs) : new Set();
  const failures = pipelineFailures(needs, allowed, expected, console.log, excused);
  if (failures.length) throw new Error(`Pipeline failed: ${failures.join('; ')}`);
  console.log(
    excused.size
      ? `No job failed; the run for ${head} checks what this one could not finish.`
      : 'All required jobs succeeded; every deliberate skip is listed above.',
  );
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    main();
  } catch (error) {
    console.log(`::error::${error.message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')}`);
    process.exitCode = 1;
  }
}
