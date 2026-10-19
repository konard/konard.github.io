#!/usr/bin/env node
// Collects packages published by konard and the organizations konard founded or
// worked in, across as many public package registries as can be queried
// without credentials, and writes docs/case-studies/issue-7/data/registries.json.
//
// Two complementary discovery strategies are used:
//   1. Account based: list everything owned by a registry account / scope /
//      namespace (npm user + org listings, crates.io user, NuGet owner, PyPI
//      user, Docker Hub namespace, GitHub Packages pages, ...).
//   2. Manifest based: walk the git tree of every repository listed in
//      repositories.json, read publishable manifests (package.json, Cargo.toml,
//      pyproject.toml, go.mod, *.gemspec, composer.json, pubspec.yaml, ...)
//      and look the declared names up in the matching registry. A hit only
//      counts when the registry metadata points back to one of the owners, so
//      name collisions with unrelated packages are discarded.
//
// Usage: node experiments/collect-registries.cjs [output-dir]
// Requires Node 22+ (global fetch) and an authenticated `gh` CLI for git trees.
'use strict';
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'docs/case-studies/issue-7/data';
const REPOS_FILE = path.join(OUT, 'repositories.json');
const UA = 'konard.github.io data collector (https://github.com/konard/konard.github.io)';
const USER = 'konard';
const ORGS = ['linksplatform', 'deep-foundation', 'link-foundation', 'link-assistant', 'deep-assistant'];
const NPM_SCOPES = [
  'deep-foundation',
  'link-foundation',
  'linksplatform',
  'link-assistant',
  'deep-assistant',
  'konard',
  'deepcase',
];
const DOCKER_NAMESPACES = [
  'konard',
  'deepf',
  'deepfoundation',
  'deep-foundation',
  'linksplatform',
  'linkfoundation',
  'link-foundation',
  'linkassistant',
  'deepassistant',
];
const NAMES = [USER, ...ORGS]; // generic account names probed on smaller registries

