# Case study: issue #7 — repositories by field, roles, research, blog archive and links visuals

- Issue: https://github.com/konard/konard.github.io/issues/7
- Pull request: https://github.com/konard/konard.github.io/pull/8
- Builds on: [issue #1](../issue-1/README.md) (the first version of the site)
- Data snapshot dates: 2026-10-19 (GitHub, registries, Habr), 2026-10-20 (blog archive and media)

## 1. The issue

> May be we should have not only single page, but separate page for all repositories which I worked on, and summary
> on how it can be useful in different fields.
>
> We should also make categories with best repository examples for MLops, DevOPs, ML/AI, and other categories of IT
> professions where I can be useful.
>
> As per https://github.com/konard/linksplatform the Links Platform development was started from around 2010, so that
> must be corrected.
>
> `1,460 Public repositories` — There is no need to highlight any forks, only repositories that were created by me,
> or by organizations I was working in.
>
> `npm · crates.io · NuGet` we should check also other package managers/registries. So data can be collected more
> accurately, and we should double check we collect the full spectrum.
>
> Also I used much more languages.
>
> We also missing timeline for Deep.GPT project, that was developed at https://github.com/deep-assistant, where we had
> a chat bot with multiple functions like question answering, music generation, image generation and so on.
>
> We should make more focus on github.com/link-foundation/meta-theory
>
> Add nice cards about articles of Deep.Foundation at habr, as most of them were done with my participation. So we
> have visual floating cards with articles, where it is dymically if possible loaded number of views, karma, boomarks
> and so on.
>
> I also need a page for my blog, where we put deduplicate feed of my X, Telegram, VK public channels/walls. So we do
> nice embeddings of posts from there, and if we have multiple posts similar to each other at the same time, we should
> show x version if it is in English, and user's language is English. And VK version if user's language is Russian.
> And so on.
>
> We also should be able to archive all these public posts with every formatting details, so if they get deleted at
> X, Telegram, VK, we still can show them without embeddings.
>
> We need also to expand on languages and technologies that I have used.
>
> We also need to have page where we can show only my ML/AI experience, DevOps experience, CEO/Team-lead experience,
> Software Developer experience and so on, so it will be easy to show only relevant experience.
>
> Universal problem solving algorithm and Meta links theory should have more attention, we should also use the image
> of it. For example — (an image of the algorithm), or SVG version of it.
>
> And we may use our links-visuals repository to make the style of the page much more tailored to what I do. For
> example we can combine visuals from github.com/konard/links-visuals, to generate small SVG like simbols of all
> possible links configurations of 1-4 links, and do random matrix rain of them, all configurations must be done in
> the same size […]
>
> So we have a universe image (may be simulated with high definition like gas or star cloud or something), after that
> grid, and on top of these 2 layers we should show a rain of symbols produced only from links, and on top of that we
> draw all our other infographics. That should be done in the best possible quality so it will look inspiring. For
> matrix data rain see — https://github.com/konard/twittermatrix
>
> Also we should have separate page for associative stack i'm developing, and other art projects that yet to fit
> categories.
>
> I also have repositories like tsp и p-vs-np and the same for physics, so that can be useful for researcher, data
> scientist work may include work with data collection from laws from countries and so on.
>
> We need to collect data related about the issue to this repository, make sure we compile that data to
> `./docs/case-studies/issue-{id}` folder, and use it to do deep case study analysis (also make sure to search online
> for additional facts and data), list of each and all requirements from the issue, and propose possible solutions and
> solution plans for each requirement (we should also check known existing components/libraries […]).
>
> Please plan and execute everything in this single pull request […]

The issue has no comments. One pull request comment asked to recover the interrupted work from the previous session
log and to "double check we deliver exactly all requirements". Section 4 does that check, one requirement at a time.

## 2. Folder contents

| Path | What it is |
| --- | --- |
| [`data/repositories.json`](data/repositories.json) | All 735 non-fork repositories of `konard` and the 15 organizations: description, topics, languages (by bytes), stars, dates, and `copyOf` for client copies and mirrors. Collected by [`experiments/collect-repositories.cjs`](../../../experiments/collect-repositories.cjs). |
| [`data/organizations.json`](data/organizations.json) | The profile (1,461 `public_repos`, forks included) and every organization `konard` is a member of or committed to. Collected by [`experiments/collect-organizations.cjs`](../../../experiments/collect-organizations.cjs). |
| [`data/registries.json`](data/registries.json) | Packages per registry: npm, crates.io, NuGet, PyPI, Docker Hub, GitHub Packages, Go modules, Nimble, Homebrew and 11 registries with no packages. Collected by [`experiments/collect-registries.cjs`](../../../experiments/collect-registries.cjs). |
| [`data/registries-other.json`](data/registries-other.json) | The 13 registries with no public owner search: manifest scan of every repository and account/name lookups. Collected by [`experiments/collect-other-registries.cjs`](../../../experiments/collect-other-registries.cjs). |
| [`data/habr.json`](data/habr.json) | 13 Habr articles of the Deep.Foundation company blog and of the user `Konard`, with views, score, votes, bookmarks and comments (Habr `kek/v2` API). Collected by [`experiments/collect-habr.cjs`](../../../experiments/collect-habr.cjs). |
| [`data/posts.json`](data/posts.json) | The blog archive: 63 posts (VK 60, X 3) with sanitized HTML, links, media and archived picture files. Made by [`experiments/archive-posts.cjs`](../../../experiments/archive-posts.cjs). |
| [`data/post-urls.txt`](data/post-urls.txt) | Post URLs that cannot be discovered without a login (X tweets). |
| [`data/social-probe.md`](data/social-probe.md) | What X, Telegram and VK return without credentials, with the exact requests. |
| [`data/linksplatform-history.md`](data/linksplatform-history.md) | Evidence for the 2010 start of LinksPlatform. |
| [`data/deep-gpt.md`](data/deep-gpt.md) | Evidence for the Deep.GPT timeline entry. |
| [`screenshots/`](screenshots) | Screenshots of every page of the built site (1440 px wide). |

The site data is built from these files by [`scripts/build-data.cjs`](../../../scripts/build-data.cjs)
(`npm run build:data`), [`scripts/repositories.cjs`](../../../scripts/repositories.cjs),
[`scripts/registries.cjs`](../../../scripts/registries.cjs) and [`scripts/build-glyphs.mjs`](../../../scripts/build-glyphs.mjs).
Tests check that the committed `src/data/github.json` and `src/data/repositories.json` match the scripts' output.

## 3. Key facts found

| Area | Facts |
| --- | --- |
| Repositories | `public_repos` is 1,461, but it counts forks, client copies and mirrors. Of 735 non-fork repositories, 525 are original: 184 personal and 341 in 15 organizations (deep-foundation 101, link-foundation 80, linksplatform 79, link-assistant 29, meteor-shuttler 15, Svetozar-Technologies 9, deep-assistant 6, styleschool 6, OSWS 5, correlation-center 3, open-online-tools 3, Qvinciy 2, links-games 1, Gls-full 1, EfficiencyParadigm 1). Excluded: 89 client copies, 96 mirrors, 25 tests and placeholders. The site no longer shows 1,460. |
| Languages | 73 languages by bytes across the original repositories (21 primary languages before). 130 skills and technologies in 10 groups (81 before). |
| Stars, contributions | 993 stars on original repositories; 132,002 contributions (2012–2026). |
| Packages | 33 registries checked. With packages: npm 222, crates.io 35, NuGet 62, PyPI 5, Docker Hub 63, GitHub Packages 103, Go 3, Nimble 2, Homebrew 1. Empty: RubyGems, Packagist, JSR, VS Marketplace, Open VSX, Maven Central, pub.dev, Hex, Anaconda, AUR, Swift Package Index, Hackage, opam, CPAN, Clojars, LuaRocks, Lean Reservoir, Julia General, CocoaPods, Snap Store, Flathub, Chocolatey, winget, Chrome Web Store. 21 packages published from client copies are not counted. |
| LinksPlatform | The `archive` branch of konard/linksplatform holds materials from 28.03.2010–04.11.2010 (Link.cs with Source/Linker/Target). The timeline now starts in `2010-03`; the GitHub repository itself dates from 2012-02-14. |
| Deep.GPT | `deep-assistant/telegram-bot` was created on 2024-05-18 (konard: 88 of about 384 commits). It has question answering (`bot/gpt`), image generation and editing (`bot/images`, `bot/image_editing`), music generation via Suno (`bot/suno`), payments and referrals, plus an OpenAI-compatible API gateway. |
| Habr | 13 articles (Deep.Foundation blog and the user Konard). The browser refreshes their statistics live, because `habr.com/kek/v2` answers with `Access-Control-Allow-Origin: *`. |
| Blog | VK `vk.com/konard`: 60 own posts (2025-10-21 to 2026-10-05). X `@drakonard`: 3 tweets (2020–2025). Telegram `t.me/drakonard` is a personal account, not a channel, so there is no public feed. The 63 posts merge into 51 stories. |
| Link configurations | 1, 10, 129 and 2,836 configurations of 1–4 doublet links up to renaming: 2,976 symbols, OEIS [A054050](https://oeis.org/A054050). |

## 4. Requirements, solutions and evidence

| # | Requirement | Solution | Evidence | Status |
| --- | --- | --- | --- | --- |
| R1 | A separate page for all repositories with a summary of how they are useful in each field. | `/repositories/`: 18 field cards with summaries ([`src/data/fields.js`](../../../src/data/fields.js)); a searchable catalog filtered by field, kept in the query string (`?field=ml&q=…`). Fields are assigned from keywords, topics, languages and owners. | [`RepositoriesPage.jsx`](../../../src/pages/RepositoriesPage.jsx), [`scripts/repositories.cjs`](../../../scripts/repositories.cjs); tests in `pages.test.jsx` (RepositoriesPage) and `data.test.js` (fields). Screenshots `repositories.png`, `repositories-ml.png`. | Done |
| R2 | Categories with the best repository examples for MLOps, DevOps, ML/AI and other IT professions. | 13 professions with 7–10 hand-picked repositories each: MLOps & AI platform, DevOps & SRE, ML / AI, data engineer & DBA, backend, frontend & mobile, systems & performance, compiler & language, QA, bots, researcher, CEO/CTO/team lead, FinTech. | `professions` in `fields.js`; a test checks that every example is an existing original repository. | Done |
| R3 | LinksPlatform started around 2010. | The timeline entry starts in `2010-03`, based on the archive branch. | [`data/linksplatform-history.md`](data/linksplatform-history.md), `profile.js`. | Done |
| R4 | Do not show "1,460 public repositories"; no forks, only original repositories of konard and of the organizations. | The stat tile shows 525 original repositories (184 + 341 in 15 organizations). Forks are never collected; client copies, mirrors and noise are classified by `kindOf` and left out of the counts. | `scripts/repositories.cjs`; tests "forks are never collected and copies are classified" and "own repositories match the original repository total". | Done |
| R5 | Check registries beyond npm, crates.io and NuGet, collect accurately, the full spectrum. | 20 registries are queried by owner or account, and 13 more by a manifest scan of all 735 repositories plus account and name lookups. Every registry is either shown as a card or listed as checked and empty; none is left unchecked. | `registries.json`, `registries-other.json`, [`Registries.jsx`](../../../src/components/Registries.jsx); `data.test.js` (registries). Screenshot `home-packages.png`. | Done; GitHub Packages download counts are approximate, see section 6 |
| R6, R12 | Many more languages and technologies. | A language cloud of the 73 languages measured by bytes plus the languages from the skills list that GitHub does not detect (SQL, GraphQL, CUDA, PL/pgSQL, …), and 130 skills in 10 groups (81 before). | [`LanguageCloud.jsx`](../../../src/components/LanguageCloud.jsx), `profile.js`, `build-data.cjs`. | Done |
| R7 | A Deep.GPT timeline entry. | "Deep.GPT (Deep.Assistant)", 2024-05 to now: question answering, image and music generation, the API gateway and GPTutor. | [`data/deep-gpt.md`](data/deep-gpt.md), `profile.js`. | Done |
| R8 | More focus on link-foundation/meta-theory. | A meta-theory section on the home page (the formulas, L → L², the PDFs) and a detailed version at the top of `/research/`. | [`MetaTheory.jsx`](../../../src/components/MetaTheory.jsx), [`theory.js`](../../../src/data/theory.js); screenshots `home-theory.png`, `research.png`. | Done |
| R9 | Floating cards of the Deep.Foundation Habr articles with live views, karma and bookmarks. | Floating cards (CSS animation, off when reduced motion is preferred). They render the committed snapshot first, then the browser refreshes views, score, votes, bookmarks and comments from the Habr API. | [`HabrCards.jsx`](../../../src/components/HabrCards.jsx), [`habrLive.js`](../../../src/data/habrLive.js); `visuals.test.jsx`. Screenshot `home-habr.png`. | Done |
| R10 | A blog page with a deduplicated feed of X, Telegram and VK, with embeds; for similar posts, X for English readers and VK for Russian readers. | `/blog/`: posts are grouped into stories by time and text similarity. `pick()` chooses the X version in English for English readers and the VK version in Russian for Russian readers; the language comes from `navigator.language` or `?lang=`. The official X embed loads on demand. | [`feed.js`](../../../src/pages/feed.js), [`BlogPage.jsx`](../../../src/pages/BlogPage.jsx); `feed.test.js` and `pages.test.jsx` (BlogPage). Screenshots `blog-en.png`, `blog-ru.png`. | Done for X and VK; Telegram has no public channel |
| R11 | Archive the posts with every formatting detail, so they can be shown without embeds after deletion. | `experiments/archive-posts.cjs` stores sanitized HTML (paragraphs, line breaks, bold, italic, links, hashtags, mentions), links, reposts and media. Pictures and video posters are saved to `public/archive/media/<post>-<n>.<ext>` under stable names, and the page shows those copies first. | `posts.json`, `public/archive/media/`; tests "keeps a copy of every picture" and "shows the archived copies of pictures, not the CDN links". | Done; 2 VK pictures could not be downloaded |
| R13 | An experience page filtered by ML/AI, DevOps, CEO/Team lead, Developer and so on. | `/experience/?role=ml\|devops\|lead\|developer\|research`. Every position is tagged with roles; the role switches without a reload. | [`ExperiencePage.jsx`](../../../src/pages/ExperiencePage.jsx), `roles` in `profile.js`; a test per role. Screenshots `experience-ml.png`, `experience-devops.png`, `experience-lead.png`. | Done |
| R14 | More attention to the universal problem solving algorithm and the meta links theory, with the image or an SVG version. | An SVG redraw of the algorithm image ([`ProblemSolvingDiagram.jsx`](../../../src/components/ProblemSolvingDiagram.jsx)) on the home page and on `/research/`, with a link to the original image and the step list. | Screenshot `home-method.png`; `visuals.test.jsx`. | Done |
| R15, R16 | links-visuals symbols of every configuration of 1–4 links, all the same size, falling as matrix rain like twittermatrix; layers: universe (nebula), grid, rain, infographics; best quality. | The 2,976 configurations are enumerated in [`configurations.js`](../../../src/links/configurations.js) and drawn in one 100×100 box ([`glyph.js`](../../../src/links/glyph.js)). The layers are: a WebGL domain-warped fBm nebula with stars ([`nebula.js`](../../../src/visuals/nebula.js)), a CSS grid, the canvas rain ([`rain.js`](../../../src/visuals/rain.js)), then the content. The rain scales with device pixels and stops for reduced motion. `/art/` shows every symbol. | `links.test.js` (counts, sizes), `visuals.test.jsx`, `pages.test.jsx` (gallery). Screenshots `home.png`, `art-symbols.png`. | Done |
| R17 | Separate pages for the associative stack and for art and other projects. | `/associative/`: the stack from the theory up to AI, with repositories per layer. `/art/`: art projects, the symbol gallery and the uncategorized repositories. | [`AssociativePage.jsx`](../../../src/pages/AssociativePage.jsx), [`ArtPage.jsx`](../../../src/pages/ArtPage.jsx); tests. Screenshots `associative*.png`, `art*.png`. | Done |
| R18 | Research repositories (tsp, p-vs-np, physics) and data-science work such as collecting laws of countries. | `/research/`: highlights (computational complexity, physics & nature, mathematics & logic, inference & AI) and a "Data science: laws" section with the law-collection repositories. | [`ResearchPage.jsx`](../../../src/pages/ResearchPage.jsx); test. Screenshots `research-highlights.png`, `research-laws.png`. | Done |
| R19 | Collect the data into `docs/case-studies/issue-7`, analyse it, research online, list the requirements, plan solutions, survey existing libraries. | This folder and this README (sections 3–7). | — | Done |
| R20 | Everything in a single pull request. | Pull request #8. | — | Done |

## 5. Root causes of the problems the issue points at

- **"1,460 public repositories"**: the number came from the profile's `public_repos`, which counts forks, and the
  personal account also holds copies of client repositories and mirrors of organization repositories. The fix
  collects non-fork repositories of every owner and classifies each one (`own`, `client`, `mirror`, `noise`).
- **The LinksPlatform start date**: the first version took the GitHub repository date (2012). The 2010 materials live
  only in the `archive` branch, added in 2025.
- **Too few languages**: only the primary language of each repository was counted, and only for 5 owners. Using the
  per-repository `languages` API (bytes) for 16 owners raises the count from 21 to 73.
- **Too few registries**: only three registries had collectors. The registries without a public owner search need a
  manifest scan (for example, a `*.cabal` file means a Hackage package is possible) followed by a lookup.
- **Archived posts losing pictures**: VK signs image URLs on every page fetch, and the links stop working within about
  a day, so an archive of URLs alone is not enough. The archive now keeps the files.

## 6. Limits and blocked items

| Item | Why | What would unblock it |
| --- | --- | --- |
| GitHub Packages download counts and versions | The `gh` token lacks the `read:packages` scope, so counts are scraped from github.com and rounded. | `gh auth refresh -s read:packages`, then rerun `experiments/collect-registries.cjs`. |
| X timeline discovery | The timeline needs a login; syndication returns an empty timeline. | Add tweet URLs to `data/post-urls.txt`, then rerun the archiver. |
| Telegram feed | `t.me/drakonard` is a personal account; no public channel owned by konard was found. | Once a public channel exists, `t.me/s/<channel>` can be archived and shown with the post widget. |
| VK embeds | `VK.Widgets.Post` needs a per-post `hash`, which is only issued to logged-in users, so VK posts are shown from the archive. | Hashes from the VK Share dialog. |
| 2 VK pictures (`vk:3972090_31590`, `vk:3972090_31579`) | The CDN returns 404 for them even on the live page. They are marked with `fileError`; the page tries the CDN link and shows "Picture no longer available" when it fails. | Nothing until VK serves them again. |

## 7. Online research and existing components

| Component | Used? | Notes |
| --- | --- | --- |
| [konard/links-visuals](https://github.com/konard/links-visuals) | Style source | The dot, bar, arrow and petal notation of links is redrawn in `glyph.js` with one shared view box. |
| [konard/twittermatrix](https://github.com/konard/twittermatrix) | Algorithm source | One symbol per column per step and fading trails. Unlike the original, the canvas fades with `destination-out`, so the nebula and grid show through. |
| OEIS [A054050](https://oeis.org/A054050) | Verification | 1, 10, 129, 2836: the enumeration test matches it. |
| Habr `kek/v2` API | Used | Public and CORS-enabled; the statistics are refreshed in the browser. |
| X embed iframe (`platform.twitter.com/embed/Tweet.html`) | Used | Loaded only on click, so no third-party script runs on page load. |
| [react-tweet](https://vercel.com/blog/introducing-react-tweet) (Vercel) | Considered | About 16 KB against about 560 KB for the native embed, but it relies on the unofficial syndication endpoint ([Stefan Judis](https://www.stefanjudis.com/blog/how-to-prerender-tweets-without-using-the-official-twitter-apis/)). The archive already renders tweets statically, so it was not needed. |
| [Telegram post widget](https://core.telegram.org/widgets/post) | Planned | `telegram-widget.js` with `data-telegram-post="channel/id"`. It works for public channels only, and the script must be created from JS when inserted dynamically. |
| `VK.Widgets.Post` ([Yandex Turbo docs](https://tech.yandex.com/dev/turbo/doc/rss/elements/vk.html), [amp-vk](https://amp.dev/documentation/components/amp-vk/)) | Blocked | Needs `owner_id`, `post_id` and a `hash`. |
| WebGL fractal noise (fBm) with domain warping | Used | The nebula shader; it renders at reduced resolution with a CSS gradient fallback. |
| Registry APIs (npm, crates.io, NuGet, PyPI, Docker Hub, Go proxy, Hackage, MetaCPAN, LuaRocks, Clojars, Chocolatey, Lean Reservoir, Snap Store, …) | Used | Each endpoint was checked against a known publisher first (for example DuncanCoutts on Hackage, SRI on CPAN, mathlib on Reservoir), so an empty answer means no packages rather than a broken query. |

## 8. Screenshots

| Page | Screenshot |
| --- | --- |
| Home: universe, grid, rain | ![home](screenshots/home.png) |
| Meta-theory | ![theory](screenshots/home-theory.png) |
| Problem solving algorithm (SVG) | ![method](screenshots/home-method.png) |
| Habr cards | ![habr](screenshots/home-habr.png) |
| Package registries | ![packages](screenshots/home-packages.png) |
| Repositories | ![repositories](screenshots/repositories.png) |
| Repositories: ML / AI | ![repositories-ml](screenshots/repositories-ml.png) |
| Experience: ML / AI | ![experience-ml](screenshots/experience-ml.png) |
| Experience: DevOps | ![experience-devops](screenshots/experience-devops.png) |
| Experience: CEO / Team lead | ![experience-lead](screenshots/experience-lead.png) |
| Research | ![research](screenshots/research.png) |
| Research highlights | ![research-highlights](screenshots/research-highlights.png) |
| Data science: laws | ![research-laws](screenshots/research-laws.png) |
| Associative stack | ![associative](screenshots/associative.png) ![associative-stack](screenshots/associative-stack.png) |
| Art and other | ![art](screenshots/art.png) ![art-symbols](screenshots/art-symbols.png) |
| Blog (English reader) | ![blog-en](screenshots/blog-en.png) |
| Blog (Russian reader) | ![blog-ru](screenshots/blog-ru.png) |
| Blog: archived pictures (served from `/archive/media/`) | ![blog-media](screenshots/blog-media.png) |
| Blog: a picture the CDN no longer serves | ![blog-missing-picture](screenshots/blog-missing-picture.png) |

## 9. Refreshing the data

```sh
node experiments/collect-repositories.cjs      # repositories.json (gh CLI)
node experiments/collect-organizations.cjs     # organizations.json
node experiments/collect-registries.cjs        # registries.json
node experiments/collect-other-registries.cjs  # registries-other.json
node experiments/collect-habr.cjs              # habr.json
node experiments/archive-posts.cjs             # posts.json and public/archive/media
npm run build:data                             # src/data/github.json, repositories.json
npm test
```
