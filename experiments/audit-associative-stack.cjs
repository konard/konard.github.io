// Compare every currently collected personal/organization repository to the
// Formal AI guide. Candidates are an audit inventory, not automatic claims
// that every experimental repository belongs in that project's runtime stack.
const fs = require('node:fs');
const dir = 'docs/case-studies/issue-33/data/';
const repos = JSON.parse(fs.readFileSync(dir + 'public-inventory.json', 'utf8')).repositories;
const guide = fs.readFileSync(dir + 'formal-ai-associative-tech-stack.md', 'utf8').toLowerCase();
const { fieldsOf } = require('../scripts/repositories.cjs');
const inventory = repos.map((r) => ({
  fullName: r.fullName,
  fork: r.fork,
  generatedNoise: r.generatedNoise,
  associative: fieldsOf(r).includes('associative'),
  mentioned: guide.includes(r.fullName.toLowerCase()) || guide.includes('`' + r.name.toLowerCase() + '`'),
}));
fs.writeFileSync(
  dir + 'associative-audit.json',
  JSON.stringify(
    {
      collectedAt: new Date().toISOString(),
      source: 'https://github.com/link-assistant/formal-ai/blob/main/docs/associative-tech-stack.md',
      inventory,
      runtimeOmissions: ['link-foundation/command-stream', 'link-assistant/web-capture', 'link-assistant/web-search'],
      report: 'https://github.com/link-assistant/formal-ai/issues/1455',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Audited ${inventory.length} repositories; ${inventory.filter((r) => r.associative).length} associative candidates.`,
);
