# konard.github.io

Personal website of Konstantin Diachenko ([@konard](https://github.com/konard)): a public biography and CV with infographics.
It is published at https://konard.github.io.

The site is in English and Russian, and has light and dark themes.

- The language comes from `?lang=en|ru`, then the remembered choice, then the browser.
- The theme follows the system until it is switched in the top bar.

`/cv/?role=<position>&style=<classic|compact|technical|academic>&lang=<en|ru>` shows a CV for one of 15 positions, or the full record without `role`.
Its "Download PDF" button links to the PDF printed at deploy time, `/cv/pdf/konstantin-diachenko-<position>-<style>-<lang>.pdf`.

It is a React 19 app built with [Vite](https://vite.dev) and tested with [Vitest](https://vitest.dev), with hand-written SVG/CSS charts and no runtime API calls.
All numbers come from data snapshots committed to the repository.

## Development

```bash
npm ci
npm start          # dev server at http://localhost:3000
npm run test:ci    # unit, data and workflow tests
npm run check      # ESLint, Prettier, file size limits and secret scan
npm run build      # production build in build/
npm run build:cv   # prints every CV of build/ to build/cv/pdf/ (needs `npx playwright install chromium`)
```

`npm run build:cv` fails if:

- a CV for a position takes more than 2 pages;
- a compact CV takes more than 1 page;
- a PDF has no text layer;
- a part of the CV is positioned, which would put its text out of reading order for ATS parsers.

`npm run build:cv -- --verbose rust` prints only the Rust CVs and lists their page counts.

## Updating the data

| What                                                          | Where                                |
| ------------------------------------------------------------- | ------------------------------------ |
| Jobs (EN/RU texts, dates, bullets for the CV, tags and roles) | `src/data/experience.js`             |
| Positions: their jobs, skills, products and CV strengths      | `src/data/positions.js`              |
| Education, skills, publications, contacts, featured projects  | `src/data/profile.js` (hand-curated) |
| GitHub, npm, crates.io, NuGet and Stack Overflow numbers      | `src/data/github.json` (generated)   |

To refresh the generated data:

```bash
experiments/collect-github-data.sh       # repositories and organizations (needs gh auth)
experiments/collect-contributions.sh     # yearly contribution totals (GraphQL)
npm run build:data                       # writes src/data/github.json
```

`src/data/data.test.js` fails if `github.json` is out of date with the snapshots.

## Deployment

`.github/workflows/github-pages.yml` lints the workflows (actionlint), runs `npm run check` and `npm audit`, then the tests and the build, for pull requests and for pushes to `main`.
The `test` job prints the CV PDFs into the build with `npm run build:cv`, then uploads the tested build as the GitHub Pages artifact.
On `main`, the `deploy` job publishes that artifact with `actions/deploy-pages`, then `scripts/check-deployed-site.sh` fails the run unless https://konard.github.io serves the app.

GitHub Pages must be set to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Nothing is committed to `docs/`; it only holds the case studies.

## Case studies

- [`issue-1`](docs/case-studies/issue-1/README.md): the research, requirements, alternatives and decisions behind the site.
- [`issue-7`](docs/case-studies/issue-7/README.md): repositories by field, roles, research and link visuals.
- [`issue-9`](docs/case-studies/issue-9/README.md): link networks, the problem solving diagram and the ecosystem.
- [`issue-11`](docs/case-studies/issue-11/README.md): the experience synced with hh.ru, a CV per position in EN/RU, the PDF styles and the themes.
