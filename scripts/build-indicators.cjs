// Build website indicators exclusively from the preserved public snapshots.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs/case-studies/issue-33/data');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
// Repositories whose attributed lines are mostly third-party code committed in bulk. The list is
// kept as indented Links Notation (issue #47) and every entry pins the measured revision and count.
function readExclusions() {
  const { parseIndented } = require('lino-objects-codec');
  const text = fs.readFileSync(path.join(root, 'src/data/source-lines-exclusions.lino'), 'utf8');
  return parseIndented({ text }).obj;
}
function buildIndicators({ write = true } = {}) {
  const source = read('source-lines');
  const contributions = read('contributions');
  const profile = read('public-profile-calendar');
  const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  const weeks = [];
  for (const d of profile.days) {
    const weekday = new Date(d.date).getUTCDay();
    if (!weeks.length || weekday === 0) weeks.push({ firstDay: d.date, contributionDays: [] });
    weeks
      .at(-1)
      .contributionDays.push({ date: d.date, weekday, contributionCount: d.count, contributionLevel: levels[d.level] });
  }
  const languages = {};
  const authoredRepositories = [];
  const excludedRepositories = [];
  const exclusions = readExclusions();
  for (const [fullName, repo] of Object.entries(source.repositories)) {
    const excluded = exclusions[fullName];
    if (excluded) {
      const lines = Object.values(repo.authoredLines).reduce((sum, n) => sum + n, 0);
      if (excluded.sha !== repo.sha || excluded.lines !== lines)
        throw new Error(
          `Exclusion of ${fullName} pins ${excluded.sha} / ${excluded.lines}, measured ${repo.sha} / ${lines}`,
        );
      excludedRepositories.push({ fullName, sha: repo.sha, lines, reason: excluded.reason });
      continue;
    }
    let lines = 0;
    for (const [language, count] of Object.entries(repo.authoredLines)) {
      languages[language] = (languages[language] || 0) + count;
      lines += count;
    }
    if (lines) authoredRepositories.push({ fullName, sha: repo.sha, lines });
  }
  const record = (en, ru, effectiveAt, url) => ({ label: { en, ru }, effectiveAt, url });
  const result = {
    contributions: {
      collectedAt: profile.collectedAt,
      calendar: { totalContributions: profile.days.reduce((sum, d) => sum + d.count, 0), weeks },
    },
    sourceLines: {
      collectedAt: source.collectedAt,
      languages,
      measuredRepositories: Object.keys(source.repositories).length,
      authoredRepositories: authoredRepositories.sort(
        (a, b) => b.lines - a.lines || a.fullName.localeCompare(b.fullName),
      ),
      excludedRepositories,
    },
    sources: {
      github: record(
        'GitHub profile, repositories and organizations',
        'Профиль, репозитории и организации GitHub',
        read('organizations').collectedAt,
        'https://github.com/konard',
      ),
      contributions: record(
        'GitHub daily calendar',
        'Ежедневный календарь GitHub',
        profile.collectedAt,
        'https://github.com/konard?tab=overview',
      ),
      contributionHistory: record(
        'Annual GitHub contribution history',
        'История вклада GitHub по годам',
        contributions.collectedAt,
        'https://github.com/konard?tab=overview',
      ),
      sourceLines: record(
        'Public source-line measurements',
        'Измерения строк публичного кода',
        source.collectedAt,
        'https://github.com/konard/konard.github.io/tree/main/docs/case-studies/issue-33',
      ),
      registries: record(
        'Package registries',
        'Реестры пакетов',
        read('registries').collectedAt,
        'https://github.com/konard/konard.github.io/tree/main/docs/case-studies/issue-33/data',
      ),
      otherRegistries: record(
        'Other registry checks',
        'Проверки остальных реестров',
        read('registries-other').collectedAt,
        'https://github.com/konard/konard.github.io/tree/main/docs/case-studies/issue-33/data',
      ),
      stackoverflow: record(
        'Stack Overflow',
        'Stack Overflow',
        read('stackoverflow-user').fetched,
        'https://stackoverflow.com/users/710069/konard',
      ),
      habr: record('Habr fallback', 'Снимок Хабра', read('habr').collectedAt, 'https://habr.com/ru/users/konard/'),
      social: record('Social archive fallback', 'Архив социальных сетей', read('posts').generatedAt, '/blog/'),
    },
  };
  if (write) require('./lino-data.cjs').writeLino(path.join(root, 'src/data/indicators.lino'), result);
  return result;
}
module.exports = { buildIndicators };
