# Number audit (issue #47)

Request: "double check that every number on the site matches its actual source".

- Audit date: 2026-11-01. Branch: `issue-47-71b15aba521c`.
- Snapshots: `docs/case-studies/issue-33/data/*.json`, mostly collected on 2026-10-28.
- Method:
  - Every generated data file was rebuilt in memory and compared with the committed copy. The rebuild used `build({write:false})` from `scripts/build-data.cjs` and `buildIndicators({write:false})` from `scripts/build-indicators.cjs`. The files compared were `src/data/github.json`, `habr.json`, `indicators.json`, `posts.json` and `repositories.json`. All five are identical, so the site and the snapshots are in sync.
  - Each displayed value was recomputed with node from the snapshot fields. Compact formatting was checked with `Intl.NumberFormat(locale, {notation: 'compact', maximumFractionDigits: 1})`. This is the code in `src/components/format.js`, and it rounds (half-expand) rather than truncates. For example, 80,532 becomes "80.5K" and 2,658,172 becomes "2.7M".
- Status values:
  - OK: matches the source.
  - MISMATCH: differs from the source, or contradicts another number on the site.
  - UNVERIFIABLE: no machine-readable snapshot exists in the repository.
- The exclusion of `PavelChurkin/digital_twin_Earth` from source lines is intentional. It is not counted as a mismatch.

## Live check (2026-11-01, `gh api users/konard`)

| Field | Snapshot (organizations.json, 2026-10-28) | Live 2026-11-01 | Status |
|---|---|---|---|
| followers | 376 | 374 | OK (drift after the snapshot date; the site shows the snapshot date in Data sources) |
| following | 924 | 927 | OK (drift) |
| public_repos | 1,461 | 1,463 | OK (drift) |
| public_gists | 23,568 | 23,674 | OK (drift) |
| created_at | 2012-02-13 | 2012-02-13 | OK |

## 1. Key numbers (stat tiles), `src/components/StatTiles.jsx`

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| 18 Years of professional experience | StatTiles.jsx:27 | `experienceYears()` in src/data/profile.js; months of `experience` plus open-source `employment`, overlaps merged | 217 months, floor(217/12) = 18 | OK | The bio's "(18 years)" uses the same function |
| 137K GitHub contributions, 2012–2026 | StatTiles.jsx:36-38 | github.json `totals.contributions` = sum of `contributions[].total` (contributions.json) | 136,956, shown as "137K" / "137 тыс." | OK | Rounded, not truncated |
| 436 Original repositories, "146 personal + 290 in organizations" | StatTiles.jsx:42-44 | github.json `totals.ownRepositories`, `personalRepositories`, `organizationRepositories` | 436 = 146 + 290 | OK | The per-owner `owners[].repositories` also sum to 436 |
| 8 GitHub organizations | StatTiles.jsx:51 | github.json `totals.organizations` (owners other than konard with at least one shown own repository) | 8 | OK | organizations.json lists 15 memberships; 8 of them have shown repositories |
| 67 Programming languages | StatTiles.jsx:57-59 | github.json `totals.languages` = `languages.length` | 67 | OK (number) / wording | The 67 linguist languages include markup and config such as HTML, CSS, Dockerfile, Makefile, CMake, TeX, Roff, SCSS, MDX, Procfile, Jinja, Mustache and Vim Snippet. "Programming languages" overstates this; see the fixes list. |
| 23.6K Public gists | StatTiles.jsx:63 | github.json `profile.publicGists` (organizations.json `user.publicGists`) | 23,568, shown as "23.6K" / "23,6 тыс." | OK | |
| 477 Published packages | StatTiles.jsx:69 | sum of github.json `registries[].packages` | 224+36+62+5+63+82+3+2 = 477 | OK | |
| 2.7M Package downloads (crates.io + NuGet) | StatTiles.jsx:75-77 | crates `downloads` + nuget `downloads` | 637,350 + 2,020,822 = 2,658,172, shown as "2.7M" / "2,7 млн" | OK | Lifetime registries only; monthly npm and PyPI are correctly left out |
| 986 Stars on own projects | StatTiles.jsx:84 | github.json `totals.stars` | 986 = sum of `owners[].stars` | OK | |
| 376 GitHub followers, following 924 | StatTiles.jsx:90-92 | github.json `profile.followers` / `following` | 376 / 924 | OK | Live values are 374 / 927 (drift) |
| 3,134 Stack Overflow reputation, since 2011 | StatTiles.jsx:96-100 | stackoverflow-user.json `user.reputation`, `creation_date` 1302880311 | 3,134; 2011-04-15 | OK | |
| 80.5K Habr views, "4 articles by me, 9 by the Deep.Foundation team" (**) | StatTiles.jsx:105-116 | habr.json, sum of `articles[].statistics.views`; `habrAuthorship()` | 80,532, shown as "80.5K" / "80,5 тыс."; 4 + 9 = 13 | OK (snapshot) / MISMATCH (internal, live) | The tile always uses the snapshot, but the Habr section (HabrCards.jsx:35-49) replaces the same totals with live API values. After live data loads, the two places can show different totals; see the fixes list. |
| 26 Years of coding, since 2000 | StatTiles.jsx:122-124 | `now.getFullYear() - codingSince` | 2026 − 2000 = 26 | OK | |

