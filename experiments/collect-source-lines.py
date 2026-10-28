#!/usr/bin/env python3
"""Reproducible public-only cloc and git-blame snapshot; one repository at a time.

Use: python experiments/collect-source-lines.py --cloc /path/to/cloc-2.10.pl
Full default-branch history is needed: shallow blame would misattribute old lines.
A disk-backed set deduplicates original commit/path/line identities across mirrors.
Only counts and public SHAs are retained, never commit emails or private metadata.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import resource
import sqlite3
import subprocess
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/case-studies/issue-33/data'
EXCLUDED = 'node_modules,vendor,third_party,third-party,dist,build,target,.git,packages_cache'
GIT_CONFIG = {
    'pack.threads': '1',
    'core.packedGitWindowSize': '16m',
    'core.packedGitLimit': '64m',
    'core.preloadIndex': 'false',
    'index.threads': '1',
    'gc.auto': '0',
    'maintenance.auto': 'false',
}
NON_SOURCE_SUFFIXES = {
    '.json',
    '.md',
    '.markdown',
    '.yaml',
    '.yml',
    '.txt',
    '.csv',
    '.xml',
    '.svg',
    '.toml',
    '.ini',
    '.rst',
    '.ipynb',
    '.lock',
    '.patch',
    '.diff',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.ico',
    '.bmp',
    '.tiff',
    '.psd',
    '.pdf',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.eot',
    '.mp4',
    '.webm',
    '.mov',
    '.mp3',
    '.wav',
    '.ogg',
    '.flac',
    '.zip',
    '.gz',
    '.bz2',
    '.xz',
    '.7z',
    '.rar',
    '.tar',
    '.sqlite',
    '.db',
    '.dll',
    '.exe',
    '.so',
    '.dylib',
    '.a',
    '.o',
    '.class',
    '.jar',
    '.pyc',
}
NON_CODE = {
    'Markdown',
    'JSON',
    'YAML',
    'Text',
    'CSV',
    'XML',
    'SVG',
    'TOML',
    'INI',
    'reStructuredText',
    'Jupyter Notebook',
    'diff',
}


def run(args, cwd=None, input=None):
    return subprocess.check_output(
        args, cwd=cwd, input=input, text=True, encoding='utf-8', errors='replace', stderr=subprocess.PIPE
    )


def read(name):
    return json.loads((DATA / name).read_text())


def save(name, obj):
    dest = DATA / name
    temp = dest.with_suffix('.tmp')
    temp.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n')
    temp.replace(dest)


def discard_non_code(result, database):
    """Upgrade a checkpoint without allowing saved patches to inflate authorship."""
    for measurement in result['repositories'].values():
        for language in NON_CODE:
            measurement['authoredLines'].pop(language, None)
    database.executemany('DELETE FROM lines WHERE language = ?', ((language,) for language in NON_CODE))
    database.commit()


def public_metadata(name):
    r = json.loads(run(['gh', 'api', f'repos/{name}']))
    if r.get('private') or r.get('visibility') != 'public':
        raise ValueError('Repository is not public')
    return r


def is_personal(email, commit, repository, identities):
    if email not in identities:
        r = json.loads(run(['gh', 'api', f'repos/{repository}/commits/{commit}']))
        identities[email] = (r.get('author') or {}).get('login', '').lower() == 'konard'
    return identities[email]


def blame_file(repo, filename, language, identities, database, repository):
    proc = subprocess.Popen(
        ['git', 'blame', '--line-porcelain', 'HEAD', '--', filename],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors='replace',
    )
    commit = original = email = origin = None
    lines = 0
    try:
        for line in proc.stdout:
            match = re.match(r'^([0-9a-f]{40}) (\d+) \d+(?: \d+)?$', line.rstrip())
            if match:
                commit, original = match.groups()
            elif line.startswith('author-mail '):
                email = line[12:].strip().strip('<>').lower()
            elif line.startswith('filename '):
                origin = line[9:].rstrip('\n')
            elif line.startswith('\t') and line[1:].strip() and identities.get(email, False):
                # Porcelain's original filename and line survive moves/renames; same
                # commit in an upstream and fork must count only once globally.
                key = hashlib.sha256(f'{commit}:{origin}:{original}'.encode()).hexdigest()
                added = database.execute('INSERT OR IGNORE INTO lines VALUES (?, ?)', (key, language)).rowcount
                lines += added
        errors = proc.stderr.read()
        if proc.wait() != 0:
            raise RuntimeError(errors)
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()
        proc.stdout.close()
        proc.stderr.close()
    return lines


def candidate_paths(repo, identities):
    """Skip untouched files without losing credit through later whole-file moves.

    Name-status diffs need trees only, not historic blobs. A deletion paired
    with additions may be a rename, so conservatively include every destination.
    Git blame still decides authorship; this filter never grants line credit.
    """
    tokens = run(
        ['git', 'log', '--format=COMMIT%x00%ae', '--name-status', '-z', '--no-renames', '--diff-merges=first-parent'],
        repo,
    ).split('\0')
    candidates, moves = set(), []
    additions, deletions = set(), set()
    personal = False
    index = 0
    while index < len(tokens):
        token = tokens[index].lstrip('\n')
        index += 1
        if not token:
            continue
        if token == 'COMMIT':
            if additions and deletions:
                moves.append((deletions, additions))
            additions, deletions = set(), set()
            personal = identities.get(tokens[index].lower(), False)
            index += 1
        else:
            filename = tokens[index]
            index += 1
            if personal and token != 'D':
                candidates.add(filename)
            if token == 'D':
                deletions.add(filename)
            elif token == 'A':
                additions.add(filename)
    if additions and deletions:
        moves.append((deletions, additions))
    changed = True
    while changed:
        changed = False
        for deleted, added in moves:
            if deleted & candidates and not added <= candidates:
                candidates.update(added)
                changed = True
    return candidates


def json_line_counts(path):
    """Match cloc 2.10's JSON rule (no comments) using fixed-size buffers.

    cloc's whole-file regular expressions exhaust memory on large JSON data.
    A long physical line still counts as one line, without retaining its text.
    """
    counts = {'language': 'JSON', 'code': 0, 'comment': 0, 'blank': 0}
    nonblank = pending = False
    with path.open('rb') as handle:
        while chunk := handle.read(64 * 1024):
            parts = chunk.split(b'\n')
            for index, part in enumerate(parts):
                nonblank |= bool(part.strip())
                pending |= bool(part)
                if index < len(parts) - 1:
                    counts['code' if nonblank else 'blank'] += 1
                    nonblank = pending = False
    if pending:
        counts['code' if nonblank else 'blank'] += 1
    return counts


def prefetch_blame_history(repo, paths, current_only=False):
    """Batch partial-clone blobs instead of one network fetch per blame step."""
    paths = sorted(paths)
    missing = set()
    for start in range(0, len(paths), 128):
        objects = run(
            [
                'git',
                'rev-list',
                '--objects',
                '--missing=print',
                *(['--no-walk'] if current_only else []),
                'HEAD',
                '--',
                *paths[start : start + 128],
            ],
            repo,
        )
        missing.update(line[1:] for line in objects.splitlines() if line.startswith('?'))
    objects = sorted(missing)
    for start in range(0, len(objects), 256):
        run(
            [
                'git',
                '-c',
                'fetch.negotiationAlgorithm=noop',
                'fetch',
                '--no-tags',
                '--no-write-fetch-head',
                '--recurse-submodules=no',
                '--filter=blob:none',
                '--stdin',
                'origin',
            ],
            repo,
            input='\n'.join(objects[start : start + 256]) + '\n',
        )


def checkout_candidates(repo, candidates):
    """Materialize current candidate paths without downloading unrelated assets."""
    current = set(run(['git', 'ls-tree', '-r', '--name-only', '-z', 'HEAD'], repo).split('\0'))
    excluded = set(EXCLUDED.split(','))
    paths = sorted(
        name
        for name in candidates & current
        if not excluded.intersection(Path(name).parts[:-1]) and Path(name).suffix.lower() not in NON_SOURCE_SUFFIXES
    )
    # Path-limited checkout otherwise issues one tiny promisor fetch per file.
    prefetch_blame_history(repo, paths, current_only=True)
    for start in range(0, len(paths), 128):
        run(['git', 'checkout', 'HEAD', '--', *paths[start : start + 128]], repo)
    return set(paths)


def prefetch_authored_history(repo, source_paths, candidates):
    # A directory move changes every historical path. Prefetching only today's
    # names leaves blame doing one network request per old version of each file.
    suffixes = {Path(name).suffix.lower() for name in source_paths}
    excluded = set(EXCLUDED.split(','))
    historical = {
        name
        for name in candidates
        if Path(name).suffix.lower() in suffixes and not excluded.intersection(Path(name).parts[:-1])
    }
    prefetch_blame_history(repo, historical | set(source_paths))


def count_files(repo, cloc):
    tracked = run(['git', 'ls-files', '-z'], repo).split('\0')
    excluded = set(EXCLUDED.split(','))
    large_json = [
        name
        for name in tracked
        if name.lower().endswith('.json')
        and not excluded.intersection(Path(name).parts[:-1])
        and (repo / name).is_file()
        and (repo / name).stat().st_size > 1024**2
    ]
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt') as exclusions:
        exclusions.write('\n'.join(str(repo / name) for name in large_json))
        exclusions.flush()
        stats = json.loads(
            run(
                [
                    'perl',
                    cloc,
                    '--vcs=git',
                    '--by-file',
                    '--json',
                    '--quiet',
                    '--skip-uniqueness',
                    f'--exclude-dir={EXCLUDED}',
                    f'--exclude-list-file={exclusions.name}',
                    '.',
                ],
                repo,
            )
        )
    files = {k: v for k, v in stats.items() if k not in {'header', 'SUM'}}
    for name in large_json:
        files[f'./{name}'] = json_line_counts(repo / name)
    return files


def collect(name, cloc, database, identities, whole_repository=True, author_head=None, previous=None, trace=False):
    if not whole_repository and author_head and author_head['hasPersonalCommits'] is False:
        # This public SHA's history was queried using GitHub's verified user ID.
        # No matching commit means blame cannot grant personal credit. Do not
        # download unrelated upstream history merely to rediscover that fact.
        return {
            'sha': author_head['sha'],
            'sourceLines': {},
            'authoredLines': {},
            'sourceLinesScope': 'authorship-candidates',
            'attributionCheck': 'GitHub account-filtered public default-branch history',
            'collectedAt': author_head['checkedAt'],
        }
    if (
        author_head
        and previous
        and author_head['sha'] == previous['sha']
        and (not whole_repository or previous.get('sourceLinesScope') == 'whole-repository')
    ):
        # Identical trees/history give identical cloc and blame results. Every
        # original line at this SHA is already in the global deduplication set.
        return {
            'sha': author_head['sha'],
            'sourceLines': previous['sourceLines'],
            'sourceLinesScope': previous['sourceLinesScope'],
            'authoredLines': {},
            'attributionCheck': 'Identical public revision already measured and globally deduplicated',
            'collectedAt': author_head['checkedAt'],
        }
    metadata = public_metadata(name)
    if not metadata.get('size'):
        return {
            'sha': None,
            'sourceLines': {},
            'authoredLines': {},
            'empty': True,
            'collectedAt': datetime.now(timezone.utc).isoformat(),
        }
    with tempfile.TemporaryDirectory(prefix='issue33-source-') as directory:
        repo = Path(directory) / 'repo'
        run(
            [
                'git',
                '-c',
                'pack.threads=1',
                'clone',
                *(argument for key, value in GIT_CONFIG.items() for argument in ['--config', f'{key}={value}']),
                '--single-branch',
                '--no-tags',
                # Large histories fetch blobs on demand; ordinary repositories
                # are faster as full clones than many tiny lazy blame fetches.
                *(['--filter=blob:none'] if metadata['size'] > 100000 else []),
                *([] if whole_repository else ['--no-checkout']),
                f'https://github.com/{name}.git',
                str(repo),
            ]
        )
        sha = run(['git', 'rev-parse', 'HEAD'], repo).strip()
        # Resolve plausible historical identities against GitHub's actual author
        # mapping instead of trusting names or counting tools/bots as the person.
        authors = run(['git', 'log', '--format=%H%x09%ae%x09%an'], repo).splitlines()
        for author in authors:
            commit, email, display = author.split('\t', 2)
            email = email.lower()
            if email in identities:
                continue
            plausible = re.search(r'konard|diachenko|dyachenko|дьяченко', display + ' ' + email, re.I)
            if plausible:
                is_personal(email, commit, name, identities)
            else:
                identities[email] = False
        has_author = any(identities.get(a.split('\t', 2)[1].lower(), False) for a in authors)
        candidates = candidate_paths(repo, identities) if has_author else set()
        historical_candidates = candidates
        # Outside projects supply personal attribution only. Their full source
        # totals are not displayed, so avoid downloading unrelated game assets,
        # datasets and history blobs. Every possible authored path is retained.
        if not whole_repository:
            candidates = checkout_candidates(repo, candidates)
        # cloc's --vcs=git avoids untracked/generated dependencies, --skip-uniqueness
        # counts each tracked path; repository totals describe the actual snapshot.
        files = count_files(repo, cloc) if whole_repository or candidates else {}
        totals = {}
        for stat in files.values():
            language = stat['language']
            total = totals.setdefault(language, {'code': 0, 'comment': 0, 'blank': 0})
            for key in total:
                total[key] += stat[key]
        authored = {}
        if has_author:
            source_paths = [
                filename.removeprefix('./')
                for filename, stat in files.items()
                if stat['language'] not in NON_CODE and filename.removeprefix('./') in candidates
            ]
            if trace:
                print(f'{name}: prefetching history for {len(source_paths)} source files', flush=True)
            prefetch_authored_history(repo, source_paths, historical_candidates)
            processed = 0
            for filename, stat in files.items():
                if stat['language'] in NON_CODE or filename.removeprefix('./') not in candidates:
                    continue
                count = blame_file(repo, filename.removeprefix('./'), stat['language'], identities, database, name)
                if count:
                    authored[stat['language']] = authored.get(stat['language'], 0) + count
                processed += 1
                if trace and (processed % 100 == 0 or processed == len(source_paths)):
                    print(f'{name}: attributed {processed}/{len(source_paths)} source files', flush=True)
        return {
            'sha': sha,
            'sourceLinesScope': 'whole-repository' if whole_repository else 'authorship-candidates',
            'sourceLines': totals,
            'authoredLines': authored,
            'collectedAt': datetime.now(timezone.utc).isoformat(),
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cloc', required=True)
    parser.add_argument(
        '--fresh',
        action='store_true',
        help='Rebuild all measurements and deduplication state from current public heads',
    )
    parser.add_argument(
        '--verbose', action='store_true', help='Trace source-file progress and bounded error diagnostics'
    )
    parser.add_argument('--only', help='Comma-separated public repositories for a focused verification')
    args = parser.parse_args()
    # Finite memory/stack limits for clone, Perl counting and blame subprocesses.
    resource.setrlimit(resource.RLIMIT_AS, (850 * 1024**2, 850 * 1024**2))
    resource.setrlimit(resource.RLIMIT_STACK, (64 * 1024**2, 64 * 1024**2))
    owned = set(r['fullName'] for r in read('repositories.json'))
    names = set(owned)
    if (DATA / 'contributed-repositories.json').exists():
        names.update(read('contributed-repositories.json')['repositories'])
    heads = read('author-heads.json')['repositories'] if (DATA / 'author-heads.json').exists() else {}
    if heads:
        names.update(heads)
    inventory = read('public-inventory.json')['repositories'] if (DATA / 'public-inventory.json').exists() else []
    noise = {r['fullName'] for r in inventory if r['generatedNoise']}
    names = sorted(
        (n for n in names if n not in noise and not re.search(r'log-tmp-|solution-draft-log|^konard/test$', n, re.I)),
        key=lambda n: (n not in owned, n),
    )
    if args.only:
        names = args.only.split(',')
    output = DATA / 'source-lines.json'
    result = read('source-lines.json') if output.exists() and not args.fresh else {'repositories': {}, 'errors': {}}
    result.update(
        {
            'generator': 'experiments/collect-source-lines.py',
            'clocVersion': run(['perl', args.cloc, '--version']).strip(),
            'method': 'Default-branch cloc code/comment/blank counts; git blame surviving nonblank programming/markup source lines (including comments) attributed to GitHub-verified konard identities. Excludes documentation/data, saved patches and dependency/build directories. Deduplicated by original commit/path/line across public repositories.',
            'collectedAt': datetime.now(timezone.utc).isoformat(),
        }
    )
    cache = Path(tempfile.gettempdir()) / 'issue33-source-cache'
    cache.mkdir(exist_ok=True)
    if result['repositories'] and not (cache / 'lines.sqlite3').exists():
        raise ValueError('Deduplication cache is missing; use --fresh to rebuild consistent attribution')
    database = sqlite3.connect(cache / 'lines.sqlite3')
    database.execute('CREATE TABLE IF NOT EXISTS lines (identity TEXT PRIMARY KEY, language TEXT NOT NULL)')
    durable_checkpoints = database.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'measurements'"
    ).fetchone()
    database.execute('CREATE TABLE IF NOT EXISTS measurements (name TEXT PRIMARY KEY, payload TEXT NOT NULL)')
    if args.fresh:
        database.execute('DELETE FROM lines')
        database.execute('DELETE FROM measurements')
        database.commit()
    elif durable_checkpoints:
        # The database is authoritative: line identities and their measurement
        # commit together, even if interruption prevents the following JSON write.
        result['repositories'] = {
            name: json.loads(payload) for name, payload in database.execute('SELECT name, payload FROM measurements')
        }
        for name in result['repositories']:
            result['errors'].pop(name, None)
    for name in noise & result['repositories'].keys():
        if result['repositories'][name]['authoredLines']:
            raise ValueError('Changed noise policy requires --fresh to preserve deduplication consistency')
        del result['repositories'][name]
        result['errors'].pop(name, None)
        database.execute('DELETE FROM measurements WHERE name = ?', (name,))
    discard_non_code(result, database)
    # Also upgrades checkpoints created before durable measurements existed.
    database.executemany(
        'INSERT OR REPLACE INTO measurements VALUES (?, ?)',
        ((name, json.dumps(measurement)) for name, measurement in result['repositories'].items()),
    )
    database.commit()
    identity_file = cache / 'identities.json'
    identities = json.loads(identity_file.read_text()) if identity_file.exists() else {}
    verified_file = cache / 'verified-account-emails.json'
    if verified_file.exists():
        identities.update(dict.fromkeys(json.loads(verified_file.read_text()), True))
    for name, measurement in result['repositories'].items():
        if name in owned:
            measurement.setdefault('sourceLinesScope', 'whole-repository')
    by_sha = {}
    for measurement in result['repositories'].values():
        sha = measurement['sha']
        if sha and (sha not in by_sha or measurement.get('sourceLinesScope') == 'whole-repository'):
            by_sha[sha] = measurement
    for index, name in enumerate(names):
        if name in result['repositories']:
            continue
        print(f'{index + 1}/{len(names)} {name}', flush=True)
        try:
            measurement = collect(
                name,
                args.cloc,
                database,
                identities,
                whole_repository=name in owned,
                author_head=heads.get(name),
                previous=by_sha.get(heads.get(name, {}).get('sha')),
                trace=args.verbose,
            )
            database.execute('INSERT OR REPLACE INTO measurements VALUES (?, ?)', (name, json.dumps(measurement)))
            database.commit()
            result['repositories'][name] = measurement
            if measurement['sha'] and measurement.get('sourceLinesScope') == 'whole-repository':
                by_sha[measurement['sha']] = measurement
            result['errors'].pop(name, None)
        except (subprocess.SubprocessError, ValueError, OSError, RuntimeError) as error:
            database.rollback()
            # Keep failures explicit. A missing result is never displayed as zero.
            result['errors'][name] = str(error)[:400]
            print(f'ERROR {name}: {error}', flush=True)
            if args.verbose and isinstance(error, subprocess.CalledProcessError):
                print(str(error.stderr)[-2000:], flush=True)
                print(str(error.stdout)[-2000:], flush=True)
        save('source-lines.json', result)
        identity_file.write_text(json.dumps(identities))
    # Summaries remain reproducible from the committed per-repository results,
    # even if a collector resumes after its temporary SQLite cache was removed.
    result['languages'] = {}
    for measurement in result['repositories'].values():
        for language, count in measurement['authoredLines'].items():
            result['languages'][language] = result['languages'].get(language, 0) + count
    result['totalAuthoredLines'] = sum(result['languages'].values())
    result['requestedRepositories'] = len(names)
    result['collectedAt'] = datetime.now(timezone.utc).isoformat()
    save('source-lines.json', result)
    database.close()
    print(f'Complete: {len(result["repositories"])} repositories, {len(result["errors"])} errors', flush=True)


if __name__ == '__main__':
    main()
