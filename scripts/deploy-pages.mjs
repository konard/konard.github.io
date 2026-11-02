// Publishes the Pages artifact with the REST protocol of actions/deploy-pages@v5
// (create a deployment with an OIDC token, poll it, cancel it when abandoned),
// and retries what that action does not: a transient failure to create the
// deployment. One HTTP 500 from POST /pages/deployments failed main in run
// 41480863205 (issue #51) although the site, the tests and the artifact were
// fine. Permanent refusals (400/401/403/404/422) still fail on the first attempt.
// Plain fetch keeps the deploy job free of npm dependencies, and so of the
// punycode DEP0040 warning bundled in deploy-pages v5 (actions/deploy-pages#413).
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { isTransient } from './transient.mjs';

export const SUCCEEDED = 'succeed';
// The final states of actions/deploy-pages; every other state is still in progress.
export const FAILED = {
  deployment_failed: 'Deployment failed, try again later.',
  deployment_content_failed:
    'Artifact could not be deployed. Ensure it has no hard links or symlinks and is smaller than 10 GB.',
  deployment_cancelled: 'Deployment cancelled.',
  deployment_lost: 'Deployment failed to report final status.',
};

export class HttpError extends Error {
  constructor(status, statusText, { method, path, requestId, body } = {}) {
    // Only the status goes in the message: isTransient also reads messages, and
    // a request ID or response body may contain any number.
    super(`HTTP ${status} ${statusText || ''}`.trim());
    Object.assign(this, { name: 'HttpError', status, method, path, requestId, body });
  }
}

export function describe(error) {
  if (!(error instanceof HttpError)) return error?.message || String(error);
  const detail = [`${error.method} ${error.path}: ${error.message}`];
  if (error.requestId) detail.push(`request ID ${error.requestId}`);
  if (error.body) detail.push(String(error.body).slice(0, 300));
  return detail.join('; ');
}

export function githubApi({ token, apiUrl = 'https://api.github.com', fetchImpl = fetch, timeoutMs = 30000 }) {
  return async (method, path, body) => {
    const response = await fetchImpl(`${apiUrl}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'konard.github.io-deploy-pages',
        'x-github-api-version': '2022-11-28',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    if (!response.ok)
      throw new HttpError(response.status, response.statusText, {
        method,
        path,
        requestId: response.headers.get('x-github-request-id'),
        body: text,
      });
    return text ? JSON.parse(text) : {};
  };
}

// The same request as core.getIDToken() of @actions/toolkit, without an audience.
export function oidcToken({ env = process.env, fetchImpl = fetch } = {}) {
  return async () => {
    const url = env.ACTIONS_ID_TOKEN_REQUEST_URL;
    const token = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    if (!url || !token) throw new Error('No OIDC token request URL: grant the deploy job "id-token: write".');
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new HttpError(response.status, response.statusText, { method: 'GET', path: 'OIDC token request' });
    const { value } = await response.json();
    if (!value) throw new Error('The OIDC token response has no token.');
    return value;
  };
}

export async function deployPages({
  request,
  getIdToken,
  repository,
  artifactId,
  buildVersion,
  attempts = 3,
  retryDelayMs = 10000,
  pollIntervalMs = 5000,
  maxPollErrors = 10,
  timeoutMs = 600000,
  sleep = delay,
  now = Date.now,
  log = console.log,
  onCreated = () => {},
}) {
  if (!/^\d+$/.test(String(artifactId ?? ''))) throw new Error(`Missing Pages artifact ID: "${artifactId ?? ''}".`);
  if (!buildVersion) throw new Error('Missing build version (the commit SHA).');
  const base = `/repos/${repository}/pages`;
  let deployment;
  for (let attempt = 1; !deployment; attempt++) {
    try {
      // A lost response may hide a deployment that was created: adopt it unless
      // it already failed, so a retry can never publish twice or race itself.
      if (attempt > 1) deployment = await existingDeployment(request, base, buildVersion);
      if (deployment) log(`Adopted the deployment of ${buildVersion} created by attempt ${attempt - 1}.`);
      else {
        deployment = await request('POST', `${base}/deployments`, {
          artifact_id: Number(artifactId),
          pages_build_version: buildVersion,
          oidc_token: await getIdToken(),
        });
        log(
          `Created the Pages deployment of ${buildVersion} from artifact ${artifactId} (attempt ${attempt}/${attempts}).`,
        );
      }
    } catch (error) {
      if (!isTransient(error) || attempt >= attempts)
        throw new Error(`Creating the Pages deployment failed: ${describe(error)}`, { cause: error });
      log(
        `Transient failure to create the Pages deployment (${describe(error)}); retrying in ${(attempt * retryDelayMs) / 1000}s (${attempt}/${attempts}).`,
      );
      await sleep(attempt * retryDelayMs);
    }
  }
  const id = deployment.id || deployment.status_url?.split('/').pop() || buildVersion;
  onCreated(id);
  const pageUrl = deployment.page_url || (await request('GET', base)).html_url;
  const start = now();
  let errors = 0;
  for (;;) {
    await sleep(pollIntervalMs);
    try {
      const { status } = await request('GET', `${base}/deployments/${id}`);
      if (status === SUCCEEDED) {
        log(`Pages deployment ${id} succeeded: ${pageUrl}`);
        return { id, pageUrl };
      }
      if (FAILED[status]) throw Object.assign(new Error(FAILED[status]), { final: true });
      log(`Pages deployment ${id}: ${status}`);
    } catch (error) {
      if (error.final || !isTransient(error)) throw error;
      if (++errors >= maxPollErrors) {
        await cancel(request, base, id, log);
        throw new Error(`Too many errors reading the deployment status: ${describe(error)}`, { cause: error });
      }
      log(`Transient failure to read the deployment status (${describe(error)}); ${errors}/${maxPollErrors}.`);
    }
    if (now() - start >= timeoutMs) {
      await cancel(request, base, id, log);
      throw new Error(`Pages deployment ${id} did not finish within ${timeoutMs / 1000}s.`);
    }
  }
}

async function existingDeployment(request, base, buildVersion) {
  try {
    const found = await request('GET', `${base}/deployments/${buildVersion}`);
    return found?.status && !FAILED[found.status] ? { ...found, id: buildVersion } : null;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function cancel(request, base, id, log = console.log) {
  try {
    await request('POST', `${base}/deployments/${id}/cancel`);
    log(`Cancelled Pages deployment ${id}.`);
  } catch (error) {
    log(`Cancelling Pages deployment ${id} failed: ${describe(error)}`);
  }
}

export async function main(env = process.env) {
  const request = githubApi({ token: env.INPUT_TOKEN || env.GITHUB_TOKEN, apiUrl: env.GITHUB_API_URL });
  const base = `/repos/${env.GITHUB_REPOSITORY}/pages`;
  let pending;
  // A cancelled workflow must not leave a deployment that blocks the next one.
  const abandon = async () => {
    if (pending) await cancel(request, base, pending);
    process.exit(1);
  };
  process.once('SIGINT', abandon);
  process.once('SIGTERM', abandon);
  const { pageUrl } = await deployPages({
    request,
    getIdToken: oidcToken({ env }),
    repository: env.GITHUB_REPOSITORY,
    artifactId: env.INPUT_ARTIFACT_ID,
    buildVersion: env.GITHUB_SHA,
    onCreated: (id) => (pending = id),
  });
  pending = null;
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `page_url=${pageUrl}\n`);
}

// One error annotation per failure, encoded as a workflow command property.
export function fail(error) {
  const text = String(error?.message || error)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
  console.log(`::error::${text}`);
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main().catch(fail);
