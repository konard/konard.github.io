## Problem

`actions/deploy-pages@v5` creates the Pages deployment with a single `POST /repos/{owner}/{repo}/pages/deployments` request and fails the job on any error, including a transient HTTP 500. Only the later status polling tolerates errors (`error_count`). A single GitHub-side 5xx therefore turns a run red even though the build, the tests and the artifact were all fine, and `main` stays red until someone reruns the job by hand.

This happened in konard/konard.github.io run [41480863205](https://github.com/konard/konard.github.io/actions/runs/41480863205) on `main`:

```
##[error]Creating Pages deployment failed
##[error]Error: Failed to create deployment (status: 500) with build version 5f7f468bef7af0fbb6a0074123743cbcb3e6b1e8. Request ID AA00:25F91:3BD2504:C7A75DA:6AE8C100 Server error, is githubstatus.com reporting a Pages outage? Please re-run the deployment at a later time.
...
Pipeline failed: deploy: failure
```

The action itself suggests re-running. The template runs the same action with no retry, so every repository generated from it inherits this failure mode:

- [`.github/workflows/example-app.yml` line 144](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/blob/c2463c74/.github/workflows/example-app.yml#L142-L148) (`uses: actions/deploy-pages@v5`, step "Deploy Pages artifact")

An older report of 5xx failures upstream (actions/deploy-pages#193) is closed, and v5 still sends a single creation request.

## Why a plain retry wrapper is not enough

Rerunning the whole action (for example with a generic retry action) can create a second deployment when the first POST succeeded but its response was lost. That races two deployments of the same commit.

## Suggested fix

This was fixed in konard/konard.github.io#52 (issue konard/konard.github.io#51) with a small local action that speaks the same REST protocol as deploy-pages v5, without npm dependencies:

- [`scripts/deploy-pages.mjs`](https://github.com/konard/konard.github.io/blob/issue-51-bc3e586ec5c3/scripts/deploy-pages.mjs) and [`.github/actions/deploy-pages`](https://github.com/konard/konard.github.io/tree/issue-51-bc3e586ec5c3/.github/actions/deploy-pages):
  1. Request the OIDC token (`ACTIONS_ID_TOKEN_REQUEST_URL`), as `core.getIDToken()` does.
  2. Make `POST .../pages/deployments` with `{artifact_id, pages_build_version, oidc_token}`.
     - Retry only 429, 5xx and network errors, a bounded number of times with backoff.
     - Fail permanent 4xx (400/401/403/404/422) on the first attempt.
  3. Before each retry, `GET .../pages/deployments/{sha}`. If a deployment of this commit exists and has not failed, adopt it instead of creating a second one.
  4. Poll until `succeed`. Fail on `deployment_failed`, `deployment_content_failed`, `deployment_cancelled` or `deployment_lost`.
  5. Cancel the deployment (`POST .../cancel`) on timeout, on too many polling errors, or when the job is cancelled (SIGINT/SIGTERM).
- The build job outputs the ID of the artifact it uploaded, and the deploy job publishes exactly that artifact.
- Unit tests with a mocked API: [`src/deploy-pages.test.js`](https://github.com/konard/konard.github.io/blob/issue-51-bc3e586ec5c3/src/deploy-pages.test.js). They cover a 500 followed by success (one publication), each permanent status, retry exhaustion, adoption after a lost response, a failed earlier deployment, every final state, polling errors and timeout.

Because the replacement uses only `fetch`, it also removes the bundled punycode DEP0040 warning (actions/deploy-pages#413 and #434). That would make the NODE_OPTIONS workaround unnecessary.

A lighter alternative is to keep `actions/deploy-pages@v5` and add a second attempt guarded by `if: steps.deployment.outcome == 'failure'` (with `continue-on-error` on the first attempt). Note that this alternative retries permanent errors too, and does not adopt a deployment whose response was lost.

## Acceptance criteria

- A transient 5xx or 429 from the deployment creation is retried a bounded number of times.
- A permanent 4xx fails at once with the status and request ID.
- A retry never creates a second deployment of the same commit.
- Covered by unit tests with a mocked API.
