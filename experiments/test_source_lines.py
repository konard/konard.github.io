"""Finite local fixtures for attribution, mirror deduplication and privacy guards."""

import importlib.util
import json
import os
import resource
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('collector', Path(__file__).with_name('collect-source-lines.py'))
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class SourceLinesTests(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('CLOC_PATH'), 'Set CLOC_PATH to the pinned cloc 2.10 script')
    def test_interrupted_json_write_recovers_committed_attribution_on_resume(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            origin = root / 'origin'
            origin.mkdir()
            for args in [
                ['init', '-q'],
                ['config', 'user.name', 'Fixture'],
                ['config', 'user.email', 'verified@example.invalid'],
            ]:
                subprocess.check_call(['git', '-C', str(origin), *args])
            (origin / 'code.py').write_text('print(1)\n')
            subprocess.check_call(['git', '-C', str(origin), 'add', '.'])
            subprocess.check_call(['git', '-C', str(origin), 'commit', '-qm', 'One attributed line'])
            data = root / 'data'
            data.mkdir()
            (data / 'repositories.json').write_text('[{"fullName":"fixture/public"}]')
            cache = root / 'issue33-source-cache'
            cache.mkdir()
            (cache / 'verified-account-emails.json').write_text('["verified@example.invalid"]')
            real_run, real_connect = collector.run, sqlite3.connect
            connections = []

            def local_run(args, *rest, **kwargs):
                if 'clone' in args:
                    args = [*args[:-2], origin.as_uri(), args[-1]]
                return real_run(args, *rest, **kwargs)

            def connect(*args, **kwargs):
                database = real_connect(*args, **kwargs)
                connections.append(database)
                return database

            try:
                with (
                    patch.object(collector, 'DATA', data),
                    patch.object(collector.tempfile, 'gettempdir', return_value=directory),
                    patch.object(collector.sqlite3, 'connect', side_effect=connect),
                    patch.object(collector, 'public_metadata', return_value={'size': 1}),
                    patch.object(collector, 'run', side_effect=local_run),
                    patch.object(sys, 'argv', ['collector', '--cloc', os.environ['CLOC_PATH']]),
                ):
                    with patch.object(collector, 'save', side_effect=OSError('Interrupted checkpoint write')):
                        with self.assertRaisesRegex(OSError, 'Interrupted checkpoint'):
                            collector.main()
                    connections[-1].close()
                    collector.main()
                result = json.loads((data / 'source-lines.json').read_text())
                self.assertEqual(result['totalAuthoredLines'], 1)
                self.assertEqual(result['repositories']['fixture/public']['authoredLines'], {'Python': 1})
            finally:
                for database in connections:
                    database.close()

    def test_checkpoint_upgrade_discards_patch_credit_without_losing_code_or_repository_counts(self):
        database = sqlite3.connect(':memory:')
        database.execute('CREATE TABLE lines (identity TEXT PRIMARY KEY, language TEXT NOT NULL)')
        database.executemany('INSERT INTO lines VALUES (?, ?)', [('patch-line', 'diff'), ('code-line', 'Python')])
        measurement = {'sourceLines': {'diff': {'code': 6}}, 'authoredLines': {'diff': 6, 'Python': 1}}
        result = {'repositories': {'fixture/public': measurement}}
        collector.discard_non_code(result, database)
        self.assertEqual(measurement['sourceLines'], {'diff': {'code': 6}})
        self.assertEqual(measurement['authoredLines'], {'Python': 1})
        self.assertEqual(database.execute('SELECT * FROM lines').fetchall(), [('code-line', 'Python')])
        database.close()

    @unittest.skipUnless(os.environ.get('CLOC_PATH'), 'Set CLOC_PATH to the pinned cloc 2.10 script')
    def test_saved_patches_remain_in_repository_counts_but_not_personal_programming_totals(self):
        with tempfile.TemporaryDirectory() as directory:
            origin = Path(directory) / 'origin'
            origin.mkdir()
            for args in [
                ['init', '-q'],
                ['config', 'user.name', 'Fixture'],
                ['config', 'user.email', 'verified@example.invalid'],
            ]:
                subprocess.check_call(['git', '-C', str(origin), *args])
            (origin / 'saved.patch').write_text(
                'diff --git a/file.py b/file.py\n--- a/file.py\n+++ b/file.py\n@@ -1 +1 @@\n-print(0)\n+print(1)\n'
            )
            subprocess.check_call(['git', '-C', str(origin), 'add', '.'])
            subprocess.check_call(['git', '-C', str(origin), 'commit', '-qm', 'Saved changes'])
            database = sqlite3.connect(':memory:')
            database.execute('CREATE TABLE lines (identity TEXT PRIMARY KEY, language TEXT NOT NULL)')
            real_run = collector.run

            def local_run(args, *rest, **kwargs):
                if 'clone' in args:
                    args = [*args[:-2], origin.as_uri(), args[-1]]
                return real_run(args, *rest, **kwargs)

            with (
                patch.object(collector, 'public_metadata', return_value={'size': 1}),
                patch.object(collector, 'run', side_effect=local_run),
            ):
                result = collector.collect(
                    'fixture/public', os.environ['CLOC_PATH'], database, {'verified@example.invalid': True}
                )
            self.assertGreater(result['sourceLines']['diff']['code'], 0)
            self.assertEqual(result['authoredLines'], {})
            database.close()

    @unittest.skipUnless(os.environ.get('CLOC_PATH'), 'Set CLOC_PATH to the pinned cloc 2.10 script')
    def test_cloc_keeps_large_json_and_code_comment_blank_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            subprocess.check_call(['git', 'init', '-q', directory])
            (repo / 'data.json').write_text('\n{"value":"' + 'x' * 2_000_000 + '"}\n \n{}')
            (repo / 'code.py').write_text('# Comment\nprint(1)\n\n')
            subprocess.check_call(['git', '-C', directory, 'add', '.'])
            files = collector.count_files(repo, os.environ['CLOC_PATH'])
            self.assertEqual(files['./data.json'], {'language': 'JSON', 'code': 2, 'comment': 0, 'blank': 2})
            self.assertEqual(files['./code.py'], {'language': 'Python', 'code': 1, 'comment': 1, 'blank': 1})

    def test_large_json_uses_bounded_physical_line_count_without_dropping_data(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'large.json'
            path.write_text('\n{"value":"' + ('x' * 2_000_000) + '"}\n  \n{}')
            self.assertEqual(
                collector.json_line_counts(path),
                {'language': 'JSON', 'code': 2, 'comment': 0, 'blank': 2},
            )

    def test_private_repository_is_rejected_before_clone(self):
        with patch.object(collector, 'run', return_value=json.dumps({'private': True, 'visibility': 'private'})):
            with self.assertRaisesRegex(ValueError, 'not public'):
                collector.public_metadata('fixture/private')

    def test_empty_verified_public_author_history_needs_no_clone(self):
        head = {'sha': 'a' * 40, 'hasPersonalCommits': False, 'checkedAt': '2026-10-28T00:00:00Z'}
        with patch.object(collector, 'run', side_effect=AssertionError('No repository download is needed')):
            result = collector.collect('fixture/public-fork', '', None, {}, whole_repository=False, author_head=head)
        self.assertEqual(result['sha'], head['sha'])
        self.assertEqual(result['authoredLines'], {})
        self.assertEqual(result['collectedAt'], head['checkedAt'])
        self.assertEqual(result['attributionCheck'], 'GitHub account-filtered public default-branch history')

    def test_identical_public_revision_reuses_counts_without_granting_duplicate_credit(self):
        head = {'sha': 'a' * 40, 'hasPersonalCommits': True, 'checkedAt': '2026-10-28T00:00:00Z'}
        previous = {
            'sha': head['sha'],
            'sourceLines': {'Python': {'code': 2, 'comment': 1, 'blank': 1}},
            'sourceLinesScope': 'whole-repository',
            'authoredLines': {'Python': 3},
        }
        for legacy in (False, True):
            with self.subTest(legacy=legacy):
                measurement = dict(previous)
                if legacy:
                    del measurement['sourceLinesScope']
                with patch.object(collector, 'run', side_effect=AssertionError('Identical history needs no download')):
                    result = collector.collect(
                        'fixture/mirror',
                        '',
                        None,
                        {},
                        whole_repository=not legacy,
                        author_head=head,
                        previous=measurement,
                    )
                self.assertEqual(result['sourceLines'], previous['sourceLines'])
                self.assertEqual(result['sourceLinesScope'], 'whole-repository')
                self.assertEqual(result['authoredLines'], {})
                self.assertEqual(result['sha'], head['sha'])

    def test_partial_clone_prefetches_only_candidate_history_in_batches(self):
        def git(*args, cwd):
            return subprocess.check_output(['git', *args], cwd=cwd, stderr=subprocess.PIPE, text=True)

        with tempfile.TemporaryDirectory() as directory:
            origin = Path(directory) / 'origin'
            origin.mkdir()
            git('init', '-q', cwd=origin)
            git('config', 'user.name', 'Fixture author', cwd=origin)
            git('config', 'user.email', 'verified@example.invalid', cwd=origin)
            git('config', 'uploadpack.allowFilter', 'true', cwd=origin)
            for version in range(2):
                (origin / 'legacy.py').write_text(f'print({version})\n')
                (origin / 'unrelated.py').write_text(f'print("other {version}")\n')
                (origin / 'preview.png').write_bytes(b'asset' + bytes([version]))
                (origin / 'README.md').write_text(f'Documentation {version}')
                git('add', '.', cwd=origin)
                git('commit', '-qm', f'Version {version}', cwd=origin)
            git('mv', 'legacy.py', 'candidate.py', cwd=origin)
            git('commit', '-qm', 'Move source path', cwd=origin)
            partial = Path(directory) / 'partial'
            git('clone', '-q', '--filter=blob:none', '--no-checkout', origin.as_uri(), str(partial), cwd=directory)
            command = ('rev-list', '--objects', '--missing=print', 'HEAD', '--', 'candidate.py', 'legacy.py')
            self.assertIn('?', git(*command, cwd=partial))
            self.assertEqual(collector.checkout_candidates(partial, {'README.md', 'preview.png'}), set())
            self.assertEqual(git('ls-files', cwd=partial), '')
            collector.checkout_candidates(partial, {'candidate.py', 'deleted.py', 'preview.png', 'README.md'})
            self.assertEqual(git('ls-files', cwd=partial).splitlines(), ['candidate.py'])
            self.assertEqual((partial / 'candidate.py').read_text(), 'print(1)\n')
            self.assertFalse((partial / 'unrelated.py').exists())
            self.assertFalse((partial / 'preview.png').exists())
            self.assertFalse((partial / 'README.md').exists())
            self.assertIn('?', git(*command, cwd=partial))
            collector.prefetch_authored_history(partial, ['candidate.py'], {'legacy.py', 'candidate.py', 'preview.png'})
            self.assertNotIn('?', git(*command, cwd=partial))
            self.assertNotIn(
                '?',
                git('rev-list', '--objects', '--missing=print', 'HEAD', '--', 'candidate.py', 'legacy.py', cwd=partial),
            )
            self.assertIn('?', git('rev-list', '--objects', '--missing=print', 'HEAD', cwd=partial))

    def test_large_git_index_respects_bounded_memory_without_threaded_lstat_failure(self):
        def limits():
            resource.setrlimit(resource.RLIMIT_AS, (128 * 1024**2, 128 * 1024**2))
            resource.setrlimit(resource.RLIMIT_STACK, (64 * 1024**2, 64 * 1024**2))

        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)

            def git(*args, bounded=False):
                return subprocess.check_output(
                    ['git', *args], cwd=repo, stderr=subprocess.PIPE, preexec_fn=limits if bounded else None
                )

            git('init', '-q')
            for key, value in collector.GIT_CONFIG.items():
                git('config', key, value)
            git('config', 'user.name', 'Fixture')
            git('config', 'user.email', 'fixture@example.invalid')
            for index in range(2500):
                (repo / f'{index}.py').write_text('print(1)\n')
            git('add', '.')
            git('commit', '-qm', 'Bounded index fixture')
            git('checkout', 'HEAD', '--', '0.py', bounded=True)

    def test_blame_counts_only_verified_nonblank_lines_once_across_mirrors(self):
        def git(*args, cwd):
            return subprocess.check_output(['git', *args], cwd=cwd, stderr=subprocess.PIPE, text=True)

        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / 'original'
            repo.mkdir()
            git('init', '-q', cwd=repo)
            git('config', 'user.name', 'Fixture author', cwd=repo)
            git('config', 'user.email', 'verified@example.invalid', cwd=repo)
            (repo / 'fixture.py').write_text('# Comment is included\nprint(1)\n\nprint(2)\n')
            git('add', '.', cwd=repo)
            git('commit', '-qm', 'Fixture source', cwd=repo)
            database = sqlite3.connect(':memory:')
            database.execute('CREATE TABLE lines (identity TEXT PRIMARY KEY, language TEXT NOT NULL)')
            identities = {'verified@example.invalid': True}
            self.assertEqual(collector.candidate_paths(repo, identities), {'fixture.py'})
            count = collector.blame_file(repo, 'fixture.py', 'Python', identities, database, 'fixture/original')
            self.assertEqual(count, 3)
            mirror = Path(directory) / 'mirror'
            git('clone', '-q', str(repo), str(mirror), cwd=directory)
            self.assertEqual(
                collector.blame_file(mirror, 'fixture.py', 'Python', identities, database, 'fixture/mirror'), 0
            )
            # A different author gets no personal credit for a new source line.
            git('config', 'user.name', 'Other author', cwd=mirror)
            git('config', 'user.email', 'other@example.invalid', cwd=mirror)
            (mirror / 'fixture.py').write_text('# Comment is included\nprint(1)\n\nprint(3)\n')
            git('commit', '-qam', 'Another author changes one line', cwd=mirror)
            self.assertEqual(
                collector.blame_file(mirror, 'fixture.py', 'Python', identities, database, 'fixture/mirror'), 0
            )
            # A later rename by somebody else must retain the candidate path.
            git('mv', 'fixture.py', 'renamed source.py', cwd=mirror)
            (mirror / 'unrelated.py').write_text('print("somebody else")\n')
            git('add', '.', cwd=mirror)
            git('commit', '-qm', 'Move source and add unrelated work', cwd=mirror)
            candidates = collector.candidate_paths(mirror, identities)
            self.assertIn('renamed source.py', candidates)
            # Conservative move detection may include unrelated additions; blame
            # still rejects their other author and cannot manufacture credit.
            self.assertEqual(
                collector.blame_file(mirror, 'unrelated.py', 'Python', identities, database, 'fixture/mirror'), 0
            )
            database.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
