"""Reproduce the initial core migration, before supplemental jobs were added.

Writes only a scratch workflow, never the maintained production workflow.
"""

from pathlib import Path
import re
import subprocess

p = Path('/tmp/issue-31-core-workflow.yml')
s = subprocess.check_output(
    ['git', 'show', '2fa6fd5b3b5cfa9a2f953533762ae304a45bc21e:.github/workflows/github-pages.yml'], text=True
)
s = s.replace("    paths-ignore:\n      - 'docs/**'\n      - 'dev/**'\n", '')
s = s.replace('  workflow_dispatch:\n', "  workflow_dispatch:\n  schedule:\n    - cron: '0 6 * * 1'\n")
a = s.index('# Cancel superseded')
b = s.index('# actions/checkout', a)
s = s[:a] + s[b:]
s = s.replace('actions/checkout@v6', 'actions/checkout@v7').replace('actions/setup-node@v6', 'actions/setup-node@v7')
s = s.replace(
    'jobs:\n',
    """jobs:
  prepare:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    permissions:
      contents: read
      pages: read
    outputs:
      code: ${{ steps.changes.outputs.code }}
      docs: ${{ steps.changes.outputs.docs }}
    steps:
      - name: Checkout the merge result
        uses: actions/checkout@v7
        with:
          persist-credentials: false
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: '24.x'
      - name: Verify merge freshness and detect changes
        id: changes
        run: node scripts/ci-changes.mjs
      - name: Check GitHub Pages configuration before building
        run: node scripts/check-pages.mjs
        env:
          GH_TOKEN: ${{ github.token }}
          REQUIRE_PAGES: ${{ github.event_name != 'pull_request' && 'true' || 'false' }}

""",
    1,
)
s = s.replace('  checks:\n', '  checks:\n    needs: prepare\n')
s = s.replace('npm audit --audit-level=moderate', 'npm audit --package-lock-only --audit-level=moderate')
s = s.replace(
    'needs: [lint-workflows, checks, network-browsers]',
    "needs: [prepare, lint-workflows, checks, network-browsers]\n    if: needs.prepare.outputs.code == 'true'",
)
s = s.replace(
    'needs: [lint-workflows, checks]',
    "needs: [prepare, lint-workflows, checks]\n    if: needs.prepare.outputs.code == 'true'",
)
s = s.replace(
    """      - name: Upload the build as the Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: build/
          include-hidden-files: true""",
    """      - name: Upload the build as the Pages artifact with bounded transport retries
        run: node scripts/upload-artifact.mjs github-pages build --pages""",
)
s = s.replace(
    """      - name: Preserve browser evidence
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: network-${{ matrix.engine }}
          path: browser-results/
          if-no-files-found: warn""",
    """      - name: Preserve browser evidence with bounded transport retries
        if: ${{ !cancelled() && steps.browser.outcome == 'success' }}
        run: node scripts/upload-artifact.mjs "network-$ENGINE" browser-results""",
)
s = s.replace(
    """      - name: Verify existing editor features and image downloads""",
    """      - name: Initialize browser evidence
        run: |
          mkdir -p browser-results
          node -e 'require("node:fs").writeFileSync("browser-results/run.json", JSON.stringify({sha: process.env.GITHUB_SHA, engine: process.env.ENGINE}))'

      - name: Verify existing editor features and image downloads""",
)


def concurrency(match):
    name = match[2]
    if name == 'deploy':
        return (
            match[1]
            + """    concurrency:
      group: main-writer-${{ github.repository }}-main
      cancel-in-progress: false
"""
        )
    group = 'check-${{ github.workflow }}-${{ github.ref }}-' + name
    if name == 'network-browsers':
        group += '-${{ matrix.engine }}'
    return match[1] + '    concurrency:\n      group: ' + group + '\n      cancel-in-progress: true\n'


header, body = s.split('jobs:\n', 1)
s = header + 'jobs:\n' + re.sub(r'(^  ([\w-]+):\n)', concurrency, body, flags=re.M)
s = s.replace('    needs: test\n', '    needs: [prepare, test, tooling, docs, codeql]\n')
s = s.replace(
    "    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'",
    """    if: >-
      !cancelled() && github.event_name != 'pull_request' && github.event_name != 'schedule' &&
      github.ref == 'refs/heads/main' && needs.prepare.outputs.code == 'true' &&
      needs.test.result == 'success' && needs.tooling.result == 'success' && needs.codeql.result == 'success' &&
      (needs.docs.result == 'success' || needs.prepare.outputs.docs == 'false')""",
)
p.write_text(s)
