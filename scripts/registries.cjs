// Turns docs/case-studies/issue-7/data/registries.json (written by
// experiments/collect-registries.cjs) into the compact registry cards of the
// website. Packages built from client copies, mirrors or generated test
// repositories are dropped, the same way they are excluded from the
// repository counts (see scripts/repositories.cjs).
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'docs', 'case-studies', 'issue-7', 'data', 'registries.json');

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

// The GitHub repository a package is built from, as `owner/name` in lower case.
function sourceRepository(registry, pkg) {
  const match = /github\.com\/([^/]+\/[^/#?]+)/i.exec(pkg.repository || '');
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
    if (r.blocker) blocked.push({ id: r.id, name: (DISPLAY[r.id] || [r.name])[0], blocker: r.blocker });
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
  return {
    registries,
    packageRegistries: {
      collectedAt: data.collectedAt,
      checked: data.registries.length,
      empty,
      notChecked: data.notChecked,
      blocked,
      droppedPackages: dropped,
    },
  };
}

module.exports = { buildRegistries, sourceRepository };
