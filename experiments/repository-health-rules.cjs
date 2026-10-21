#!/usr/bin/env node
// Prints which repositories the empty / broken-fork / hidden rules of
// scripts/repositories.cjs would exclude, to review the rules by hand.
// Usage: node experiments/repository-health-rules.cjs
const { excludedBecause, readCollected, readHealth } = require('../scripts/repositories.cjs');

const health = readHealth();
const groups = {};
for (const repo of readCollected()) {
  const reason = excludedBecause(repo, health[repo.fullName]);
  if (reason) (groups[reason] ||= []).push(repo.fullName);
}
for (const [reason, names] of Object.entries(groups))
  console.log(`${reason} (${names.length}):\n  ${names.join('\n  ')}`);
