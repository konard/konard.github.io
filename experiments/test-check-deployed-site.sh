#!/usr/bin/env bash
# Positive and negative deployment cases run against a temporary HTTP server.
set -euo pipefail
cd "$(dirname "$0")/.."
npx vitest run src/deployment.test.js --maxWorkers=1