const log = (...args) => console.error(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- networking
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

// ------------------------------------------------------------------- helpers
const repos = JSON.parse(fs.readFileSync(REPOS_FILE, 'utf8'));
const OWNERS = [...new Set(repos.map((r) => r.owner))];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OWNER_RE = new RegExp(
  `(?:github\\.com[/:](${OWNERS.map(escapeRe).join('|')})(?:/|$)|(?:^|/)(${OWNERS.map(escapeRe).join('|')})\\.github\\.io)`,
  'i',
);
const pointsToOwners = (...urls) =>
  urls
    .flat()
    .filter((u) => typeof u === 'string')
    .some((u) => OWNER_RE.test(u));
const repoUrl = (value) => (typeof value === 'string' ? value : value && value.url) || null;
const cleanRepo = (u) =>
  u
    ? String(u)
        .replace(/^git\+/, '')
        .replace(/^git:\/\//, 'https://')
        .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/\.git$/, '')
    : null;
const short = (s, n = 200) => (s ? String(s).replace(/\s+/g, ' ').trim().slice(0, n) : null);
const sum = (list, key = 'downloads') => list.reduce((a, p) => a + (Number(p[key]) || 0), 0);

function registry(id, name, url, extra = {}) {
  return { id, name, url, accounts: [], packages: [], discovery: [], status: 'none', note: null, ...extra };
}
function finish(reg, { downloadsPeriod } = {}) {
  reg.packages.sort((a, b) => (b.downloads || 0) - (a.downloads || 0) || a.name.localeCompare(b.name));
  reg.totals = { packages: reg.packages.length, downloads: sum(reg.packages) };
  if (downloadsPeriod !== undefined) reg.totals.downloadsPeriod = downloadsPeriod;
  if (reg.packages.length) reg.status = reg.status === 'blocked' ? 'partial' : 'ok';
  return reg;
}
async function guarded(id, fn) {
  try {
    log(`start ${id}`);
    const reg = await fn();
    log(`done  ${id}: ${reg.status}, ${reg.packages.length} packages`);
    return reg;
  } catch (error) {
    log(`FAIL  ${id}: ${error.stack || error}`);
    return {
      id,
      name: id,
      status: 'blocked',
      note: `collector error: ${error.message}`,
      accounts: [],
      packages: [],
      totals: { packages: 0, downloads: 0 },
    };
  }
}

// ------------------------------------------------------ manifest discovery
const MANIFEST_RULES = [
  ['npm', (p) => /(^|\/)package\.json$/.test(p)],
  ['crates', (p) => /(^|\/)Cargo\.toml$/.test(p)],
  ['pypi', (p) => /(^|\/)(pyproject\.toml|setup\.py|setup\.cfg)$/.test(p)],
  ['rubygems', (p) => /\.gemspec$/.test(p)],
  ['packagist', (p) => /(^|\/)composer\.json$/.test(p)],
  ['pub', (p) => /(^|\/)pubspec\.yaml$/.test(p)],
  ['hex', (p) => /(^|\/)mix\.exs$/.test(p)],
  ['go', (p) => /(^|\/)go\.mod$/.test(p)],
  ['nuget', (p) => /\.(csproj|fsproj|nuspec)$/i.test(p)],
  ['swift', (p) => /^Package\.swift$/.test(p)],
  ['maven', (p) => /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/.test(p)],
];
const SKIP_DIR =
  /(^|\/)(node_modules|vendor|third[_-]?party|external|deps|\.git|dist|build|out|target|bower_components|examples?|samples?|fixtures?|tests?|__tests__|benchmarks?|templates?|\.github|docs?)\//i;
const MAX_PER_KIND = 60;

async function discoverManifests() {
  const candidates = {
    npm: [],
    crates: [],
    pypi: [],
    rubygems: [],
    packagist: [],
    pub: [],
    hex: [],
    go: [],
    nuget: [],
    swift: [],
    maven: [],
    homebrew: [],
  };
  const treeErrors = [];
  let truncated = 0;
  await pool(repos, 8, async (repo) => {
    const res = await ghRetry(['api', `repos/${repo.fullName}/git/trees/HEAD?recursive=1`]);
    if (!res.ok || !res.data || !Array.isArray(res.data.tree)) {
      if (!/409|empty/i.test(res.error || '')) treeErrors.push({ repo: repo.fullName, error: res.error || 'no tree' });
      return;
    }
    if (res.data.truncated) truncated++;
    const files = res.data.tree.filter((t) => t.type === 'blob').map((t) => t.path);
    const counts = {};
    for (const file of files) {
      if (/^homebrew-/i.test(repo.name) && /^(Formula|Casks?)\/.+\.rb$/.test(file)) {
        candidates.homebrew.push({
          repo: repo.fullName,
          path: file,
          name: path.basename(file, '.rb'),
          kind: file.split('/')[0],
        });
        continue;
      }
      if (SKIP_DIR.test(file)) continue;
      for (const [kind, test] of MANIFEST_RULES) {
        if (!test(file)) continue;
        counts[kind] = (counts[kind] || 0) + 1;
        if (counts[kind] <= MAX_PER_KIND) candidates[kind].push({ repo: repo.fullName, owner: repo.owner, path: file });
      }
    }
  });
  log(
    `manifest scan: ${Object.entries(candidates)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(' ')}; tree errors ${treeErrors.length}; truncated ${truncated}`,
  );
  return { candidates, treeErrors, truncated };
}

const rawCache = new Map();
async function raw(repo, file) {
  const key = `${repo}/${file}`;
  if (!rawCache.has(key)) {
    rawCache.set(
      key,
      request(`https://raw.githubusercontent.com/${repo}/HEAD/${file.split('/').map(encodeURIComponent).join('/')}`, {
        as: 'text',
        tries: 3,
      }).then((r) => (r.ok ? r.data : null)),
    );
  }
  return rawCache.get(key);
}
const tomlSection = (text, section) => {
  const m = text.match(new RegExp(`^\\[${escapeRe(section)}\\]\\s*$([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))`, 'm'));
  return m ? m[1] : null;
};
const tomlString = (block, key) => {
  const m = block && block.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']+)["']`, 'm'));
  return m ? m[1] : null;
};

async function manifestNames(list, parse) {
  const out = new Map();
  await pool(list, 8, async (c) => {
    const text = await raw(c.repo, c.path);
    if (!text) return;
    let names;
    try {
      names = [].concat(parse(text, c) || []);
    } catch {
      names = [];
    }
    for (const name of names) {
      if (!name || /[\s{}$<>]/.test(name)) continue;
      if (!out.has(name)) out.set(name, { name, repo: c.repo, path: c.path });
    }
  });
  return [...out.values()];
}

// ======================================================================= npm
async function collectNpm(manifest) {
  const reg = registry('npm', 'npm', 'https://www.npmjs.com/~konard');
  const access = new Map(); // package -> sources
  const add = (name, source) => access.set(name, [...(access.get(name) || []), source]);

  const user = await request(`https://registry.npmjs.org/-/user/${USER}/package`);
  reg.accounts.push({
    account: `~${USER}`,
    kind: 'user',
    url: `https://www.npmjs.com/~${USER}`,
    found: user.ok,
    packages: user.ok ? Object.keys(user.data).length : 0,
  });
  if (user.ok) for (const name of Object.keys(user.data)) add(name, `user:${USER}`);

  const scopes = new Set(NPM_SCOPES);
  for (const name of access.keys()) if (name.startsWith('@')) scopes.add(name.slice(1).split('/')[0]);
  for (const scope of [...scopes].sort()) {
    if (scope === USER) continue;
    const res = await request(`https://registry.npmjs.org/-/org/${scope}/package`);
    reg.accounts.push({
      account: `@${scope}`,
      kind: 'scope',
      url: `https://www.npmjs.com/org/${scope}`,
      found: res.ok,
      packages: res.ok ? Object.keys(res.data).length : 0,
      ...(res.ok ? {} : { httpStatus: res.status }),
    });
    if (res.ok) for (const name of Object.keys(res.data)) add(name, `scope:${scope}`);
  }

  // Search API, for cross-checking (search index may lag the listings above).
  let from = 0;
  const searchNames = new Set();
  for (;;) {
    const res = await request(`https://registry.npmjs.org/-/v1/search?text=maintainer:${USER}&size=250&from=${from}`);
    if (!res.ok || !res.data || !res.data.objects.length) break;
    for (const o of res.data.objects) searchNames.add(o.package.name);
    from += res.data.objects.length;
    if (from >= res.data.total) break;
  }
  for (const name of searchNames) if (!access.has(name)) add(name, 'search:maintainer');
  reg.discovery.push(`user listing + ${scopes.size - 1} scope listings + maintainer search (${searchNames.size} hits)`);

  // Manifest based: unscoped/foreign-scope package.json names published by someone else.
  const names = await manifestNames(manifest.npm, (text) => {
    const pkg = JSON.parse(text);
    return pkg.private ? null : pkg.name;
  });
  const unknown = names.filter((n) => !access.has(n.name));
  let manifestHits = 0;
  await pool(unknown, 8, async (n) => {
    const res = await request(`https://registry.npmjs.org/${n.name.replace('/', '%2f')}/latest`);
    if (
      res.ok &&
      res.data &&
      pointsToOwners(repoUrl(res.data.repository), res.data.homepage, res.data.bugs && res.data.bugs.url)
    ) {
      add(n.name, `manifest:${n.repo}`);
      manifestHits++;
    }
  });
  reg.discovery.push(
    `${names.length} package.json names in repos, ${unknown.length} not in listings, ${manifestHits} confirmed on npm`,
  );

  const all = [...access.keys()].sort();
  const meta = new Map();
  await pool(all, 8, async (name) => {
    const res = await request(`https://registry.npmjs.org/${name.replace('/', '%2f')}/latest`);
    meta.set(name, res.ok ? res.data : null);
  });

  // Downloads: unscoped in bulk (max 128), scoped individually.
  const downloads = new Map();
  const unscoped = all.filter((n) => !n.startsWith('@'));
  for (let i = 0; i < unscoped.length; i += 128) {
    const chunk = unscoped.slice(i, i + 128);
    const res = await request(`https://api.npmjs.org/downloads/point/last-month/${chunk.join(',')}`);
    if (res.ok && res.data) {
      if (chunk.length === 1) downloads.set(chunk[0], res.data.downloads);
      else for (const [name, v] of Object.entries(res.data)) downloads.set(name, v ? v.downloads : 0);
    }
  }
  let period = null;
  await pool(
    all.filter((n) => n.startsWith('@')),
    3,
    async (name) => {
      const res = await request(`https://api.npmjs.org/downloads/point/last-month/${name}`);
      if (res.ok && res.data) {
        downloads.set(name, res.data.downloads);
        period = period || `${res.data.start}..${res.data.end}`;
      }
    },
  );
  // Second, slower pass for anything the rate limiter dropped.
  for (const name of all.filter((n) => !downloads.has(n))) {
    await sleep(1500);
    const res = await request(`https://api.npmjs.org/downloads/point/last-month/${name}`, { tries: 8 });
    if (res.ok && res.data) downloads.set(name, res.data.downloads);
  }
  if (!period) {
    const res = await request('https://api.npmjs.org/downloads/point/last-month/links-notation');
    if (res.ok) period = `${res.data.start}..${res.data.end}`;
  }

  for (const name of all) {
    const m = meta.get(name);
    reg.packages.push({
      name,
      version: m ? m.version : null,
      description: short(m && m.description),
      url: `https://www.npmjs.com/package/${name}`,
      repository: cleanRepo(m && repoUrl(m.repository)),
      deprecated: m && m.deprecated ? true : undefined,
      unpublished: m ? undefined : true,
      downloads: downloads.has(name) ? downloads.get(name) : null,
      downloadsPeriod: 'last-month',
      sources: access.get(name),
    });
  }
  reg.note = `Downloads are npm "last-month" (${period}). Listings include every package konard or the related npm orgs can write to.`;
  return finish(reg, { downloadsPeriod: `last-month ${period}` });
}

