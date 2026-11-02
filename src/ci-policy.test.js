import { classifyChanges, checksForEvent } from '../scripts/ci-changes.mjs';
import { pipelineFailures, supersededJobs, headSha } from '../scripts/check-pipeline-status.mjs';
import { pagesReady } from '../scripts/check-pages.mjs';

test.each([
  'src/App.jsx',
  'experiments/network-e2e.mjs',
  'experiments/make-entries.py',
  'package-lock.json',
  '.github/workflows/github-pages.yml',
  'scripts/check-pages.mjs',
  'public/icon.png',
  '.prettierignore',
])('runs application CI when %s changes', (file) => expect(classifyChanges([file]).code).toBe(true));
test.each(['README.md', 'docs/case-studies/issue-29/README.md', 'dev/log/issues/31/pulls/32/log.txt'])(
  'does not rerun browsers for evidence/prose only: %s',
  (file) => expect(classifyChanges([file]).code).toBe(false),
);
test('docs and manual runs request the right checks', () => {
  expect(classifyChanges(['README.md'])).toEqual({ code: false, docs: true });
  expect(classifyChanges(['index.html'])).toEqual({ code: true, docs: true });
  expect(classifyChanges([], true)).toEqual({ code: true, docs: true });
});
// Issue #51: the weekly run skipped the link check, so dead links went unnoticed.
test('the weekly schedule checks links but does not rebuild the site', () => {
  expect(checksForEvent('schedule', [], false)).toEqual({ code: false, docs: true });
  expect(checksForEvent('push', ['README.md'], true)).toEqual({ code: false, docs: true });
  expect(checksForEvent('push', [], false)).toEqual({ code: true, docs: true });
  expect(checksForEvent('workflow_dispatch', [], true)).toEqual({ code: true, docs: true });
  expect(checksForEvent('pull_request', ['src/App.jsx'], true)).toEqual({ code: true, docs: false });
});
test.each(['failure', 'cancelled', 'timed_out', 'skipped', 'unknown', undefined])(
  'required result %s fails closed',
  (result) => {
    expect(pipelineFailures({ tests: { result } }, [], ['tests'])).toHaveLength(1);
  },
);
test('only explicitly allowed skips pass, never failures or missing results', () => {
  const log = vi.fn();
  expect(
    pipelineFailures(
      { test: { result: 'success' }, deploy: { result: 'skipped' } },
      ['deploy'],
      ['test', 'deploy'],
      log,
    ),
  ).toEqual([]);
  expect(log).toHaveBeenCalledWith('::notice::deploy skipped by its documented event/change condition.');
  expect(pipelineFailures({ deploy: { result: 'failure' } }, ['deploy'], ['deploy'])).toHaveLength(1);
  expect(pipelineFailures({}, ['deploy'], ['deploy'])).toHaveLength(1);
  expect(pipelineFailures({}, [], ['new-job'])).toHaveLength(1);
  expect(() => pipelineFailures(null, [], [])).toThrow();
});
// Run 41493732556 (issue #51): a newer push cancelled network-browsers through its
// concurrency group, test was skipped because it needs it, and the gate failed a run
// that no longer mattered.
const jobs = {
  checks: { concurrency: { 'cancel-in-progress': true } },
  'network-browsers': { needs: ['checks'], concurrency: { 'cancel-in-progress': true } },
  test: { needs: ['checks', 'network-browsers'], concurrency: { 'cancel-in-progress': true } },
  deploy: { needs: ['test'], concurrency: { 'cancel-in-progress': false } },
};
const supersededRun = {
  checks: { result: 'success' },
  'network-browsers': { result: 'cancelled' },
  test: { result: 'skipped' },
  deploy: { result: 'skipped' },
};
test('a run superseded by a newer commit warns about the jobs that commit cancelled', () => {
  const excused = supersededJobs(supersededRun, jobs);
  expect([...excused].sort()).toEqual(['deploy', 'network-browsers', 'test']);
  const log = vi.fn();
  expect(pipelineFailures(supersededRun, [], Object.keys(jobs), log, excused)).toEqual([]);
  expect(log).toHaveBeenCalledWith('::warning::network-browsers cancelled: a newer commit superseded this run.');
  expect(log).toHaveBeenCalledWith('::warning::test skipped: a newer commit superseded this run.');
});
test('the same run fails while it is still the head', () => {
  expect(pipelineFailures(supersededRun, [], Object.keys(jobs), vi.fn())).toEqual([
    'network-browsers: cancelled',
    'test: skipped',
    'deploy: skipped',
  ]);
});
test('a superseded run still fails on failures and on cancellations no newer run explains', () => {
  const needs = {
    checks: { result: 'failure' },
    'network-browsers': { result: 'skipped' },
    test: { result: 'skipped' },
    deploy: { result: 'cancelled' },
  };
  const excused = supersededJobs(needs, jobs);
  expect(excused.size).toBe(0);
  expect(pipelineFailures(needs, [], Object.keys(jobs), vi.fn(), excused)).toEqual([
    'checks: failure',
    'network-browsers: skipped',
    'test: skipped',
    'deploy: cancelled',
  ]);
  expect(pipelineFailures({ checks: { result: 'timed_out' } }, [], ['checks'], vi.fn(), new Set(['checks']))).toEqual([
    'checks: timed_out',
  ]);
});
test('the head of the tested ref is read with git ls-remote and unknown when that fails', () => {
  const sha = 'a'.repeat(40);
  const run = vi.fn().mockReturnValue(`${sha}\trefs/pull/52/head\n`);
  expect(headSha('refs/pull/52/head', run)).toBe(sha);
  expect(run).toHaveBeenCalledWith('git', ['ls-remote', 'origin', 'refs/pull/52/head'], expect.any(Object));
  expect(headSha('refs/pull/52/head', () => '')).toBeNull();
  expect(
    headSha('refs/heads/main', () => {
      throw new Error('network');
    }),
  ).toBeNull();
  expect(headSha('', run)).toBeNull();
});
test('Pages preflight requires a real Actions site', () => {
  expect(pagesReady({ build_type: 'workflow', html_url: 'https://example.test' })).toBe(true);
  for (const data of [null, {}, { build_type: 'legacy', html_url: 'https://example.test' }, { build_type: 'workflow' }])
    expect(pagesReady(data)).toBe(false);
});
