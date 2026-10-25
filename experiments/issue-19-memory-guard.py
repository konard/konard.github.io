"""Bound Linux browser probes by descendant RSS, cgroup usage and wall time.

Usage: python3 experiments/issue-19-memory-guard.py node experiments/...
Only the launched process tree is terminated; unrelated workspace processes stay alive.
"""

import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time


def processes():
    result = {}
    for directory in Path('/proc').glob('[0-9]*'):
        try:
            fields = (directory / 'stat').read_text().rsplit(')', 1)[1].split()
            result[int(directory.name)] = (int(fields[1]), int(fields[21]) * os.sysconf('SC_PAGE_SIZE'))
        except (OSError, ValueError, IndexError):
            pass
    return result


def memory():
    return int(Path('/sys/fs/cgroup/memory.current').read_text())


start = time.monotonic()
baseline = memory()
rss_limit = min(int(os.environ.get('PROBE_RSS_BYTES', '1200000000')), 1_600_000_000)
seconds_limit = min(float(os.environ.get('PROBE_SECONDS', '45')), 180)
ceiling = min(baseline + rss_limit + 50_000_000, 2_700_000_000)
child = subprocess.Popen(sys.argv[1:], start_new_session=True)
owned = {child.pid}
peak_rss = 0
peak_cgroup = baseline
reason = None
try:
    while child.poll() is None:
        current = processes()
        while True:
            descendants = {pid for pid, (parent, _) in current.items() if parent in owned}
            if descendants <= owned:
                break
            owned |= descendants
        rss = sum(current[pid][1] for pid in owned if pid in current)
        usage = memory()
        peak_rss = max(peak_rss, rss)
        peak_cgroup = max(peak_cgroup, usage)
        if rss > rss_limit or usage > ceiling:
            reason = 'memory ceiling'
            break
        if time.monotonic() - start > seconds_limit:
            reason = f'{seconds_limit:g} second probe limit'
            break
        time.sleep(0.025)
finally:
    for sig in (signal.SIGTERM, signal.SIGKILL):
        for pid in sorted(owned, reverse=True):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        if sig == signal.SIGTERM:
            time.sleep(0.3)
    code = child.wait()
    print(json.dumps({'guard': reason or 'completed', 'exitCode': code,
                      'peakRssBytes': peak_rss, 'peakCgroupBytes': peak_cgroup,
                      'seconds': round(time.monotonic() - start, 2)}), flush=True)
sys.exit(97 if reason else code)