## 2. Contributions chart and calendar

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| Peak 88,415 in 2026 | ContributionsChart.jsx:48, 81 | contributions.json `years[].total` | 88,415 (2026) | OK | |
| Yearly bar labels (compact) | ContributionsChart.jsx:131 | `years[].total` | e.g. 29,495 is "29.5K" and 88,415 is "88.4K" | OK | |
| Mix: Commits 100,102 (79%), Pull requests 14,628 (12%), Issues 11,928 (9.4%), Reviews 525 (0.4%) | ContributionsChart.jsx:58-62, 168, 176 | sums of `commits`, `pullRequests`, `issues`, `reviews` | Parts sum to 127,183; the shares are taken of 127,183 | MISMATCH (internal) | The headline total is 136,956. The 9,773 difference is 428 `repositories` contributions plus about 9,345 restricted (private) contributions; the calendar `totalContributions` includes both (experiments/collect-contributions.sh:8). The mix does not say it covers only 92.9% of the total. |
| Year tooltip "88,415 contributions" with rows that sum to 83,250 | ContributionsChart.jsx:64-74 | `years[]` | The rows miss `repositories` (101) and restricted contributions (5,064) in 2026 | MISMATCH (internal) | Also 2025: 29,495 total vs 26,433 + repos; 2024: 4,779 vs 3,582 + repos |
| Data table: Total column vs kind columns | ContributionsChart.jsx:186-201 | `years[]` | Same gap as the tooltip | MISMATCH (internal) | |
| Calendar total, last 368 days | ContributionCalendar.jsx:48 | indicators.json `contributions.calendar.totalContributions` = sum of public-profile-calendar.json `days[].count` | 102,095 (2025-10-26 .. 2026-10-28) | OK | The GraphQL calendar inside contributions.json gives 102,087 for the same window; daily counts differ by time zone (public profile vs UTC). This is a different source, not a bug. |
| 2026 calendar portion vs 2026 bar | — | public-profile-calendar.json vs contributions.json | 87,366 (calendar days of 2026 up to 2026-10-28) vs 88,415 | OK (note) | Different definitions and cut-off times; both are labelled with their own dates in Data sources |

