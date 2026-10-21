#!/usr/bin/env node
// Prints which repositories the empty / broken-fork / hidden rules of
// scripts/repositories.cjs would exclude, to review the rules by hand.
// Usage: node experiments/repository-health-rules.cjs > docs/case-studies/issue-9/data/repository-health-rules.txt
const { excludedBecause, readCollected, readHealth } = require('../scripts/repositories.cjs');

const health = readHealth();
const groups = {};
for (const repo of readCollected()) {
  const reason = excludedBecause(repo, health[repo.fullName]);
  if (reason) (groups[reason] ||= []).push(repo.fullName);
}
// Copies of projects that are not public are only counted: nothing about them is published.
const PRIVATE = 'original is not public';
for (const [reason, names] of Object.entries(groups))
  console.log(
    reason === PRIVATE ? `${reason} (${names.length})` : `${reason} (${names.length}):\n  ${names.join('\n  ')}`,
  );
