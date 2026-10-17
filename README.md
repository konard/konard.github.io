# konard.github.io

Personal website of Konstantin Diachenko ([@konard](https://github.com/konard)): a public biography and CV with infographics.
It is published at https://konard.github.io.

It is a React 19 app built with [Vite](https://vite.dev) and tested with [Vitest](https://vitest.dev), with hand-written SVG/CSS charts and no runtime API calls.
All numbers come from data snapshots committed to the repository.

## Development

```bash
npm ci
npm start          # dev server at http://localhost:3000
npm run test:ci    # unit, data and workflow tests
npm run check      # ESLint, Prettier, file size limits and secret scan
npm run build      # production build in build/
```

## Updating the data

| What                                                                 | Where                                |
| -------------------------------------------------------------------- | ------------------------------------ |
| Career, education, skills, publications, contacts, featured projects | `src/data/profile.js` (hand-curated) |
| GitHub, npm, crates.io, NuGet and Stack Overflow numbers             | `src/data/github.json` (generated)   |

To refresh the generated data:

```bash
experiments/collect-github-data.sh       # repositories and organizations (needs gh auth)
experiments/collect-contributions.sh     # yearly contribution totals (GraphQL)
npm run build:data                       # writes src/data/github.json
```

`src/data/data.test.js` fails if `github.json` is out of date with the snapshots.

## Deployment

`.github/workflows/github-pages.yml` lints the workflows (actionlint), runs `npm run check` and `npm audit`, then the tests and the build, for pull requests and for pushes to `main`.
On `main`, the deploy job then copies that tested build into `docs/`, which GitHub Pages serves (`main` branch, `/docs` folder).
The `docs/case-studies/` folder is kept.

## Case study

The research, requirements, alternatives and decisions behind the site are in [`docs/case-studies/issue-1`](docs/case-studies/issue-1/README.md).