## 3. Repositories, organizations and languages

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| Organization list "since YYYY · N repos · ★ S" | App.jsx:141-144 | github.json `owners[]` | konard 2012/146/218; deep-foundation 2020/90/412; link-foundation 2024/79/46; linksplatform 2015/76/154; link-assistant 2025/29/115; deep-assistant 2025/6/32; styleschool 2018/6/4; correlation-center 2025/2/2; OSWS 2014/2/3 | OK | Sums: 436 repositories, 986 stars |
| "All 436 original repositories" | App.jsx:154 | `totals.ownRepositories` | 436 | OK | |
| Repositories page lead: "436 original repositories in 9 accounts and organizations, with 986 stars" | pages/RepositoriesPage.jsx:17-18, 43-44 | repositories.json kind `own`; `owners.size` | 436; 9 (konard + 8); 986 | OK | |
| Repositories page kind counters | RepositoriesPage.jsx:47-56 | repositories.json `items[].kind` | own 436, mirror 88, fork 3 (527 shown) | OK | 737 collected; excluded: 41 empty, 32 hidden organization, 25 broken fork, 86 copies of non-public originals, 26 generated logs (737 − 527 = 210 = 41+32+25+86+26) |
| Per-repository "N source lines" | components/RepoList.jsx:52-58 | repositories.json `sourceLines[*].code` | Computed per repository at render | OK | |
| Languages chart: top 10 + "Other", caption "67 languages" | components/LanguagesChart.jsx:14-17 | github.json `languages[].count` | Top 10 plus the remainder summed | OK | |
| Language cloud: "All 67 languages detected by GitHub and 8 more from the skills list" | components/LanguageCloud.jsx:16-19, 27-28; App.jsx:59, 175; profile.js:61-87 | github.json `languages[].name` vs profile.js `skillGroups` languages | 8 by exact-name comparison, but 5 of them are already among the 67 under GitHub names: "Shell / Bash" (Shell), "Coq / Rocq" (Coq, Rocq Prover), "Batch" (Batchfile), "CUDA" (Cuda), "PL/pgSQL" (PLpgSQL). Truly additional: SQL, GraphQL, Assembly = 3 | MISMATCH | Five languages are drawn twice in the cloud, once as detected and once as "from the skills list" |
| Associative page: "Since 2010: 284 repositories …" | pages/AssociativePage.jsx:31, 39-40 | repositories.json own items with field `associative` | 284; the earliest is konard/LinksPlatform, created 2012-02-14 | OK | "2010" comes from experience.js:178 (start 2010-03, the pre-GitHub prototype); UNVERIFIABLE from a snapshot, but consistent across the site |

## 4. Source lines (`src/components/SourceLines.jsx`)

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| Total source lines 10,988,930 | SourceLines.jsx:14-19, 70 | indicators.json `sourceLines.languages` (from source-lines.json `repositories[].authoredLines`) | 13,224,518 − 2,235,588 (digital_twin_Earth) = 10,988,930 | OK | The exclusion is pinned in src/data/source-lines-exclusions.lino and checked by build-indicators.cjs:35 |
| Measured / authored repositories | SourceLines.jsx | `measuredRepositories`, `authoredRepositories.length` | 1,737 measured; 804 with authored lines | OK | |
| Languages table, "Other" row | SourceLines.jsx | `languages` | 93 languages, 46 with 1,000 or more lines; "Other" = 13,543 | OK | The sum of repository lines equals the language total |
| Excluded repository note | SourceLines.jsx:88-89 | `excludedRepositories[]` | PavelChurkin/digital_twin_Earth, 2,235,588 lines | OK | Intentional |

## 5. Package registries (`src/components/Registries.jsx`)

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| npm: 224 packages, 316.2K downloads / month | Registries.jsx:66-70 | registries.json npm, filtered by `kindOf` (scripts/registries.cjs:71-77) | 224 / 316,187 (raw 226 / 316,207 before 2 packages of non-own repositories were dropped) | OK | |
| crates.io: 36 packages, 637.4K total | same | crates | 36 / 637,350 | OK | |
| NuGet: 62 packages, 2M total | same | nuget | 62 / 2,020,822, shown as "2M" | OK | |
| PyPI: 5 packages, 1K / month | same | pypi | 5 / 1,046, shown as "1K"; the title attribute gives 1,046 | OK | |
| Docker Hub: 63 images, 309.3K pulls | same | dockerhub | 63 / 309,331 | OK | |
| GitHub Packages: 82 packages, 20.9K total (rounded) | same | github-packages | 82 / 20,865 | OK | |
| Go 3, Nimble 2 (no counts) | same | go, nimble | 3, 2 | OK | |
| Top package bars (compact) | Registries.jsx:42-43 | `registries[].top[]` | e.g. links-notation 78,703 is "78.7K"; command-stream 33,876 is "33.9K"; clink 128,819 is "128.8K" | OK | |
| "33 registries checked on 2026-10-28" | Registries.jsx:98-99 | `packageRegistries.checked` = 20 + 13 | 33 = 8 cards + 25 empty | OK | |
| "Nothing published on … Homebrew taps …" | Registries.jsx (empty list) | `packageRegistries.empty`, scripts/registries.cjs:78-80 | registries.json Homebrew lists svetozar-technologies/localcode; it was dropped because its repository is not "own", so the list is empty after filtering | MISMATCH (wording) | Something is published there, just not from an own repository. The "empty" list mixes "nothing found" with "only packages that are not shown"; see the fixes list. |
| CV registries line "62 пакетов", "224 пакетов", "82 пакетов", "63 пакетов" | src/cv/buildCv.js:124-135 | github.json `registries` | The numbers are correct | OK (numbers) / RU grammar | The Russian text always uses "пакетов"; it should use `plural(r.packages, 'ru', ['пакет','пакета','пакетов'])` (62 пакета, 224 пакета, 82 пакета, 63 пакета). The CV also drops "(rounded)" from the GitHub Packages unit in both languages. |

