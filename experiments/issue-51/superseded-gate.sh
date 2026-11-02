#!/usr/bin/env bash
# Replays the gate of run 41493732556 (commit 0468e61 on PR #52), whose webkit job a
# newer push cancelled, against the real pull request head. Before the fix it failed
# with "test: skipped; network-browsers: cancelled"; now it warns. With RUN_SHA set to
# the current head the same results must still fail.
set -u
needs='{"prepare":{"result":"success"},"lint-workflows":{"result":"success"},"checks":{"result":"success"},"tooling":{"result":"success"},"docs":{"result":"success"},"codeql":{"result":"success"},"network-browsers":{"result":"cancelled"},"test":{"result":"skipped"},"deploy":{"result":"skipped"}}'
gate() { NEEDS_JSON="$needs" CODE_CHANGED=true DOCS_CHANGED=true SHOULD_DEPLOY=false HEAD_REF=refs/pull/52/head RUN_SHA="$1" node scripts/check-pipeline-status.mjs; echo "exit $?"; }
echo '--- superseded commit 0468e61'
gate 0468e61f4ae131a1c1b04ba55c6f5f64c621215b
echo '--- current head'
gate "$(git ls-remote origin refs/pull/52/head | cut -f1)"
