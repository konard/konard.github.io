import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkCodeQLResults(directory) {
  if (!directory) throw new Error('Missing CodeQL SARIF directory');
  const files = readdirSync(directory).filter((file) => file.endsWith('.sarif'));
  if (!files.length) throw new Error('No CodeQL SARIF reports produced');
  const findings = [];
  for (const file of files) {
    const report = JSON.parse(readFileSync(join(directory, file), 'utf8'));
    if (report.version !== '2.1.0' || !Array.isArray(report.runs) || !report.runs.length)
      throw new Error(`Invalid CodeQL SARIF report: ${file}`);
    for (const run of report.runs) {
      if (run.tool?.driver?.name !== 'CodeQL' || !Array.isArray(run.results))
        throw new Error(`Missing CodeQL results in ${file}`);
      for (const result of run.results) {
        const location = result.locations?.[0]?.physicalLocation;
        findings.push(
          `${result.ruleId || 'unknown rule'} at ${location?.artifactLocation?.uri || file}:${location?.region?.startLine || 1}`,
        );
      }
      if (run.invocations?.some((invocation) => invocation.executionSuccessful === false))
        throw new Error(`CodeQL execution failed in ${file}`);
    }
  }
  if (findings.length)
    throw new Error(`CodeQL reported ${findings.length} unresolved finding(s):\n${findings.join('\n')}`);
  return files.length;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    console.log(`Checked ${checkCodeQLResults(process.argv[2])} CodeQL report(s): no findings.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