## 6. Habr (`src/components/HabrCards.jsx`, `src/data/habr.json`, collectedAt 2026-10-28)

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| "13 articles (4 by me, 9 by the team) · 80,532 views · 342 bookmarks" | HabrCards.jsx:72-81 | habr.json `articles[]`; `habrAuthorship()` | 13 = 4 + 9; views 80,532; bookmarks 342 | OK | Score 85, comments 136 |
| Company rating 43.47, 57 subscribers; @Konard karma 6 | HabrCards.jsx:63-70 | habr.json `company.rating`, `company.subscribers`, `user.karma` | 43.47 / 57 / 6 | OK | |
| Card dates "MMM YYYY" | HabrCards.jsx:20-21, 115 | `articles[].publishedAt` | match | OK | The publication dates in profile.js `publications` match the Habr snapshot |
| Footnote (**) | HabrCards.jsx:99-104; StatTiles.jsx:116, 144-155 | `HABR_NOTE_ID` | Both the tile and the section link to it | OK | |
| Live refresh vs stat tile | HabrCards.jsx:35-49 vs StatTiles.jsx:107 | Habr API vs habr.json | e.g. live 80,559 views would show 80,559 in the section but "80.5K" in the tile | MISMATCH (internal, after live load) | See the fixes list |

## 7. Community (Stack Overflow)

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| 3,134 reputation · since 2011 | Community.jsx:16, 20 | stackoverflow-user.json `user.reputation`, `creation_date` | 3,134 / 2011 | OK | |
| Badges ● 38 silver ● 28 bronze (0 gold) | Community.jsx:23-32 | `user.badge_counts` | 38 / 28 / 0 | OK | |
| Top tags | Community.jsx:9 | `top_tags`, with `docker-*` sub-tags dropped, first 8 (build-data.cjs:132-135) | c# 75, docker 44, linux 43, asp.net-core 36, javascript 34, bash 31, .net-core 29, postgresql 28 | OK | |

## 8. Hand-written numbers (`src/data/profile.js`, `positions.js`, `experience.js`, `theory.js`)

