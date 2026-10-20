#!/usr/bin/env node
// Second pass for issue #7 ("check also other package managers/registries ...
// double check we collect the full spectrum"): the registries that
// collect-registries.cjs did not query. For each of them:
//   1. Manifest scan: walk the git tree of every repository in
//      repositories.json and list the files a package for that registry needs
//      (*.cabal, *.opam, *.rockspec, lakefile.lean, snapcraft.yaml, ...).
//   2. Account / name lookup: query the registry for the owner accounts and for
//      every name declared in a found manifest, where a public API exists.
// Writes docs/case-studies/issue-7/data/registries-other.json.
//
// Usage: node experiments/collect-other-registries.cjs [output-dir]
// Requires Node 22+ (global fetch) and an authenticated `gh` CLI.
'use strict';
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || 'docs/case-studies/issue-7/data';
const UA = 'konard.github.io data collector (https://github.com/konard/konard.github.io)';
const repos = JSON.parse(fs.readFileSync(path.join(OUT, 'repositories.json'), 'utf8'));
const OWNERS = [...new Set(repos.map((r) => r.owner))];
const log = (...args) => console.error(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function request(url, { as = 'json', headers = {} } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, ...headers },
        signal: AbortSignal.timeout(30000),
        redirect: 'follow',
      });
      const text = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(3000 * attempt);
        continue;
      }
      let data = text;
      if (as === 'json') {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      return { url, status: res.status, ok: res.ok, data };
    } catch (error) {
      if (attempt >= 3) return { url, status: 0, ok: false, data: null, error: String(error.message || error) };
      await sleep(3000 * attempt);
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

// The file every registry needs to publish a package.
const RULES = {
  hackage: (p) => /\.cabal$/.test(p),
  opam: (p) => /(^|\/)(opam|[^/]+\.opam)$/.test(p),
  cpan: (p) => /(^|\/)(Makefile\.PL|Build\.PL|dist\.ini|META\.json)$/.test(p),
  clojars: (p) => /(^|\/)(project\.clj|deps\.edn)$/.test(p),
  luarocks: (p) => /\.rockspec$/.test(p),
  lean: (p) => /(^|\/)lakefile\.(lean|toml)$/.test(p),
  julia: (p) => /(^|\/)(Julia)?Project\.toml$/.test(p),
  cocoapods: (p) => /\.podspec(\.json)?$/.test(p),
  snap: (p) => /(^|\/)snapcraft\.yaml$/.test(p),
  flathub: (p) => /(^|\/)[a-z]+\.[\w-]+\.[\w.-]+\.(ya?ml|json)$/i.test(p) && /flatpak|flathub/i.test(p),
  chocolatey: (p) => /(^|\/)tools\/chocolatey(install|uninstall)\.ps1$/i.test(p),
  winget: (p) => /(^|\/)manifests\/.+\.(installer|locale\.[\w-]+)\.yaml$/i.test(p),
  'chrome-web-store': (p) => /(^|\/)manifest\.json$/.test(p),
};
const SKIP_DIR = /(^|\/)(node_modules|vendor|third[_-]?party|\.git|dist|build|out|target|bower_components)\//i;

async function scan() {
  const found = Object.fromEntries(Object.keys(RULES).map((k) => [k, []]));
  const errors = [];
  let truncated = 0;
  await pool(repos, 8, async (repo) => {
    const res = await gh(['api', `repos/${repo.fullName}/git/trees/HEAD?recursive=1`]);
    if (!res.ok || !Array.isArray(res.data?.tree)) {
      if (!/409|empty/i.test(res.error || '')) errors.push({ repo: repo.fullName, error: res.error || 'no tree' });
      return;
    }
    if (res.data.truncated) truncated++;
    for (const t of res.data.tree) {
      if (t.type !== 'blob' || SKIP_DIR.test(t.path)) continue;
      for (const [kind, test] of Object.entries(RULES))
        if (test(t.path)) found[kind].push(`${repo.fullName}/${t.path}`);
    }
  });
  return { found, errors, truncated };
}

const rawText = async (file) => {
  const [owner, name, ...rest] = file.split('/');
  const res = await request(`https://raw.githubusercontent.com/${owner}/${name}/HEAD/${rest.join('/')}`, {
    as: 'text',
  });
  return res.ok ? res.data : '';
};

// Chrome extensions: manifest.json is also used by web app manifests, so only
// files with "manifest_version" are extensions.
async function chromeExtensions(files) {
  const out = [];
  await pool(files, 8, async (file) => {
    const text = await rawText(file);
    if (/"manifest_version"\s*:/.test(text)) out.push(file);
  });
  return out;
}

const NAME_PATTERNS = {
  hackage: /^name:\s*([\w-]+)/im,
  luarocks: /^package\s*=\s*["']([^"']+)["']/m,
  julia: /^name\s*=\s*"([^"]+)"/m,
  lean: /(?:^package\s+[«"]?([\w-]+)|^name\s*=\s*"([^"]+)")/m,
};

async function declaredNames(kind, files) {
  const names = [];
  await pool(files, 8, async (file) => {
    const text = await rawText(file);
    const m = text.match(NAME_PATTERNS[kind]);
    if (m) names.push({ file, name: m[1] || m[2] });
  });
  return names;
}

async function main() {
  log(`scanning ${repos.length} repositories of ${OWNERS.length} owners`);
  const { found, errors, truncated } = await scan();
  log(
    Object.entries(found)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(' '),
  );
  found['chrome-web-store'] = await chromeExtensions(found['chrome-web-store']);

  const results = {};
  const lookups = [];
  const check = async (kind, label, url, isHit, opts) => {
    const res = await request(url, opts);
    const hit = res.ok && isHit(res.data);
    lookups.push({ registry: kind, query: label, url, status: res.status, hit });
    return hit;
  };

  // Account based lookups, where the registry has a public per-user page or API.
  const accounts = ['konard', 'drakonard', ...OWNERS.filter((o) => o !== 'konard')];
  await pool(accounts, 4, async (a) => {
    await check('hackage', a, `https://hackage.haskell.org/user/${a}`, () => true, { as: 'text' });
    await check(
      'cpan',
      a,
      `https://fastapi.metacpan.org/v1/release/_search?q=author:${a.toUpperCase().replace(/-/g, '')}&size=1`,
      (d) => d?.hits?.total > 0,
    );
    await check('luarocks', a, `https://luarocks.org/modules/${a}`, () => true, { as: 'text' });
    await check('clojars', a, `https://clojars.org/api/users/${a}`, (d) => d?.groups?.length > 0);
    await check('chocolatey', a, `https://community.chocolatey.org/profiles/${a}`, () => true, { as: 'text' });
    await check('lean', a, `https://reservoir.lean-lang.org/@${a}`, (d) => /href="\/@[^"]+\/[^"]+"/.test(d), {
      as: 'text',
    });
  });

  // Name based lookups for every package name declared in a manifest.
  for (const kind of ['hackage', 'luarocks', 'julia', 'lean']) {
    const names = await declaredNames(kind, found[kind]);
    await pool(names, 4, async ({ name, file }) => {
      const urls = {
        hackage: `https://hackage.haskell.org/package/${name}`,
        luarocks: `https://luarocks.org/m/root/${name}`,
        julia: `https://raw.githubusercontent.com/JuliaRegistries/General/master/${name[0].toUpperCase()}/${name}/Package.toml`,
        lean: `https://reservoir.lean-lang.org/@${file.split('/')[0]}/${file.split('/')[1]}`,
      };
      const ownerRe = new RegExp(`github\\.com[/:](${OWNERS.join('|')})/`, 'i');
      await check(kind, `${name} (${file})`, urls[kind], (d) => kind === 'lean' || ownerRe.test(d || ''), {
        as: 'text',
      });
    });
  }

  // Snaps: the name declared in snapcraft.yaml.
  await pool(found.snap, 4, async (file) => {
    const name = (await rawText(file)).match(/^name:\s*([\w-]+)/m)?.[1];
    if (!name) return;
    await check('snap', `${name} (${file})`, `https://api.snapcraft.io/v2/snaps/info/${name}`, () => true, {
      headers: { 'Snap-Device-Series': '16' },
    });
  });

  // Browser extensions: the Chrome Web Store and Firefox Add-ons have no public
  // search API, so a published extension is detected by a store link in the
  // repository README.
  const extensionRepos = [...new Set(found['chrome-web-store'].map((f) => f.split('/').slice(0, 2).join('/')))];
  await pool(extensionRepos, 4, async (repo) => {
    const readme = await gh(['api', `repos/${repo}/readme`, '-H', 'Accept: application/vnd.github.raw']);
    const link = String(readme.data || '').match(
      /https?:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore|addons\.mozilla\.org)[^\s)"']*/,
    );
    lookups.push({ registry: 'chrome-web-store', query: `store link in ${repo} README`, hit: !!link, link: link?.[0] });
  });

  // Store manifests: packages are listed in public repositories of the stores.
  for (const [kind, repo, q] of [
    ['winget', 'microsoft/winget-pkgs', 'konard'],
    ['winget', 'microsoft/winget-pkgs', 'linksplatform'],
    ['flathub', 'flathub', 'konard'],
    ['cocoapods', 'CocoaPods/Specs', 'konard'],
  ]) {
    const scope = repo.includes('/') ? `repo:${repo}` : `org:${repo}`;
    const res = await gh(['api', '-X', 'GET', 'search/code', '-f', `q=${q} ${scope}`, '--jq', '.total_count']);
    lookups.push({
      registry: kind,
      query: `GitHub code search "${q} ${scope}"`,
      hit: Number(res.data) > 0,
      count: res.data,
    });
    await sleep(7000); // code search allows 10 requests per minute
  }

  for (const kind of Object.keys(RULES)) {
    const mine = lookups.filter((l) => l.registry === kind);
    results[kind] = {
      manifests: found[kind],
      lookups: mine.length,
      packages: mine.filter((l) => l.hit).map((l) => l.query),
    };
  }
  const output = {
    collectedAt: new Date().toISOString(),
    generator: 'experiments/collect-other-registries.cjs',
    repositories: repos.length,
    truncatedTrees: truncated,
    treeErrors: errors,
    registries: results,
    lookups,
  };
  const file = path.join(OUT, 'registries-other.json');
  fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`);
  for (const [k, v] of Object.entries(results))
    log(
      `${k.padEnd(17)} manifests ${String(v.manifests.length).padStart(3)}  lookups ${v.lookups}  hits ${v.packages.length}`,
    );
  log(`wrote ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
