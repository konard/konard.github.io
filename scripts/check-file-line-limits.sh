#!/usr/bin/env bash
# Fails when a tracked source, style, markdown or workflow file exceeds
# 1500 lines, and warns above 1350 lines. Collected data (docs/ case
# studies, dev/log), lock files and generated JSON are not checked.
# Adapted from link-foundation/js-ai-driven-development-pipeline-template.
set -euo pipefail

LIMIT=1500
WARN_THRESHOLD=1350
CHECKED=0
FAILED=0

while IFS= read -r file; do
  [ -f "$file" ] || continue
  lines=$(wc -l < "$file")
  CHECKED=$((CHECKED + 1))
  if [ "$lines" -gt "$LIMIT" ]; then
    echo "::error file=$file::$file has $lines lines (limit $LIMIT)"
    FAILED=1
  elif [ "$lines" -gt "$WARN_THRESHOLD" ]; then
    echo "::warning file=$file::$file has $lines lines (warning threshold $WARN_THRESHOLD, limit $LIMIT)"
  fi
done < <(git ls-files -- '*.js' '*.jsx' '*.cjs' '*.mjs' '*.css' '*.md' '*.yml' '*.yaml' '*.sh' \
  ':!:docs/**' ':!:dev/**')

if [ "$CHECKED" -eq 0 ]; then
  echo "::error::No files were checked; the file size gate is broken."
  exit 2
fi
echo "Checked $CHECKED files against the $LIMIT-line limit."
exit "$FAILED"