The English and Russian texts were compared in each row; both show the same numbers, so only the source is judged here.

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| "525 original open-source repositories in 15 organizations, without forks" / "525 собственных … в 15 организациях" | profile.js:346-347 (Highlights; also in the academic CV via buildCv.js:196) | github.json `totals.ownRepositories`, `totals.organizations` | 436 repositories in 8 organizations (9 accounts with konard); 15 is the number of organization memberships in organizations.json, 7 of which have no shown repositories | MISMATCH | Contradicts the stat tiles and App.jsx:154 on the same page. docs/case-studies/issue-9/README.md:183 already noted the 525 figure as stale. |
| "≈50K npm downloads / month" (links-notation) | profile.js:429-430; positions.js:63-64; experience.js:200-201 | github.json `registries[npm].top` links-notation | 78,703 / month | MISMATCH | Understated by about 37% |
| "≈31K npm downloads per month" (command-stream) | positions.js:110-111 | registries npm command-stream | 33,876 / month | MISMATCH | |
| "crates.io (35 crates)" | positions.js:280 | registries `crates.packages` | 36 | MISMATCH | |
| "35 crates on crates.io (570K+ downloads)" / "35 крейтов на crates.io (более 570 тыс. загрузок)" | positions.js:563-564 | crates `packages`, `downloads` | 36 / 637,350 | MISMATCH | "570K+" is true but stale; the Registries section shows 637.4K |
| "~1.9M NuGet downloads" of LinksPlatform libraries | profile.js:334-335; positions.js:50-51, 538-539; experience.js:195-196 | registries.json nuget, Platform.* packages | 55 Platform.* packages = 1,880,509 (about 1,882,925 with the linksplatform links2json/json2links tools), i.e. 1.9M | OK | All of NuGet is 2,020,822 (2M), which includes non-LinksPlatform packages such as clink 128,819 |
| "Stack Overflow answers on questions with 1.5M+, 660K+ and 530K+ views" | profile.js:338-339 | docs/case-studies/issue-1/data/web-research.md:165-166, 317 (~1.5M, 663K, ~530K) | — | UNVERIFIABLE | Consistent with the research notes; no JSON snapshot of question views |
| "Top 1% of developers worldwide on CodersRank; top 5 in Russia for GraphQL, Node.js and Shell" | profile.js:330-331 | web-research.md:296, 316 | — | UNVERIFIABLE | |
| "<0.1 s" (Doublets query benchmark) | profile.js:350; experience.js:117 | web-research.md:313 | — | UNVERIFIABLE | |
| "330+ packages" (Deep npm adapter) | positions.js:72; experience.js:379 | web-research.md:309 (Habr Career) | — | UNVERIFIABLE | |
| "handlers in 6 languages" | positions.js:72; experience.js:374 | the experience.js text lists JS, PHP, Python, Rust, C/C++, Kotlin | 6 | OK (internally consistent) | |
| "80+ repositories" of LinksPlatform | experience.js:190 | organizations.json linksplatform `publicRepos` 87; 76 shown own repositories | 87 public | OK | 76 own after filtering; "80+" holds for the organization's public count |
| "parsers in 6 languages" (Links Notation) | theory.js:139 | links-notation implementations: JS, Rust, Python, C#, C++, PHP | 6 | OK | |
| "team of 5" | experience.js:456-462 | none | — | UNVERIFIABLE | |
| Bio: "since 2000, professionally since 2006 (18 years)" | profile.js:28 | `yearsText()` / `experienceYears()` | 18 | OK | |
| "C# developer since 2008", "Rust developer … ${YEARS} of professional experience" | positions.js:538, 563 | experience.js periods | 2008 matches the experience entries | OK | The Rust wording ties all 18 years to the Rust profile; this is a style note, not a numeric error |
| Featured projects stars | Projects.jsx via profile.js `featuredProjects` + github.json `projects` | github.json `projects[].stars` | hive-mind 92, twittermatrix 81, LinksPlatform 62, Bot 29, ASP.NET-Core-WebSocket-Example 24, Data.Doublets 14, use-m 14, deeplinks 13, CSharpToCpp 10, link-cli 8, telegram-bot 7, problem-solving 6, links-notation 5, meta-theory 0 | OK | Computed from the snapshot, not hand-written |

## 9. Blog

| Displayed text | File:line | Source (file + field) | Recomputed value | Status | Notes |
|---|---|---|---|---|---|
| "67 posts from VK (64) and X (3) in N stories: M merged", "Archived 2026-10-28" | pages/BlogPage.jsx:194-217 | posts.json `posts.length`, `counts`, `generatedAt` | 67 = 64 + 3; `counts` equals the per-network count of `posts[]`; 2026-10-28 | OK | The story and merged counts are computed at render time from the same file |

## 10. English vs Russian

The 156 localized strings that contain digits (collected in /tmp/na-numstrings.txt) were compared pair by pair.

- Every pair shows the same numbers.
- The only language-specific issues are:
  - the Russian "N пакетов" grammar in buildCv.js:133;
  - "(rounded)" being dropped in the CV, which happens in both languages.

## Mismatches to fix

1. **Highlight "525 repositories in 15 organizations"** in src/data/profile.js:346-347.
   - Replace it with the computed values, so that it cannot go stale. This needs `import github from './github.json'` in profile.js:
     - EN: `` `${github.totals.ownRepositories} original open-source repositories in ${github.totals.organizations} organizations and the personal account, without forks or mirrors` ``
     - RU: `` `${github.totals.ownRepositories} собственных open-source-репозиториев в ${github.totals.organizations} организациях и личном аккаунте, без форков и зеркал` ``
   - With today's data these read "436 … in 8 organizations".
   - Minimal literal fix: EN `'436 original open-source repositories in 8 organizations and the personal account, without forks'`, RU `'436 собственных open-source-репозиториев в 8 организациях и личном аккаунте, без форков'`.
