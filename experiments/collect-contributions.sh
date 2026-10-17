#!/usr/bin/env bash
# Collects yearly public contribution totals for konard via GitHub GraphQL API.
set -euo pipefail
OUT="${1:-docs/case-studies/issue-1/data}/github-contributions.json"
echo "[" > "$OUT"
first=1
for y in $(seq 2012 2026); do
  r=$(gh api graphql -f query="query{user(login:\"konard\"){contributionsCollection(from:\"${y}-01-01T00:00:00Z\",to:\"${y}-12-31T23:59:59Z\"){contributionCalendar{totalContributions} totalCommitContributions totalIssueContributions totalPullRequestContributions totalPullRequestReviewContributions totalRepositoryContributions}}}" --jq ".data.user.contributionsCollection | {year: $y, total: .contributionCalendar.totalContributions, commits: .totalCommitContributions, issues: .totalIssueContributions, pullRequests: .totalPullRequestContributions, reviews: .totalPullRequestReviewContributions, repositories: .totalRepositoryContributions}")
  [ $first -eq 1 ] || echo "," >> "$OUT"; first=0
  echo "  $r" >> "$OUT"
done
echo "]" >> "$OUT"
cat "$OUT"
