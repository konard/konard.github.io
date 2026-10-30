"""Reproduce PR 40's visual defects, restoring local source even on failure.

Run with no other dev server using this checkout. The browser input is finite;
the expected nonzero exit is the regression test detecting the baseline bugs.
The Git index and committed history are never modified.
"""

import os
from pathlib import Path
import subprocess

BASELINE = 'ee8aa4a'
SOURCES = [
    'src/pages/pages.css',
    'src/settings/schema.skins.js',
    'src/settings/schema.ui.js',
    'src/skins.frames.css',
    'src/skins.frames.js',
    'src/skins.future.css',
    'src/skins.materials.css',
    'src/ui.css',
]


def main():
    originals = {Path(name): Path(name).read_bytes() for name in SOURCES}
    try:
        for path in originals:
            path.write_bytes(subprocess.check_output(['git', 'show', f'{BASELINE}:{path}']))
        environment = {**os.environ, 'CAPTURE_DIR': 'browser-results/visual-before'}
        return subprocess.run(
            ['node', 'experiments/issue-39-visual-review.mjs', '--before'],
            env=environment,
            check=False,
        ).returncode
    finally:
        for path, content in originals.items():
            path.write_bytes(content)


if __name__ == '__main__':
    raise SystemExit(main())