2. **links-notation npm downloads**: 78,703 per month, not ≈50K.
   - profile.js:429: `(≈79K npm downloads / month)`; profile.js:430: `(около 79 тыс. загрузок из npm в месяц)`.
   - positions.js:63: `≈79K npm downloads per month`; positions.js:64: `около 79 тыс. загрузок из npm в месяц`.
   - experience.js:200: `(≈79K npm downloads per month)`; experience.js:201: `(около 79 тыс. загрузок из npm в месяц)`.
   - Better: derive the figure from `github.registries.find((r) => r.id === 'npm').top.find((p) => p.name === 'links-notation').downloads`.
3. **command-stream npm downloads**: 33,876 per month, not ≈31K.
   - positions.js:110: `≈34K npm downloads per month`.
   - positions.js:111: `около 34 тыс. загрузок из npm в месяц`.
4. **Crate count and downloads** (36 crates, 637,350 downloads):
   - positions.js:280: `'crates.io (36 crates)'`.
   - positions.js:563: `36 crates on crates.io (630K+ downloads)`.
   - positions.js:564: `36 крейтов на crates.io (более 630 тыс. загрузок)`.
   - Or derive both from `github.registries.find((r) => r.id === 'crates')`.
5. **Language cloud "8 more from the skills list"**: the correct count is 3 (SQL, GraphQL, Assembly).
   - In src/components/LanguageCloud.jsx:19, compare skills against GitHub names through aliases, e.g.:
     ```js
     const ALIASES = { 'Shell / Bash': ['Shell'], 'Coq / Rocq': ['Coq', 'Rocq Prover'], Batch: ['Batchfile'], CUDA: ['Cuda'], 'PL/pgSQL': ['PLpgSQL'] };
     const others = extra.filter((name) => !detected.has(name) && !(ALIASES[name] || []).some((a) => detected.has(a)));
     ```
   - Alternatively, rename the profile.js skill items (profile.js:61, 67, 75, 85, 87) to the GitHub linguist names.
6. **Contribution mix and yearly breakdown do not add up to the totals** (127,183 of 136,956; 2026: 83,250 of 88,415).
   - Add an "Other" series to src/components/ContributionsChart.jsx:12-17. It covers created repositories plus private contributions. The `MIX` stays as is, and each year gets
     `{ key: 'other', label: { en: 'Other (new repositories, private)', ru: 'Прочее (новые репозитории, приватные)' } }`
     with `d.other = d.total - d.commits - d.pullRequests - d.issues - d.reviews`. Compute it in the `data` mapping before `mix`.
   - The mix becomes: commits 73%, PRs 10.7%, issues 8.7%, reviews 0.4%, other 7.1% of 136,956.
   - At minimum, add a caption: "breakdown of public contributions; the total also counts private ones".
7. **Habr tile vs Habr section after the live refresh.**
   - Option (a): lift the live state from HabrCards into App and pass the merged `habr` to `StatTiles` as well.
   - Option (b): label the tile with its snapshot date, e.g. hint suffix `` ` · ${habr.collectedAt.slice(0, 10)}` ``.
   - Either removes the 80.5K vs live-total disagreement (StatTiles.jsx:107, HabrCards.jsx:41).
8. **"Programming languages" tile counts markup and config languages** (StatTiles.jsx:58).
   - Either change the label to `{ en: 'Languages detected by GitHub', ru: 'Языков по данным GitHub' }`, or filter `github.languages` by linguist type `programming` when building `totals.languages` (scripts/build-data.cjs:166).
   - The number 67 itself matches its source.
9. **"Nothing published on … Homebrew taps"**: svetozar-technologies/localcode is published there, but it is not from an own repository.
   - In scripts/registries.cjs:78-80, push registries whose packages were all dropped into a separate list (e.g. `onlyOthers`) instead of `empty`.
   - Or word the line as "No packages from original repositories on …".
10. **CV Russian package plural** (src/cv/buildCv.js:133).
    - Replace `${r.packages} пакетов` with `${r.packages} ${plural(r.packages, 'ru', ['пакет', 'пакета', 'пакетов'])}`. This gives "62 пакета", "224 пакета", "82 пакета", "63 пакета".
    - Keep "(rounded)" / "(округлённо)" for GitHub Packages.

Not mismatches (for the record):
- The live GitHub profile drift since 2026-10-28.
- The digital_twin_Earth exclusion.
- Calendar (102,095) vs GraphQL calendar (102,087): different time zones and sources.
- Items listed as UNVERIFIABLE in section 8, which match docs/case-studies/issue-1/data/web-research.md but have no JSON snapshot.
