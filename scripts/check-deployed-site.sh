#!/usr/bin/env bash
# Fails unless the given URL serves the built app: the Vite index.html with
# the React root and a /assets/index-*.js script that loads. Retries while the
# GitHub Pages CDN picks up a new deployment.
# Usage: scripts/check-deployed-site.sh <url> [attempts] [delay-seconds]
set -euo pipefail

URL="${1:?usage: $0 <url> [attempts] [delay-seconds]}"
ATTEMPTS="${2:-6}"
DELAY="${3:-10}"
BASE="${URL%/}"

for attempt in $(seq 1 "$ATTEMPTS"); do
  # The query string bypasses a cached copy of the previous deployment.
  html=$(curl -fsSL "${BASE}/?v=${GITHUB_SHA:-$(date +%s)}" || true)
  script=$(grep -o 'src="/assets/index-[^"]*\.js"' <<<"$html" | head -n 1 | cut -d'"' -f2 || true)
  if grep -q '<div id="root"></div>' <<<"$html" && [ -n "$script" ] &&
    curl -fsS -o /dev/null "${BASE}${script}"; then
    echo "$URL serves the app and loads $script."
    exit 0
  fi
  echo "Attempt $attempt/$ATTEMPTS: $URL does not serve the app yet."
  [ "$attempt" -lt "$ATTEMPTS" ] && sleep "$DELAY"
done

echo "::error::$URL does not serve the built app."
exit 1
