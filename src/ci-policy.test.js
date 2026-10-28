import { classifyChanges } from '../scripts/ci-changes.mjs';
import { pipelineFailures } from '../scripts/check-pipeline-status.mjs';
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
test.each(['failure', 'cancelled', 'timed_out', 'skipped', 'unknown', undefined])(
  'required result %s fails closed',
  (result) => {
    expect(pipelineFailures({ tests: { result } }, [], ['tests'])).toHaveLength(1);
  },
);
test('only explicitly allowed skips pass, never failures or missing results', () => {
  expect(
    pipelineFailures({ test: { result: 'success' }, deploy: { result: 'skipped' } }, ['deploy'], ['test', 'deploy']),
  ).toEqual([]);
  expect(pipelineFailures({ deploy: { result: 'failure' } }, ['deploy'], ['deploy'])).toHaveLength(1);
  expect(pipelineFailures({}, ['deploy'], ['deploy'])).toHaveLength(1);
  expect(pipelineFailures({}, [], ['new-job'])).toHaveLength(1);
  expect(() => pipelineFailures(null, [], [])).toThrow();
});
test('Pages preflight requires a real Actions site', () => {
  expect(pagesReady({ build_type: 'workflow', html_url: 'https://example.test' })).toBe(true);
  for (const data of [null, {}, { build_type: 'legacy', html_url: 'https://example.test' }, { build_type: 'workflow' }])
    expect(pagesReady(data)).toBe(false);
});
