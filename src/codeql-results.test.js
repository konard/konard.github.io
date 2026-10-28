import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkCodeQLResults } from '../scripts/check-codeql-results.mjs';

let directory;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'issue31-sarif-'));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
const run = (results = []) => ({ tool: { driver: { name: 'CodeQL' } }, results });
const save = (runs, file = 'javascript.sarif') =>
  writeFileSync(join(directory, file), JSON.stringify({ version: '2.1.0', runs }));

test('clean reports pass, including every language and run', () => {
  save([run(), run()]);
  save([run()], 'python.sarif');
  save([run()], 'actions.sarif');
  expect(checkCodeQLResults(directory)).toBe(3);
});

test.each(['error', 'warning', 'note'])('a %s finding fails even after successful execution', (level) => {
  save([run(), { ...run([{ ruleId: 'js/redos', level }]), invocations: [{ executionSuccessful: true }] }]);
  expect(() => checkCodeQLResults(directory)).toThrow(/js\/redos/);
});

test('a finding hidden by an in-source suppression is still a finding', () => {
  save([run([{ ruleId: 'js/redos', suppressions: [{ kind: 'inSource', status: 'accepted' }] }])]);
  expect(() => checkCodeQLResults(directory)).toThrow(/unresolved finding/);
});

test('missing reports cannot silently pass', () => {
  expect(() => checkCodeQLResults()).toThrow(/Missing/);
  expect(() => checkCodeQLResults(directory)).toThrow(/No CodeQL SARIF/);
});

test.each([[], [{}], [{ tool: { driver: { name: 'CodeQL' } } }]])('incomplete runs fail: %j', (runs) => {
  save(runs);
  expect(() => checkCodeQLResults(directory)).toThrow();
});

test('malformed JSON and unsupported formats fail', () => {
  writeFileSync(join(directory, 'bad.sarif'), '{');
  expect(() => checkCodeQLResults(directory)).toThrow();
  writeFileSync(join(directory, 'bad.sarif'), JSON.stringify({ version: '1.0.0', runs: [run()] }));
  expect(() => checkCodeQLResults(directory)).toThrow(/Invalid/);
});

test('an unsuccessful tool invocation cannot pass with empty results', () => {
  save([{ ...run(), invocations: [{ executionSuccessful: false }] }]);
  expect(() => checkCodeQLResults(directory)).toThrow(/execution failed/);
});

test('the workflow command exits unsuccessfully for findings', () => {
  save([run([{ ruleId: 'js/redos' }])]);
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-codeql-results.mjs', directory], { stdio: 'pipe' }),
  ).toThrow();
  save([run()]);
  expect(
    execFileSync(process.execPath, ['scripts/check-codeql-results.mjs', directory], { encoding: 'utf8' }),
  ).toContain('no findings');
});
