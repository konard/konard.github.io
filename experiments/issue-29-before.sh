#!/usr/bin/env bash
# Rebuild the original source without changing the working branch or fixed build.
set -euo pipefail
repo=$(git rev-parse --show-toplevel)
snapshot=$(mktemp -d /tmp/issue-29-before.XXXXXX)
evidence="$repo/docs/case-studies/issue-29"
git archive d0c2849 -- src public package.json vite.config.js index.html \
  repositories experience research associative art blog cv settings network | tar -x -C "$snapshot"
ln -s "$repo/node_modules" "$snapshot/node_modules"
mkdir -p "$snapshot/experiments"
cp "$repo/experiments/issue-29-baseline.mjs" "$repo/experiments/issue-29-measure.mjs" "$snapshot/experiments/"
(
  cd "$snapshot"
  npm run build > "$evidence/logs/baseline-rebuild.log" 2>&1
  PHASE=before node experiments/issue-29-measure.mjs > "$evidence/logs/baseline-measure.log" 2>&1
  node experiments/issue-29-baseline.mjs > "$evidence/logs/baseline-browser.log" 2>&1
)
cp "$snapshot/docs/case-studies/issue-29/screenshots/"*.png "$evidence/screenshots/"
cp "$snapshot/docs/case-studies/issue-29/data/measure-before.json" "$evidence/data/"
printf 'Captured original source d0c2849 from %s\n' "$snapshot"