// ================================================================= crates.io
async function collectCrates(manifest) {
  const reg = registry('crates', 'crates.io', `https://crates.io/users/${USER}`);
  const found = new Map();
  const userRes = await request(`https://crates.io/api/v1/users/${USER}`);
  reg.accounts.push({ account: USER, kind: 'user', url: `https://crates.io/users/${USER}`, found: userRes.ok });
  const toPkg = (c, source) => ({
    name: c.name,
    version: c.max_stable_version || c.max_version || c.newest_version,
    description: short(c.description),
    url: `https://crates.io/crates/${c.name}`,
    repository: cleanRepo(c.repository),
    downloads: c.downloads,
    downloadsPeriod: 'all-time',
    recentDownloads: c.recent_downloads,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    sources: [source],
  });
  if (userRes.ok) {
    const id = userRes.data.user.id;
    for (let page = 1; ; page++) {
      const res = await request(`https://crates.io/api/v1/crates?user_id=${id}&per_page=100&page=${page}`);
      if (!res.ok || !res.data.crates.length) break;
      for (const c of res.data.crates) found.set(c.name, toPkg(c, `user:${USER}`));
      if (found.size >= res.data.meta.total) break;
    }
  }
  const names = await manifestNames(manifest.crates, (text) => {
    const pkg = tomlSection(text, 'package');
    if (!pkg || /^\s*publish\s*=\s*false/m.test(pkg)) return null;
    return tomlString(pkg, 'name');
  });
  const unknown = names.filter((n) => !found.has(n.name) && !found.has(n.name.replace(/_/g, '-')));
  let hits = 0;
  for (const n of unknown) {
    const res = await request(`https://crates.io/api/v1/crates/${encodeURIComponent(n.name)}`);
    if (
      res.ok &&
      res.data &&
      res.data.crate &&
      pointsToOwners(res.data.crate.repository, res.data.crate.homepage, res.data.crate.documentation)
    ) {
      found.set(res.data.crate.name, toPkg(res.data.crate, `manifest:${n.repo}`));
      hits++;
    }
  }
  reg.discovery.push(
    `user listing; ${names.length} Cargo.toml package names in repos, ${unknown.length} checked individually, ${hits} extra confirmed`,
  );
  reg.packages = [...found.values()];
  reg.totals_recent = sum(reg.packages, 'recentDownloads');
  reg.note = 'downloads = all-time; recentDownloads = last 90 days (crates.io definition).';
  finish(reg, { downloadsPeriod: 'all-time' });
  reg.totals.recentDownloads = reg.totals_recent;
  delete reg.totals_recent;
  return reg;
}

// ===================================================================== NuGet
async function collectNuget(manifest) {
  const reg = registry('nuget', 'NuGet', `https://www.nuget.org/profiles/${USER}`);
  const found = new Map();
  const toPkg = (p, source) => ({
    name: p.id,
    version: p.version,
    description: short(p.description),
    url: `https://www.nuget.org/packages/${p.id}`,
    repository: p.projectUrl || null,
    owners: [].concat(p.owners || []),
    downloads: p.totalDownloads,
    downloadsPeriod: 'all-time',
    versions: (p.versions || []).length,
    sources: [source],
  });
  // Owners seen on found packages are queried too (e.g. Link.Foundation co-owns packages with LinksPlatform).
  const queue = [
    USER,
    'LinksPlatform',
    'Link.Foundation',
    'DeepFoundation',
    'deep-foundation',
    'link-foundation',
    'LinkFoundation',
  ];
  const queried = new Set();
  while (queue.length) {
    const owner = queue.shift();
    if (queried.has(owner.toLowerCase())) continue;
    queried.add(owner.toLowerCase());
    let skip = 0;
    let total;
    for (;;) {
      const res = await request(
        `https://azuresearch-usnc.nuget.org/query?q=owner:${owner}&prerelease=true&semVerLevel=2.0.0&take=1000&skip=${skip}`,
      );
      if (!res.ok) break;
      total = res.data.totalHits;
      for (const p of res.data.data) {
        if (!p.owners || ![].concat(p.owners).some((o) => o.toLowerCase() === owner.toLowerCase())) continue;
        if (found.has(p.id)) found.get(p.id).sources.push(`owner:${owner}`);
        else found.set(p.id, toPkg(p, `owner:${owner}`));
      }
      skip += res.data.data.length;
      if (!res.data.data.length || skip >= total) break;
    }
    const exact = [...found.values()].filter((p) => p.sources.includes(`owner:${owner}`)).length;
    reg.accounts.push({
      account: owner,
      kind: 'owner',
      url: `https://www.nuget.org/profiles/${owner}`,
      found: exact > 0,
      packages: exact,
    });
    for (const p of found.values()) for (const o of p.owners) if (!queried.has(o.toLowerCase())) queue.push(o);
  }
  const names = manifest.nuget
    .map((c) => ({ name: path.basename(c.path).replace(/\.(csproj|fsproj|nuspec)$/i, ''), repo: c.repo }))
    .filter((n) => !/(^|\.)(Tests?|Benchmarks?|Examples?|Samples?|Demo|Console|App)$/i.test(n.name));
  const seen = new Set([...found.keys()].map((k) => k.toLowerCase()));
  const unknown = [
    ...new Map(names.filter((n) => !seen.has(n.name.toLowerCase())).map((n) => [n.name.toLowerCase(), n])).values(),
  ];
  let hits = 0;
  await pool(unknown, 6, async (n) => {
    const res = await request(
      `https://azuresearch-usnc.nuget.org/query?q=packageid:${encodeURIComponent(n.name)}&prerelease=true&semVerLevel=2.0.0`,
    );
    const p = res.ok && res.data && res.data.data[0];
    if (p && p.id.toLowerCase() === n.name.toLowerCase() && pointsToOwners(p.projectUrl)) {
      found.set(p.id, toPkg(p, `manifest:${n.repo}`));
      hits++;
    }
  });
  reg.discovery.push(
    `owner search; ${names.length} project files in repos, ${unknown.length} names checked by package id, ${hits} extra confirmed`,
  );
  reg.packages = [...found.values()];
  reg.note = 'downloads = all-time totalDownloads from the NuGet search API.';
  return finish(reg, { downloadsPeriod: 'all-time' });
}

