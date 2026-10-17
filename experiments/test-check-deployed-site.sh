#!/usr/bin/env bash
# Exercises scripts/check-deployed-site.sh against a served build (must pass)
# and against a folder with only docs/case-studies, which is what
# https://konard.github.io served in issue #5 (must fail).
set -uo pipefail
cd "$(dirname "$0")/.."
npm run build >/dev/null
python3 -m http.server 4801 --directory build >/dev/null 2>&1 &
good=$!
python3 -m http.server 4802 --directory docs >/dev/null 2>&1 &
bad=$!
trap 'kill $good $bad' EXIT
sleep 1
status=0
bash scripts/check-deployed-site.sh http://localhost:4801/ 1 0 && echo "PASS: build is accepted" || { echo "FAIL: build was rejected"; status=1; }
if bash scripts/check-deployed-site.sh http://localhost:4802/ 2 0; then echo "FAIL: docs-only site was accepted"; status=1; else echo "PASS: docs-only site is rejected"; fi
exit $status
