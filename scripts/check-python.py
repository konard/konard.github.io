"""Compile every maintained Python helper without writing bytecode or executing it."""

from pathlib import Path
import subprocess

files = subprocess.check_output(['git', 'ls-files', '-z', '*.py']).decode().split('\0')
checked = 0
for name in filter(None, files):
    if name.startswith(('dev/log/', 'docs/')):
        continue
    source = Path(name)
    compile(source.read_bytes(), name, 'exec')
    checked += 1
if not checked:
    raise RuntimeError('No Python files checked')
print(f'Compiled {checked} Python helpers without executing them.')