// ====================================================================== PyPI
async function collectPypi(manifest) {
  const reg = registry('pypi', 'PyPI', `https://pypi.org/user/${USER}/`);
  const roles = new Map();
  for (const account of NAMES) {
    const body = `<?xml version="1.0"?><methodCall><methodName>user_packages</methodName><params><param><value><string>${account}</string></value></param></params></methodCall>`;
    const res = await request('https://pypi.org/pypi', {
      method: 'POST',
      body,
      as: 'text',
      headers: { 'Content-Type': 'text/xml' },
    });
    const pairs = res.ok
      ? [...String(res.data).matchAll(/<string>([^<]*)<\/string>\s*<\/value>\s*<value><string>([^<]*)<\/string>/g)].map(
          (m) => [m[1], m[2]],
        )
      : [];
    reg.accounts.push({
      account,
      kind: 'user',
      url: `https://pypi.org/user/${account}/`,
      found: pairs.length > 0,
      packages: pairs.length,
      ...(res.ok ? {} : { httpStatus: res.status }),
    });
    for (const [role, name] of pairs) roles.set(name, [...(roles.get(name) || []), `${role.toLowerCase()}:${account}`]);
  }
  reg.discovery.push('XML-RPC user_packages (the HTML user page is behind a JS challenge)');
  const names = await manifestNames(manifest.pypi, (text, c) => {
    if (c.path.endsWith('pyproject.toml'))
      return tomlString(tomlSection(text, 'project'), 'name') || tomlString(tomlSection(text, 'tool.poetry'), 'name');
    if (c.path.endsWith('setup.cfg')) return tomlString(tomlSection(text, 'metadata'), 'name');
    const m = text.match(/\bname\s*=\s*["']([A-Za-z0-9._-]+)["']/);
    return m && m[1];
  });
  const norm = (n) => n.toLowerCase().replace(/[-_.]+/g, '-');
  const known = new Set([...roles.keys()].map(norm));
  let hits = 0;
  const projects = new Map();
  await pool(
    names.filter((n) => !known.has(norm(n.name))),
    6,
    async (n) => {
      const res = await request(`https://pypi.org/pypi/${encodeURIComponent(n.name)}/json`);
      if (
        res.ok &&
        res.data &&
        pointsToOwners(
          Object.values(res.data.info.project_urls || {}),
          res.data.info.home_page,
          res.data.info.download_url,
        )
      ) {
        roles.set(res.data.info.name, [`manifest:${n.repo}`]);
        projects.set(res.data.info.name, res.data);
        hits++;
      }
    },
  );
  reg.discovery.push(`${names.length} Python project names in repos, ${hits} extra confirmed on PyPI`);
  for (const name of [...roles.keys()].sort()) {
    const project =
      projects.get(name) || (await request(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`)).data;
    const info = project && project.info;
    const stats = await request(`https://pypistats.org/api/packages/${norm(name)}/recent`);
    const urls = info ? Object.values(info.project_urls || {}) : [];
    reg.packages.push({
      name,
      version: info ? info.version : null,
      description: short(info && info.summary),
      url: `https://pypi.org/project/${name}/`,
      repository: urls.find((u) => /github\.com/.test(u)) || (info && info.home_page) || null,
      downloads: stats.ok && stats.data ? stats.data.data.last_month : null,
      downloadsPeriod: 'last-month',
      lastWeek: stats.ok && stats.data ? stats.data.data.last_week : null,
      sources: roles.get(name),
    });
  }
  reg.note = 'Downloads from pypistats.org (last 30 days, excludes mirrors).';
  return finish(reg, { downloadsPeriod: 'last-month' });
}

// =========================================================== Docker Hub
async function collectDocker() {
  const reg = registry('dockerhub', 'Docker Hub', `https://hub.docker.com/u/${USER}`);
  for (const ns of DOCKER_NAMESPACES) {
    const [u, o] = [
      await request(`https://hub.docker.com/v2/users/${ns}/`),
      await request(`https://hub.docker.com/v2/orgs/${ns}/`),
    ];
    const exists = u.ok || o.ok;
    let count = 0;
    if (exists) {
      let url = `https://hub.docker.com/v2/repositories/${ns}/?page_size=100`;
      while (url) {
        const res = await request(url);
        if (!res.ok) break;
        for (const r of res.data.results) {
          count++;
          reg.packages.push({
            name: `${r.namespace}/${r.name}`,
            version: null,
            description: short(r.description),
            url: `https://hub.docker.com/r/${r.namespace}/${r.name}`,
            downloads: r.pull_count,
            downloadsPeriod: 'all-time pulls',
            stars: r.star_count,
            lastUpdated: r.last_updated,
          });
        }
        url = res.data.next;
      }
    }
    reg.accounts.push({
      account: ns,
      kind: u.ok ? 'user' : o.ok ? 'org' : null,
      url: `https://hub.docker.com/u/${ns}`,
      found: exists,
      packages: count,
    });
  }
  reg.note = 'downloads = all-time pull_count.';
  return finish(reg, { downloadsPeriod: 'all-time pulls' });
}

// ============================================ GitHub Packages (ghcr.io etc.)
const parseCount = (s) => {
  const m = String(s)
    .trim()
    .match(/^([\d.,]+)\s*([kKmMbB])?$/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Math.round(n * ({ k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1));
};
async function collectGithubPackages() {
  const reg = registry(
    'github-packages',
    'GitHub Packages (ghcr.io, npm.pkg.github.com, ...)',
    `https://github.com/${USER}?tab=packages`,
  );
  const api = await gh(['api', `users/${USER}/packages?package_type=container&per_page=1`]);
  const apiBlocked = !api.ok;
  reg.discovery.push(
    apiBlocked ? `REST API blocked: ${api.error} - fell back to public HTML package pages` : 'REST API available',
  );
  const owners = [[USER, 'user'], ...OWNERS.filter((o) => o !== USER).map((o) => [o, 'org'])];
  for (const [owner, kind] of owners) {
    let count = 0;
    let exists = false;
    for (let page = 1; page <= 50; page++) {
      const url =
        kind === 'user'
          ? `https://github.com/${owner}?tab=packages&page=${page}`
          : `https://github.com/orgs/${owner}/packages?page=${page}`;
      const res = await request(url, { as: 'text' });
      if (!res.ok) break;
      exists = true;
      const html = String(res.data);
      const rows = html.split('<li class="Box-row">').slice(1);
      let added = 0;
      for (const row of rows) {
        const link = row.match(/href="(\/(?:orgs|users)\/[^/]+\/packages\/([^/]+)\/package\/([^"]+))"/);
        if (!link || reg.packages.some((p) => p.url === `https://github.com${link[1]}`)) continue;
        const name = decodeURIComponent(link[3]);
        const published = row.match(/<relative-time datetime="([^"]+)"/);
        const repo = row.match(/in <strong><a [^>]*href="\/([^"]+)"/);
        const dl = row.match(/octicon-download[\s\S]*?<\/svg>\s*([^<\s][^<]*?)\s*<\/span>/);
        reg.packages.push({
          name: `${owner}/${name}`,
          type: link[2],
          version: null,
          description: null,
          url: `https://github.com${link[1]}`,
          repository: repo ? `https://github.com/${repo[1]}` : null,
          publishedAt: published ? published[1] : null,
          downloads: dl ? parseCount(dl[1]) : null,
          downloadsText: dl ? dl[1].trim() : null,
          downloadsPeriod: 'all-time (rounded, as shown on github.com)',
        });
        added++;
      }
      count += added;
      if (!added || !new RegExp(`[?&]page=${page + 1}\\b`).test(html)) break;
    }
    reg.accounts.push({
      account: owner,
      kind,
      url: kind === 'user' ? `https://github.com/${owner}?tab=packages` : `https://github.com/orgs/${owner}/packages`,
      found: exists,
      packages: count,
    });
  }
  if (apiBlocked) {
    reg.status = 'blocked';
    reg.blocker =
      'gh token lacks read:packages scope; exact download counts and versions need `gh auth refresh -s read:packages`.';
  }
  reg.note =
    'Scraped from public github.com package listings; download counts are rounded by GitHub (e.g. 1.37k). Only public packages are visible.';
  return finish(reg, { downloadsPeriod: 'all-time (rounded)' });
}

// ================================================================= RubyGems
async function collectRubygems(manifest) {
  const reg = registry('rubygems', 'RubyGems', `https://rubygems.org/profiles/${USER}`);
  const found = new Map();
  const toPkg = (g, source) => ({
    name: g.name,
    version: g.version,
    description: short(g.info),
    url: g.project_uri,
    repository: g.source_code_uri || g.homepage_uri,
    downloads: g.downloads,
    downloadsPeriod: 'all-time',
    sources: [source],
  });
  for (const account of NAMES) {
    const res = await request(`https://rubygems.org/api/v1/owners/${account}/gems.json`);
    const list = res.ok && Array.isArray(res.data) ? res.data : [];
    reg.accounts.push({
      account,
      kind: 'owner',
      url: `https://rubygems.org/profiles/${account}`,
      found: res.ok,
      packages: list.length,
      ...(res.ok ? {} : { httpStatus: res.status }),
    });
    for (const g of list) found.set(g.name, toPkg(g, `owner:${account}`));
  }
  const names = await manifestNames(manifest.rubygems, (text) => {
    const m = text.match(/\.name\s*=\s*["']([^"']+)["']/);
    return m && m[1];
  });
  let hits = 0;
  await pool(
    names.filter((n) => !found.has(n.name)),
    6,
    async (n) => {
      const res = await request(`https://rubygems.org/api/v1/gems/${encodeURIComponent(n.name)}.json`);
      if (
        res.ok &&
        res.data &&
        pointsToOwners(res.data.source_code_uri, res.data.homepage_uri, res.data.bug_tracker_uri)
      ) {
        found.set(res.data.name, toPkg(res.data, `manifest:${n.repo}`));
        hits++;
      }
    },
  );
  reg.discovery.push(`${names.length} gemspec names in repos, ${hits} confirmed`);
  reg.packages = [...found.values()];
  return finish(reg, { downloadsPeriod: 'all-time' });
}

// ================================================================= Packagist
async function collectPackagist(manifest) {
  const reg = registry('packagist', 'Packagist (PHP)', `https://packagist.org/users/${USER}/`);
  const names = new Map();
  for (const vendor of [...new Set([...NAMES, ...OWNERS.map((o) => o.toLowerCase())])]) {
    const res = await request(`https://packagist.org/packages/list.json?vendor=${vendor}`);
    const list = res.ok && res.data ? res.data.packageNames : [];
    reg.accounts.push({
      account: vendor,
      kind: 'vendor',
      url: `https://packagist.org/packages/${vendor}/`,
      found: list.length > 0,
      packages: list.length,
    });
    for (const n of list) names.set(n, `vendor:${vendor}`);
  }
  const fromRepos = await manifestNames(manifest.packagist, (text) => JSON.parse(text).name);
  for (const n of fromRepos) if (!names.has(n.name)) names.set(n.name, `manifest:${n.repo}`);
  for (const [name, source] of names) {
    const res = await request(`https://packagist.org/packages/${name}.json`);
    if (!res.ok || !res.data || !res.data.package) continue;
    const p = res.data.package;
    if (source.startsWith('manifest:') && !pointsToOwners(p.repository)) continue;
    reg.packages.push({
      name,
      version: null,
      description: short(p.description),
      url: `https://packagist.org/packages/${name}`,
      repository: p.repository,
      downloads: p.downloads.total,
      downloadsPeriod: 'all-time',
      monthly: p.downloads.monthly,
      sources: [source],
    });
  }
  reg.discovery.push(`vendor listings; ${fromRepos.length} composer.json names in repos checked`);
  return finish(reg, { downloadsPeriod: 'all-time' });
}

// ======================================================= Go module proxy
const goEscape = (p) => p.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`);
async function collectGo(manifest) {
  const reg = registry('go', 'Go module proxy (proxy.golang.org / pkg.go.dev)', 'https://pkg.go.dev/');
  const modules = await manifestNames(manifest.go, (text) => {
    const m = text.match(/^module\s+(\S+)/m);
    return m && m[1].replace(/["']/g, '');
  });
  for (const mod of modules) {
    if (!pointsToOwners(`https://${mod.name}/`)) {
      reg.discovery.push(
        `skipped ${mod.name} (${mod.name.startsWith('github.com/') ? 'foreign owner' : 'not a github.com path'}, in ${mod.repo})`,
      );
      continue;
    }
    const list = await request(`https://proxy.golang.org/${goEscape(mod.name)}/@v/list`, { as: 'text' });
    const latest = await request(`https://proxy.golang.org/${goEscape(mod.name)}/@latest`);
    if (!latest.ok) continue;
    const tags = list.ok ? String(list.data).split('\n').filter(Boolean) : [];
    reg.packages.push({
      name: mod.name,
      version: latest.data.Version,
      description: null,
      url: `https://pkg.go.dev/${mod.name}`,
      repository: `https://github.com/${mod.repo}`,
      taggedVersions: tags.length,
      pseudoVersionOnly: tags.length === 0,
      publishedAt: latest.data.Time,
      downloads: null,
      downloadsPeriod: 'not published by the Go proxy',
    });
  }
  reg.accounts.push({
    account: 'go.mod files in all repositories',
    kind: 'derived',
    found: modules.length > 0,
    packages: modules.length,
  });
  reg.discovery.push(`${modules.length} go.mod module paths found in repos`);
  reg.note =
    'The Go proxy serves any public module on demand; pseudoVersionOnly=true means no semver tag was ever published. Go has no public download counts.';
  return finish(reg, { downloadsPeriod: null });
}

