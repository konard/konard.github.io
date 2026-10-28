// Shared networking for the registry snapshot collector.
'use strict';
const { execFile } = require('node:child_process');
const UA = 'konard.github.io data collector (https://github.com/konard/konard.github.io)';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hostGap = {
  'crates.io': 1100,
  'pypistats.org': 1500,
  'api.npmjs.org': 150,
  'hub.docker.com': 300,
  'github.com': 700,
  'swiftpackageindex.com': 500,
};
const hostQueue = new Map();
async function throttle(host) {
  const gap = hostGap[host];
  if (!gap) return;
  const previous = hostQueue.get(host) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => (release = resolve));
  hostQueue.set(
    host,
    previous.then(() => current),
  );
  await previous;
  setTimeout(release, gap);
}

async function request(url, { method = 'GET', headers = {}, body, as = 'json', tries = 5, timeout = 60000 } = {}) {
  const host = new URL(url).host;
  for (let attempt = 1; ; attempt++) {
    await throttle(host);
    try {
      const res = await fetch(url, {
        method,
        body,
        headers: { 'User-Agent': UA, Accept: as === 'json' ? 'application/json' : '*/*', ...headers },
        signal: AbortSignal.timeout(timeout),
        redirect: 'follow',
      });
      if ((res.status === 429 || res.status >= 500) && attempt < tries) {
        const retryAfter = Number(res.headers.get('retry-after')) || 0;
        await res.arrayBuffer().catch(() => {});
        await sleep(Math.min(60000, Math.max(retryAfter * 1000, 2000 * 2 ** (attempt - 1))));
        continue;
      }
      const text = await res.text();
      let data = text;
      if (as === 'json') {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      return { status: res.status, ok: res.ok, data };
    } catch (error) {
      if (attempt >= tries) return { status: 0, ok: false, data: null, error: String(error.message || error) };
      await sleep(2000 * attempt);
    }
  }
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

function gh(args) {
  return new Promise((resolve) => {
    execFile('gh', args, { encoding: 'utf8', maxBuffer: 1 << 28 }, (error, stdout, stderr) => {
      if (error) return resolve({ ok: false, error: (stderr || error.message || '').trim().split('\n')[0] });
      try {
        resolve({ ok: true, data: JSON.parse(stdout) });
      } catch {
        resolve({ ok: true, data: stdout });
      }
    });
  });
}
async function ghRetry(args, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    const result = await gh(args);
    if (result.ok || attempt >= tries || /404|409|Not Found|empty/i.test(result.error)) return result;
    await sleep(3000 * attempt);
  }
}

function npmMetadataUrl(name) {
  return `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
}

module.exports = { request, pool, gh, ghRetry, sleep, npmMetadataUrl };
