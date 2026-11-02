## Problem

`links.yml` produces a false negative and a recurring warning.

### 1. Link rot is never detected unless Markdown changes

`links.yml` runs only on `push` and `pull_request` filtered by `paths`, and on `workflow_dispatch`:

- [`.github/workflows/links.yml` lines 3-25](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/blob/67cfe05f/.github/workflows/links.yml#L3-L25): `push` (main, paths), `pull_request` (paths), `workflow_dispatch`.

There is no `schedule:` trigger; only `security.yml` runs weekly. An external URL that dies after the last Markdown edit stays undetected until someone edits a `.md`/`.html` file. That person then sees a failure unrelated to their change.

### 2. The restored lychee cache is almost always "too old"

[`.github/workflows/links.yml` lines 51-66](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/blob/67cfe05f/.github/workflows/links.yml#L51-L66) (excerpt):

```yaml
        uses: actions/cache@v5
          key: cache-lychee-${{ github.sha }}
          restore-keys: cache-lychee-
            --cache
            --max-cache-age 1d
```

The cache key is per commit and `restore-keys` matches any older cache. Lychee is told to keep results for only one day. Whenever the last run was more than a day ago, which is the usual case for docs-only triggers, the restored cache is discarded with a warning:

Run [41351625406](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/actions/runs/41351625406), job "Check Links", log line 294:

```
[WARN] Cache is too old (age: 2d 23h 6m 37s, max age: 1d 0h 0m 0s). Discarding and recreating.
```

The cache step therefore costs a download and adds a warning, but saves no requests.

## Suggested fix

This was fixed in konard/konard.github.io#52 (issue konard/konard.github.io#51):

1. Add a weekly run, so the links are rechecked without commits:

   ```yaml
   on:
     schedule:
       - cron: '0 6 * * 1'
   ```

2. Scope the cache to the UTC day. Then only a cache saved the same day is restored, and lychee never has to discard one:

   ```yaml
   - name: Name today's link cache
     id: link-cache
     run: echo "day=$(date -u +%F)" >> "$GITHUB_OUTPUT"
   - uses: actions/cache@v5
     with:
       path: .lycheecache
       key: cache-lychee-${{ steps.link-cache.outputs.day }}-${{ github.sha }}
       restore-keys: cache-lychee-${{ steps.link-cache.outputs.day }}-
   ```

   The alternative is to raise `--max-cache-age` (for example to `7d`). That keeps a hit after a quiet week, but also trusts week-old "OK" results.

3. Assert both in the workflow test, so neither can silently regress.

## Acceptance criteria

- `links.yml` runs on a weekly schedule, in addition to its existing triggers.
- No `[WARN] Cache is too old` in the Broken Link Checker logs.
- A workflow test covers the schedule and the cache key.