// ===================================================================== JSR
async function collectJsr() {
  const reg = registry('jsr', 'JSR', 'https://jsr.io/');
  for (const scope of [...new Set([...NAMES, 'deepcase', 'linksplatform'])]) {
    const res = await request(`https://api.jsr.io/scopes/${scope}/packages?limit=100`);
    const items = res.ok && res.data ? res.data.items || [] : [];
    reg.accounts.push({
      account: `@${scope}`,
      kind: 'scope',
      url: `https://jsr.io/@${scope}`,
      found: res.ok,
      packages: items.length,
      ...(res.ok ? {} : { httpStatus: res.status }),
    });
    for (const p of items)
      reg.packages.push({
        name: `@${p.scope}/${p.name}`,
        version: p.latestVersion,
        description: short(p.description),
        url: `https://jsr.io/@${p.scope}/${p.name}`,
        downloads: null,
        downloadsPeriod: null,
      });
  }
  return finish(reg);
}

// ================================================== VS Code Marketplace / Open VSX
async function collectVscode() {
  const reg = registry('vscode', 'Visual Studio Marketplace', 'https://marketplace.visualstudio.com/');
  for (const publisher of NAMES) {
    const body = JSON.stringify({
      filters: [
        {
          criteria: [
            { filterType: 18, value: publisher },
            { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
          ],
          pageSize: 100,
        },
      ],
      flags: 0x100 | 0x200 | 0x2,
    });
    const res = await request('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json;api-version=7.2-preview.1' },
    });
    const exts =
      res.ok && res.data
        ? res.data.results[0].extensions.filter(
            (e) => e.publisher.publisherName.toLowerCase() === publisher.toLowerCase(),
          )
        : [];
    reg.accounts.push({
      account: publisher,
      kind: 'publisher',
      url: `https://marketplace.visualstudio.com/publishers/${publisher}`,
      found: exts.length > 0,
      packages: exts.length,
    });
    for (const e of exts) {
      const installs = (e.statistics || []).find((s) => s.statisticName === 'install');
      reg.packages.push({
        name: `${e.publisher.publisherName}.${e.extensionName}`,
        version: e.versions && e.versions[0] && e.versions[0].version,
        description: short(e.shortDescription),
        url: `https://marketplace.visualstudio.com/items?itemName=${e.publisher.publisherName}.${e.extensionName}`,
        downloads: installs ? installs.value : null,
        downloadsPeriod: 'all-time installs',
      });
    }
  }
  return finish(reg);
}
async function collectOpenVsx() {
  const reg = registry('openvsx', 'Open VSX', 'https://open-vsx.org/');
  for (const ns of NAMES) {
    const res = await request(`https://open-vsx.org/api/${ns}`);
    const exts = res.ok && res.data && res.data.extensions ? Object.keys(res.data.extensions) : [];
    reg.accounts.push({
      account: ns,
      kind: 'namespace',
      url: `https://open-vsx.org/namespace/${ns}`,
      found: res.ok,
      packages: exts.length,
    });
    for (const name of exts) {
      const d = (await request(`https://open-vsx.org/api/${ns}/${name}`)).data || {};
      reg.packages.push({
        name: `${ns}.${name}`,
        version: d.version,
        description: short(d.description),
        url: `https://open-vsx.org/extension/${ns}/${name}`,
        downloads: d.downloadCount,
        downloadsPeriod: 'all-time',
      });
    }
  }
  return finish(reg);
}

