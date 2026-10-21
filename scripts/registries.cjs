// Turns docs/case-studies/issue-7/data/registries.json (written by
// experiments/collect-registries.cjs) and registries-other.json (written by
// experiments/collect-other-registries.cjs) into the compact registry cards of the
// website. Packages built from forks, mirrors, generated test repositories or
// repositories that are not shown at all (hidden organizations, empty
// repositories, broken forks) are dropped, the same way they are excluded from
// the repository counts (see scripts/repositories.cjs).
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'docs', 'case-studies', 'issue-7', 'data');
const file = path.join(dir, 'registries.json');
const otherFile = path.join(dir, 'registries-other.json');

// Registries without a public account listing, checked by a manifest scan and
// by account and name lookups.
const OTHER = {
  hackage: 'Hackage',
  opam: 'opam',
  cpan: 'CPAN',
  clojars: 'Clojars',
  luarocks: 'LuaRocks',
  lean: 'Lean Reservoir',
  julia: 'Julia General',
  cocoapods: 'CocoaPods',
  snap: 'Snap Store',
  flathub: 'Flathub',
  chocolatey: 'Chocolatey',
  winget: 'winget',
  'chrome-web-store': 'Chrome Web Store',
};

// Short card titles and the unit of each registry's download numbers.
const DISPLAY = {
  npm: ['npm', 'downloads / month'],
  crates: ['crates.io', 'downloads total'],
  nuget: ['NuGet', 'downloads total'],
  pypi: ['PyPI', 'downloads / month'],
  dockerhub: ['Docker Hub', 'pulls total'],
  'github-packages': ['GitHub Packages', 'downloads total (rounded)'],
  go: ['Go modules', null],
  nimble: ['Nimble', null],
  homebrew: ['Homebrew', null],
};

// What a reader should know about registries whose data is partial.
const PARTIAL = {
  'github-packages': 'download counts are rounded by github.com and cover public packages only',
};

// The GitHub repository a package is built from, as `owner/name` in lower case.
function sourceRepository(registry, pkg) {
  // Packages of a Homebrew tap or a Go module only link to their source on GitHub.
  const match = /github\.com\/([^/]+\/[^/#?]+)/i.exec(pkg.repository || pkg.url || '');
  if (match) return match[1].replace(/\.git$/, '').toLowerCase();
  if (registry === 'github-packages') return pkg.name.split('/').slice(0, 2).join('/').toLowerCase();
  return null;
}

function buildRegistries(kindOf, { limit = 6 } = {}) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const registries = [];
  const empty = [];
  const blocked = [];
  let dropped = 0;
  for (const r of data.registries) {
    if (r.blocker) {
      const name = (DISPLAY[r.id] || [r.name])[0];
      blocked.push({ id: r.id, name, blocker: r.blocker, note: PARTIAL[r.id] || 'partial data' });
    }
    const packages = r.packages.filter((p) => {
      const repo = sourceRepository(r.id, p);
      const kind = repo && kindOf(repo);
      const keep = !kind || kind === 'own';
      if (!keep) dropped += 1;
      return keep;
    });
    if (!packages.length) {
      empty.push(r.name);
      continue;
    }
    const [name, downloadsUnit] = DISPLAY[r.id] || [r.name, null];
    const downloads = (p) => p.downloads || 0;
    const top = [...packages]
      .sort((a, b) => downloads(b) - downloads(a) || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((p) => ({ name: p.name, downloads: p.downloads ?? null, url: p.url }));
    registries.push({
      id: r.id,
      name,
      url: r.url,
      status: r.status,
      packages: packages.length,
      downloads: downloadsUnit ? packages.reduce((sum, p) => sum + downloads(p), 0) : null,
      downloadsUnit,
      top,
    });
  }
  const other = fs.existsSync(otherFile) ? JSON.parse(fs.readFileSync(otherFile, 'utf8')).registries : {};
  const otherChecked = Object.keys(other).filter((id) => OTHER[id]);
  otherChecked.forEach((id) => {
    if (other[id].packages.length) throw new Error(`${id}: packages found, add a card to scripts/registries.cjs`);
    empty.push(OTHER[id]);
  });
  const checkedNames = new Set(otherChecked.map((id) => OTHER[id]));
  return {
    registries,
    packageRegistries: {
      collectedAt: data.collectedAt,
      checked: data.registries.length + otherChecked.length,
      empty,
      notChecked: data.notChecked.filter((name) => !checkedNames.has(name)),
      blocked,
      droppedPackages: dropped,
    },
  };
}

module.exports = { buildRegistries, sourceRepository };
