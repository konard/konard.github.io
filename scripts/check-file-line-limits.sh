#!/usr/bin/env bash
# Keep the 1500-line source limit aligned with ESLint; warn above 1350.
# Historical docs/case-studies and dev/log evidence retain original formatting.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"
LIMIT=1500
WARN_THRESHOLD=1350
CHECKED=0
FAILED=0
files=$(mktemp)
trap 'rm -f "$files"' EXIT
# Materialize the list: process-substitution failures must not become a green walk.
git ls-files -z > "$files"
while IFS= read -r -d '' file; do
  case "$file" in docs/case-studies/*|dev/log/*) continue ;; esac
  case "$file" in *.js|*.jsx|*.cjs|*.mjs|*.css|*.md|*.yml|*.yaml|*.sh|*.py|*.html|*.toml) ;; *) continue ;; esac
  [ -f "$file" ] || continue
  # awk counts a final unterminated line too, unlike wc -l.
  lines=$(awk 'END { print NR }' "$file")
  CHECKED=$((CHECKED + 1))
  if [ "$lines" -gt "$LIMIT" ]; then
    echo "::error file=$file::$file has $lines lines (limit $LIMIT)"
    FAILED=1
  elif [ "$lines" -gt "$WARN_THRESHOLD" ]; then
    echo "::warning file=$file::$file has $lines lines (warning threshold $WARN_THRESHOLD, limit $LIMIT); extract a module."
  fi
done < "$files"
if [ "$CHECKED" -eq 0 ]; then
  echo '::error::No files were checked; the file size gate is broken.'
  exit 2
fi
echo "Checked $CHECKED files against the $LIMIT-line limit."
exit "$FAILED"