// ============================================================ Maven Central
async function collectMaven(manifest) {
  const reg = registry('maven', 'Maven Central', 'https://central.sonatype.com/');
  const groups = [
    ...new Set(
      NAMES.flatMap((o) => [`io.github.${o}`, `com.github.${o}`]).concat(['com.linksplatform', 'foundation.link']),
    ),
  ];
  // search.maven.org is slow and flaky (30-60 s responses are common), so query in parallel with long timeouts.
  await pool(groups, 4, async (g) => {
    const res = await request(
      `https://search.maven.org/solrsearch/select?q=g:${encodeURIComponent(`"${g}"`)}&rows=100&wt=json`,
      { tries: 3, timeout: 75000 },
    );
    const docs = res.ok && res.data ? res.data.response.docs : [];
    reg.accounts.push({
      account: g,
      kind: 'groupId',
      found: docs.length > 0,
      packages: docs.length,
      ...(res.ok ? {} : { httpStatus: res.status, error: res.error }),
    });
    for (const d of docs)
      reg.packages.push({
        name: `${d.g}:${d.a}`,
        version: d.latestVersion,
        description: null,
        url: `https://central.sonatype.com/artifact/${d.g}/${d.a}`,
        downloads: null,
        downloadsPeriod: null,
        versions: d.versionCount,
      });
  });
  reg.accounts.sort((x, y) => groups.indexOf(x.account) - groups.indexOf(y.account));
  const failed = reg.accounts.filter((a) => a.httpStatus !== undefined).map((a) => a.account);
  if (failed.length) reg.discovery.push(`no answer for: ${failed.join(', ')}`);
  reg.discovery.push(
    `${groups.length} candidate groupIds queried; ${manifest.maven.length} pom.xml/build.gradle files exist in repos`,
  );
  if (reg.accounts.every((a) => a.httpStatus !== undefined)) {
    reg.status = 'blocked';
    reg.blocker = 'search.maven.org did not answer (timeouts / 5xx) for any groupId.';
  }
  reg.note = 'Maven Central publishes no per-artifact download counts.';
  return finish(reg);
}

