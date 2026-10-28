"""Compare the completed public census with its private, durable deduplication cache.

Only aggregate counts are printed. Never publish the database or identity cache.
Run after collect-source-lines.py finishes, before rebuilding the website data.
"""

import argparse
from collections import Counter
import json
from pathlib import Path
import sqlite3
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--database', type=Path, default=Path(tempfile.gettempdir()) / 'issue33-source-cache/lines.sqlite3'
    )
    parser.add_argument('--snapshot', type=Path, default=Path('docs/case-studies/issue-33/data/source-lines.json'))
    args = parser.parse_args()
    snapshot = json.loads(args.snapshot.read_text())
    if snapshot['errors'] or len(snapshot['repositories']) != snapshot['requestedRepositories']:
        raise ValueError('The public census is not complete')
    with sqlite3.connect(args.database.resolve().as_uri() + '?mode=ro', uri=True) as database:
        database.execute('PRAGMA query_only = ON')
        database.execute('PRAGMA cache_size = -4096')
        database.execute('PRAGMA temp_store = FILE')
        durable = {
            name: json.loads(payload) for name, payload in database.execute('SELECT name, payload FROM measurements')
        }
        if durable != snapshot['repositories']:
            raise ValueError('JSON measurements differ from their durable checkpoints')
        unique = dict(database.execute('SELECT language, COUNT(*) FROM lines GROUP BY language'))
    reported = Counter()
    for measurement in snapshot['repositories'].values():
        reported.update(measurement['authoredLines'])
    if (
        unique != dict(reported)
        or unique != snapshot['languages']
        or sum(unique.values()) != snapshot['totalAuthoredLines']
    ):
        raise ValueError('Reported attribution differs from the deduplicated original-line identities')
    print(
        json.dumps(
            {
                'status': 'passed',
                'snapshotCollectedAt': snapshot['collectedAt'],
                'durableMeasurements': len(durable),
                'uniqueAttributedLines': sum(unique.values()),
                'languages': unique,
            },
            indent=2,
        )
    )


if __name__ == '__main__':
    main()
