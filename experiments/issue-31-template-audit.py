"""Inventory every file in both templates, preserving CI/configuration sources.

Usage: python3 experiments/issue-31-template-audit.py /tmp/issue31-templates
"""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

OUTPUT = Path('dev/log/issues/31/pulls/32')
CONFIG_NAMES = {
    'package.json',
    'pyproject.toml',
    'eslint.config.js',
    '.prettierignore',
    '.prettierrc',
    '.secretlintrc.json',
    '.ruff.toml',
    '.pre-commit-config.yaml',
    'lychee.toml',
    '.lycheeignore',
    'CONTRIBUTING.md',
    'README.md',
    '.gitignore',
}


def category(name):
    if name.startswith('.github/'):
        return 'Workflow, action or scanner configuration: inspect and adapt applicable gates'
    if name.startswith('scripts/'):
        if any(
            word in name
            for word in ('release', 'changeset', 'version', 'publish', 'npm', 'registry', 'push-main', 'tag')
        ):
            return 'Registry release helper: private website has no package/registry release'
        return 'CI/build/helper script: inspect; adapt checks, status, docs and Pages behavior'
    if name in CONFIG_NAMES or name.startswith('.husky/'):
        return 'Tooling/documentation: compare with website configuration'
    if name.startswith(('tests/', 'test/')):
        return 'Test: compare covered invariants; adapt relevant CI regressions to Vitest'
    if name.startswith(('docs/', 'dev/', 'changelog', '.changeset')):
        return 'Historical data/documentation or package changelog: reference, not executable website CI'
    if name.startswith(('examples/', 'src/', 'experiments/')):
        return 'Template application/example/probe: compare purpose; preserve existing React/browser equivalents'
    return 'Repository metadata or language/package infrastructure: assess by target (no published Python package)'


for language in ('js', 'python'):
    root = Path(sys.argv[1]) / language
    sha = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
    files = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z']).decode().split('\0')
    rows = []
    signals = []
    for name in filter(None, files):
        source = root / name
        raw = source.read_bytes()
        disposition = category(name)
        rows.append(
            {'file': name, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'assessment': disposition}
        )
        if name.startswith(('.github/', 'scripts/', '.husky/')) or name in CONFIG_NAMES:
            target = OUTPUT / 'templates' / language / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            for number, line in enumerate(raw.decode(errors='replace').splitlines(), 1):
                if any(
                    word in line.lower()
                    for word in (
                        'retry',
                        'continue-on-error',
                        'timeout',
                        'cancel-in-progress',
                        'if-no-files',
                        'exit ',
                        'audit',
                        'skip',
                        'fail',
                        'warn',
                        'credential',
                    )
                ):
                    signals.append(f'{name}:{number}: {line}')
    (OUTPUT / f'{language}-file-comparison.json').write_text(json.dumps({'sha': sha, 'files': rows}, indent=2) + '\n')
    (OUTPUT / f'{language}-ci-signals.txt').write_text('\n'.join(signals) + '\n')
    print(f'{language}: inspected {len(rows)} files; archived every CI script, workflow and tool configuration')
