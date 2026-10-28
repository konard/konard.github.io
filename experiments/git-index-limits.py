"""Bounded reproduction of Git's threaded-lstat failure during the source scan."""

from pathlib import Path
import resource
import subprocess
import tempfile


def limits():
    resource.setrlimit(resource.RLIMIT_AS, (128 * 1024**2, 128 * 1024**2))
    resource.setrlimit(resource.RLIMIT_STACK, (64 * 1024**2, 64 * 1024**2))


def main():
    with tempfile.TemporaryDirectory() as directory:
        repo = Path(directory)

        def git(*args, bounded=False):
            return subprocess.run(
                ['git', *args], cwd=repo, capture_output=True, text=True, preexec_fn=limits if bounded else None
            )

        git('init', '-q').check_returncode()
        git('config', 'user.name', 'Fixture').check_returncode()
        git('config', 'user.email', 'fixture@example.invalid').check_returncode()
        for index in range(2500):
            (repo / f'{index}.py').write_text('print(1)\n')
        git('add', '.').check_returncode()
        git('commit', '-qm', 'Bounded fixture').check_returncode()
        for preload in ['true', 'false']:
            result = git('-c', f'core.preloadIndex={preload}', 'checkout', 'HEAD', '--', '0.py', bounded=True)
            print(f'core.preloadIndex={preload}, status={result.returncode}, stderr={result.stderr.strip()}')
            if preload == 'false':
                result.check_returncode()


if __name__ == '__main__':
    main()