// ============================================================ pub.dev / Hex
async function collectPub(manifest) {
  const reg = registry('pub', 'pub.dev (Dart/Flutter)', 'https://pub.dev/');
  const names = await manifestNames(manifest.pub, (text) => {
    if (/^publish_to:\s*['"]?none/m.test(text)) return null;
    const m = text.match(/^name:\s*([A-Za-z0-9_]+)/m);
    return m && m[1];
  });
  for (const n of names) {
    const res = await request(`https://pub.dev/api/packages/${n.name}`);
    if (!res.ok || !res.data) continue;
    const ps = res.data.latest.pubspec;
    if (!pointsToOwners(ps.repository, ps.homepage, ps.issue_tracker)) continue;
    const score = (await request(`https://pub.dev/api/packages/${n.name}/score`)).data || {};
    reg.packages.push({
      name: n.name,
      version: res.data.latest.version,
      description: short(ps.description),
      url: `https://pub.dev/packages/${n.name}`,
      repository: ps.repository || ps.homepage,
      downloads: score.downloadCount30Days ?? null,
      downloadsPeriod: 'last-30-days',
    });
  }
  reg.accounts.push({
    account: 'pubspec.yaml files in all repositories',
    kind: 'derived',
    found: names.length > 0,
    packages: names.length,
  });
  return finish(reg, { downloadsPeriod: 'last-30-days' });
}
async function collectHex(manifest) {
  const reg = registry('hex', 'Hex (Elixir/Erlang)', 'https://hex.pm/');
  for (const account of NAMES) {
    const res = await request(`https://hex.pm/api/users/${account}`);
    const pkgs = res.ok && res.data ? res.data.packages || [] : [];
    reg.accounts.push({
      account,
      kind: 'user',
      url: `https://hex.pm/users/${account}`,
      found: res.ok,
      packages: pkgs.length,
    });
    for (const p of pkgs) reg.packages.push({ name: p.name, url: p.html_url, downloads: null, downloadsPeriod: null });
  }
  const names = await manifestNames(manifest.hex, (text) => {
    const m = text.match(/\bapp:\s*:([a-z0-9_]+)/);
    return m && m[1];
  });
  for (const n of names) {
    if (reg.packages.some((p) => p.name === n.name)) continue;
    const res = await request(`https://hex.pm/api/packages/${n.name}`);
    if (res.ok && res.data && pointsToOwners(Object.values(res.data.meta.links || {})))
      reg.packages.push({
        name: n.name,
        version: res.data.latest_stable_version,
        description: short(res.data.meta.description),
        url: res.data.html_url,
        downloads: res.data.downloads.all,
        downloadsPeriod: 'all-time',
      });
  }
  reg.discovery.push(`${names.length} mix.exs apps in repos checked`);
  return finish(reg);
}

// ====================================================== Anaconda / AUR / Nimble
async function collectAnaconda() {
  const reg = registry('anaconda', 'Anaconda.org (conda)', 'https://anaconda.org/');
  for (const account of NAMES) {
    const res = await request(`https://api.anaconda.org/packages/${account}`);
    const list = res.ok && Array.isArray(res.data) ? res.data : [];
    reg.accounts.push({
      account,
      kind: 'user',
      url: `https://anaconda.org/${account}`,
      found: res.ok,
      packages: list.length,
    });
    for (const p of list)
      reg.packages.push({
        name: `${account}/${p.name}`,
        version: p.latest_version,
        description: short(p.summary),
        url: `https://anaconda.org/${account}/${p.name}`,
        downloads: (p.files || []).reduce((a, f) => a + (f.ndownloads || 0), 0),
        downloadsPeriod: 'all-time',
      });
  }
  return finish(reg);
}
async function collectAur() {
  const reg = registry('aur', 'Arch User Repository', 'https://aur.archlinux.org/');
  for (const by of ['maintainer', 'comaintainers', 'submitter']) {
    const res = await request(`https://aur.archlinux.org/rpc/v5/search/${USER}?by=${by}`);
    const list = res.ok && res.data ? res.data.results || [] : [];
    reg.accounts.push({
      account: `${USER} (${by})`,
      kind: by,
      url: `https://aur.archlinux.org/account/${USER}`,
      found: list.length > 0,
      packages: list.length,
    });
    for (const p of list)
      if (!reg.packages.some((x) => x.name === p.Name))
        reg.packages.push({
          name: p.Name,
          version: p.Version,
          description: short(p.Description),
          url: `https://aur.archlinux.org/packages/${p.Name}`,
          downloads: null,
          downloadsPeriod: null,
          votes: p.NumVotes,
        });
  }
  return finish(reg);
}
async function collectNimble() {
  const reg = registry('nimble', 'Nimble (Nim)', 'https://nimble.directory/');
  const res = await request('https://raw.githubusercontent.com/nim-lang/packages/master/packages.json');
  const list = res.ok && Array.isArray(res.data) ? res.data : [];
  for (const p of list)
    if (pointsToOwners(p.url, p.web))
      reg.packages.push({
        name: p.name,
        version: null,
        description: short(p.description),
        url: `https://nimble.directory/pkg/${p.name.toLowerCase()}`,
        repository: p.url,
        downloads: null,
        downloadsPeriod: null,
      });
  reg.accounts.push({
    account: 'nim-lang/packages index (matched by repository URL)',
    kind: 'index',
    found: res.ok,
    packages: reg.packages.length,
  });
  return finish(reg);
}

// ============================================ Swift Package Index / Homebrew
async function collectSwift(manifest) {
  const reg = registry('swift', 'Swift Package Index', 'https://swiftpackageindex.com/');
  for (const c of manifest.swift) {
    const res = await request(`https://swiftpackageindex.com/${c.repo}`, { as: 'text', tries: 3 });
    if (res.status === 200)
      reg.packages.push({
        name: c.repo,
        version: null,
        description: null,
        url: `https://swiftpackageindex.com/${c.repo}`,
        repository: `https://github.com/${c.repo}`,
        downloads: null,
        downloadsPeriod: null,
      });
  }
  reg.accounts.push({
    account: 'root Package.swift files in all repositories',
    kind: 'derived',
    found: manifest.swift.length > 0,
    packages: manifest.swift.length,
  });
  return finish(reg);
}
async function collectHomebrew(manifest) {
  const reg = registry('homebrew', 'Homebrew taps', 'https://brew.sh/');
  const taps = repos.filter((r) => /^homebrew-/i.test(r.name));
  for (const tap of taps)
    reg.accounts.push({
      account: tap.fullName,
      kind: 'tap',
      url: tap.url,
      found: true,
      packages: manifest.homebrew.filter((f) => f.repo === tap.fullName).length,
    });
  for (const f of manifest.homebrew) {
    const [owner, repo] = f.repo.split('/');
    reg.packages.push({
      name: `${owner.toLowerCase()}/${repo.replace(/^homebrew-/i, '')}/${f.name}`,
      type: f.kind === 'Formula' ? 'formula' : 'cask',
      version: null,
      description: null,
      url: `https://github.com/${f.repo}/blob/HEAD/${f.path}`,
      downloads: null,
      downloadsPeriod: 'third-party taps have no public analytics',
    });
  }
  return finish(reg);
}

// ===================================================================== main
async function main() {
  const started = Date.now();
  const manifestScan = await discoverManifests();
  const m = manifestScan.candidates;
  // Registries with strict rate limits run sequentially inside, the rest in parallel.
  const tasks = [
    ['npm', () => collectNpm(m)],
    ['crates', () => collectCrates(m)],
    ['nuget', () => collectNuget(m)],
    ['pypi', () => collectPypi(m)],
    ['dockerhub', collectDocker],
    ['github-packages', collectGithubPackages],
    ['rubygems', () => collectRubygems(m)],
    ['packagist', () => collectPackagist(m)],
    ['go', () => collectGo(m)],
    ['jsr', collectJsr],
    ['vscode', collectVscode],
    ['openvsx', collectOpenVsx],
    ['maven', () => collectMaven(m)],
    ['pub', () => collectPub(m)],
    ['hex', () => collectHex(m)],
    ['anaconda', collectAnaconda],
    ['aur', collectAur],
    ['nimble', collectNimble],
    ['swift', () => collectSwift(m)],
    ['homebrew', () => collectHomebrew(m)],
  ];
  const registries = await Promise.all(tasks.map(([id, fn]) => guarded(id, fn)));
  const withPackages = registries.filter((r) => r.packages.length);
  const output = {
    collectedAt: new Date().toISOString(),
    generator: 'experiments/collect-registries.cjs',
    owners: OWNERS,
    manifestScan: {
      repositories: repos.length,
      manifests: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.length])),
      truncatedTrees: manifestScan.truncated,
      treeErrors: manifestScan.treeErrors,
    },
    summary: {
      registriesChecked: registries.length,
      registriesWithPackages: withPackages.map((r) => r.id),
      blocked: registries
        .filter((r) => r.status === 'blocked' || r.status === 'partial')
        .map((r) => ({ id: r.id, blocker: r.blocker || r.note })),
      packages: sum(
        registries.map((r) => r.totals || {}),
        'packages',
      ),
      perRegistry: Object.fromEntries(
        registries.map((r) => [
          r.id,
          {
            status: r.status,
            packages: r.totals.packages,
            downloads: r.totals.downloads,
            downloadsPeriod: r.totals.downloadsPeriod ?? null,
          },
        ]),
      ),
    },
    notChecked: [
      'Chrome Web Store',
      'Chocolatey',
      'winget',
      'Snap Store',
      'Flathub',
      'CocoaPods',
      'Hackage',
      'opam',
      'CPAN',
      'Clojars',
      'LuaRocks',
      'Lean Reservoir',
      'Julia General',
    ],
    registries,
  };
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'registries.json');
  fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`);
  log(`wrote ${file} in ${Math.round((Date.now() - started) / 1000)}s`);
  for (const r of registries)
    log(
      `${r.id.padEnd(16)} ${r.status.padEnd(8)} ${String(r.totals.packages).padStart(5)} pkgs ${String(r.totals.downloads).padStart(12)} dl`,
    );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
