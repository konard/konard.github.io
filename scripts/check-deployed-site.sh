#!/usr/bin/env bash
# Verify the deployed commit, app assets and actual PDF bytes, with bounded CDN retries.
# Usage: scripts/check-deployed-site.sh <url> [attempts] [delay-seconds]
set -euo pipefail

URL="${1:?usage: $0 <url> [attempts] [delay-seconds]}"
ATTEMPTS="${2:-6}"
DELAY="${3:-10}"
BASE="${URL%/}"
EXPECTED_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
CV_PDF=/cv/pdf/konstantin-diachenko-all-classic-en.pdf
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fetch() { curl --connect-timeout 10 --max-time 30 -fsSL "$1"; }
for attempt in $(seq 1 "$ATTEMPTS"); do
  if fetch "${BASE}/?v=${EXPECTED_SHA}" > "$work/index.html" &&
    fetch "${BASE}/build-info.json?v=${EXPECTED_SHA}" > "$work/info.json" &&
    node --input-type=commonjs -e 'const fs=require("node:fs"); if(JSON.parse(fs.readFileSync(process.argv[1])).sha!==process.argv[2]) process.exit(1)' "$work/info.json" "$EXPECTED_SHA"; then
    script=$(sed -n 's/.*src="\(\/assets\/index-[^"]*\.js\)".*/\1/p' "$work/index.html" | head -n 1)
    if grep -q '<div id="root"></div>' "$work/index.html" && [ -n "$script" ] &&
      fetch "${BASE}${script}" > "$work/app.js" && [ -s "$work/app.js" ] &&
      ! grep -qiE '<!doctype|<html' "$work/app.js" &&
      fetch "${BASE}${CV_PDF}" > "$work/cv.pdf" &&
      [ "$(head -c 5 "$work/cv.pdf")" = '%PDF-' ]; then
      echo "$URL serves commit $EXPECTED_SHA, loads $script and the CV $CV_PDF."
      exit 0
    fi
  fi
  echo "Attempt $attempt/$ATTEMPTS: $URL does not serve the expected build yet."
  if [ "$attempt" -lt "$ATTEMPTS" ]; then sleep "$DELAY"; fi
done

echo "::error::$URL does not serve commit $EXPECTED_SHA with valid app and PDF assets."
exit 1
