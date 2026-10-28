# konard.github.io

Personal website of Konstantin Diachenko ([@konard](https://github.com/konard)): a public biography and CV with infographics.
It is published at https://konard.github.io.

The site is in English and Russian, and has light and dark themes.

- The language comes from `?lang=en|ru`, then the remembered choice, then the browser.
- The theme follows the system until it is switched in the top bar.

`/cv/?role=<position>&style=<classic|compact|technical|academic>&lang=<en|ru>` shows a CV for one of 15 positions, or the full record without `role`.
Its "Download PDF" button links to the PDF printed at deploy time, `/cv/pdf/konstantin-diachenko-<position>-<style>-<lang>.pdf`.

`/art/#symbols` opens the gallery of link networks. Click a card to open
`/network/?code=<pairs>`: edit its notations and links, style the SVG, reduce
overlaps experimentally, and download or share the picture. Its URL preserves
the network and image settings, including the theory notation. The editor supports
any finite link count, symmetric start/end/middle markers and cuts, and circle,
grid, dice, playing-card, spiral and deterministic force placements. Circle is
automatic for 1–4 links, hexagonal placement after four.
Each link has a card with its references, color, turns and four gap overrides.
Automatic spacing considers painted lines and markers with a configurable
clearance. Sharp arrows stay pointed at acute angles and compensate their
painted tip length by default; rounded corners and legacy lengths are available.

It is a React 19 app built with [Vite](https://vite.dev) and tested with [Vitest](https://vitest.dev), with hand-written SVG/CSS charts and no runtime API calls.
All numbers come from data snapshots committed to the repository.

## Development

Use Node.js 24 or newer. Install the Python and shell linters used by CI before
committing changes to those files:

```bash
python -m pip install ruff==0.14.2 shellcheck-py==0.11.0.1
```

```bash
npm ci
npm start          # dev server at http://localhost:3000
npm run test:ci    # unit, data and workflow tests
npm run check      # ESLint, Prettier, file size limits and secret scan
python scripts/check-python.py && ruff check . && ruff format --check .
git ls-files -z '*.sh' '.husky/*' ':(exclude)dev/log/**' ':(exclude)docs/**' | xargs -0 shellcheck
npm run build      # production build in build/
npm run test:network:browser # editor and real downloads; ENGINE=firefox|webkit also supported
npm run test:network:issue19 # history, loops, layouts, clipboard and touch regressions
npm run test:network:issue25 # automatic spacing, native arrow pixels, per-link cards and mobile layouts
npm run test:network:issue29 # paired sliders, preserved manual layouts and mirrored reference spacing
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
It also checks Python and shell helpers, documentation links, workflow security
with zizmor, and JavaScript, Python and Actions with CodeQL. A weekly run audits
the committed lockfile. Documentation-only changes skip browser/PDF builds;
`pipeline-status` rejects failures and unexpected skips in every required job.
A browser matrix checks the network editor, clipboard, touch editing and actual image downloads in Chromium, Firefox and WebKit.
The `test` job prints the CV PDFs with `npm run build:cv`, then uploads the tested build as the GitHub Pages artifact.
On `main`, the `deploy` job publishes that artifact with `actions/deploy-pages`, then `scripts/check-deployed-site.sh` fails the run unless https://konard.github.io serves the app.
The probe checks the built commit, JavaScript asset and PDF signature, with a
finite retry budget for CDN propagation. Artifact uploads retry transient network
failures up to three times and fail on authorization errors or missing evidence.
Read jobs cancel superseded runs; deployments share a non-cancelling writer group.

GitHub Pages must be set to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Nothing is committed to `docs/`; it only holds the case studies.

## Case studies

- [`issue-1`](docs/case-studies/issue-1/README.md): the research, requirements, alternatives and decisions behind the site.
- [`issue-7`](docs/case-studies/issue-7/README.md): repositories by field, roles, research and link visuals.
- [`issue-9`](docs/case-studies/issue-9/README.md): link networks, the problem solving diagram and the ecosystem.
- [`issue-11`](docs/case-studies/issue-11/README.md): the experience synced with hh.ru, a CV per position in EN/RU, the PDF styles and the themes.
- [`issue-13`](docs/case-studies/issue-13/README.md): the rain on Safari, the settings page, the liquid glass and futuristic skins, only real references, the full associative stack and the R → R² notation.
- [`issue-15`](docs/case-studies/issue-15/README.md): the new defaults and a test that every setting is applied, the settings layout, the sound design, background layers, each corner of the futuristic frames, presets and saved looks, phones and every screen.
- [`issue-17`](docs/case-studies/issue-17/README.md): the network editor, notation parsers, SVG styling, image downloads, share links and experimental overlap reduction, with browser screenshots.
- [`issue-19`](docs/case-studies/issue-19/README.md): Safari history and clipboard fixes, symmetric loop/marker geometry, middle cuts, scalable arrangements and cross-browser regression evidence.
- [`issue-25`](docs/case-studies/issue-25/README.md): painted-shape spacing, acute arrow tips, balanced endpoints and per-link configuration cards, with archived reports and browser evidence.
- [`issue-27`](docs/case-studies/issue-27/README.md): continuous equal closed gaps, numeric editing, historical URL compatibility and keyboard controls.
- [`issue-29`](docs/case-studies/issue-29/README.md): paired sliders, individual resets, preserved manual layouts and symmetric automatic references, with the inherited requirement audit and cross-browser evidence.
