// Issue #51: run 41480863205 failed on main because actions/deploy-pages@v5 gave up
// after one HTTP 500 from POST /pages/deployments. These tests drive the replacement
// with a mocked API, so no case waits or reaches GitHub.
import { deployPages, githubApi, oidcToken, fail, HttpError, describe as explain } from '../scripts/deploy-pages.mjs';

const SHA = 'abc123';
const base = '/repos/konard/konard.github.io/pages';
const http = (status, text = '') => new HttpError(status, text, { method: 'POST', path: `${base}/deployments` });

// A scripted Pages API: every route answers with its queue, the last answer repeating.
function api(routes) {
  const calls = [];
  const request = vi.fn(async (method, path, body) => {
    calls.push(`${method} ${path}`);
    const queue = routes[`${method} ${path}`];
    if (!queue) throw new HttpError(404, 'Not Found', { method, path });
    const answer = queue.length > 1 ? queue.shift() : queue[0];
    if (answer instanceof Error) throw answer;
    return typeof answer === 'function' ? answer(body) : answer;
  });
  return { request, calls };
}

const run = (request, options = {}) =>
  deployPages({
    request,
    getIdToken: vi.fn().mockResolvedValue('oidc'),
    repository: 'konard/konard.github.io',
    artifactId: '42',
    buildVersion: SHA,
    sleep: vi.fn(),
    log: vi.fn(),
    ...options,
  });

const created = { id: 7, page_url: 'https://konard.github.io/' };

test('retries the HTTP 500 that failed main and publishes the same artifact once', async () => {
  const { request, calls } = api({
    [`POST ${base}/deployments`]: [http(500, 'Internal Server Error'), created],
    [`GET ${base}/deployments/${SHA}`]: [new HttpError(404, 'Not Found')],
    [`GET ${base}/deployments/7`]: [{ status: 'deployment_queued' }, { status: 'succeed' }],
  });
  const sleep = vi.fn();
  await expect(run(request, { sleep })).resolves.toEqual({ id: 7, pageUrl: 'https://konard.github.io/' });
  expect(calls.filter((c) => c.startsWith('POST'))).toHaveLength(2);
  expect(request).toHaveBeenCalledWith('POST', `${base}/deployments`, {
    artifact_id: 42,
    pages_build_version: SHA,
    oidc_token: 'oidc',
  });
  expect(sleep).toHaveBeenNthCalledWith(1, 10000);
});

test.each([400, 401, 403, 404, 422])('fails on the first permanent HTTP %i without retrying', async (status) => {
  const { request, calls } = api({ [`POST ${base}/deployments`]: [http(status)] });
  await expect(run(request)).rejects.toThrow(`HTTP ${status}`);
  expect(calls).toEqual([`POST ${base}/deployments`]);
});

test('gives up after the bounded number of transient failures', async () => {
  const { request, calls } = api({ [`POST ${base}/deployments`]: [http(503)] });
  await expect(run(request, { attempts: 3 })).rejects.toThrow('Creating the Pages deployment failed');
  expect(calls.filter((c) => c.startsWith('POST'))).toHaveLength(3);
});

test('adopts a deployment whose creation response was lost instead of creating a second one', async () => {
  const { request, calls } = api({
    [`POST ${base}/deployments`]: [new TypeError('fetch failed')],
    [`GET ${base}/deployments/${SHA}`]: [{ status: 'deployment_in_progress' }, { status: 'succeed' }],
    [`GET ${base}`]: [{ html_url: 'https://konard.github.io/' }],
  });
  const log = vi.fn();
  await expect(run(request, { log })).resolves.toEqual({ id: SHA, pageUrl: 'https://konard.github.io/' });
  expect(calls.filter((c) => c.startsWith('POST'))).toHaveLength(1);
  expect(log).toHaveBeenCalledWith(expect.stringContaining('Adopted'));
});

test('creates a new deployment when the earlier one of the same commit already failed', async () => {
  const { request, calls } = api({
    [`POST ${base}/deployments`]: [http(502), created],
    [`GET ${base}/deployments/${SHA}`]: [{ status: 'deployment_failed' }],
    [`GET ${base}/deployments/7`]: [{ status: 'succeed' }],
  });
  await expect(run(request)).resolves.toMatchObject({ id: 7 });
  expect(calls.filter((c) => c.startsWith('POST'))).toHaveLength(2);
});

test.each([
  ['deployment_failed', 'Deployment failed'],
  ['deployment_content_failed', 'hard links or symlinks'],
  ['deployment_cancelled', 'cancelled'],
  ['deployment_lost', 'final status'],
])('a %s deployment fails the step', async (status, message) => {
  const { request } = api({
    [`POST ${base}/deployments`]: [created],
    [`GET ${base}/deployments/7`]: [{ status }],
  });
  await expect(run(request)).rejects.toThrow(message);
});

test('cancels the deployment after too many errors reading its status', async () => {
  const { request, calls } = api({
    [`POST ${base}/deployments`]: [created],
    [`GET ${base}/deployments/7`]: [new HttpError(502, 'Bad Gateway')],
    [`POST ${base}/deployments/7/cancel`]: [{}],
  });
  await expect(run(request, { maxPollErrors: 3 })).rejects.toThrow('Too many errors');
  expect(calls.filter((c) => c === `GET ${base}/deployments/7`)).toHaveLength(3);
  expect(calls).toContain(`POST ${base}/deployments/7/cancel`);
});

test('a permanent error reading the status fails at once', async () => {
  const { request } = api({
    [`POST ${base}/deployments`]: [created],
    [`GET ${base}/deployments/7`]: [new HttpError(403, 'Forbidden')],
  });
  await expect(run(request)).rejects.toThrow('HTTP 403');
});

test('cancels a deployment that does not finish in time', async () => {
  let clock = 0;
  const { request, calls } = api({
    [`POST ${base}/deployments`]: [created],
    [`GET ${base}/deployments/7`]: [{ status: 'deployment_in_progress' }],
    [`POST ${base}/deployments/7/cancel`]: [{}],
  });
  const now = () => (clock += 1000);
  await expect(run(request, { now, timeoutMs: 5000 })).rejects.toThrow('did not finish within 5s');
  expect(calls).toContain(`POST ${base}/deployments/7/cancel`);
});

test.each([undefined, '', 'abc'])('refuses a missing artifact ID %j before calling the API', async (artifactId) => {
  const { request } = api({});
  await expect(run(request, { artifactId })).rejects.toThrow('Missing Pages artifact ID');
  expect(request).not.toHaveBeenCalled();
});

test('HTTP errors keep request IDs out of the message, so they cannot look transient', () => {
  const error = new HttpError(403, 'Forbidden', {
    method: 'POST',
    path: '/x',
    requestId: 'AA00:25F91:3BD2504:C7A75DA:6AE8C500',
    body: '{"message":"Resource not accessible by integration"}',
  });
  expect(error.message).toBe('HTTP 403 Forbidden');
  expect(explain(error)).toContain('request ID AA00:25F91');
});

test('the API client sends the GitHub headers and raises HTTP errors with their request ID', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(
    new Response('{"message":"boom"}', {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'x-github-request-id': 'R1' },
    }),
  );
  const request = githubApi({ token: 't', fetchImpl });
  const error = await request('POST', '/p', { a: 1 }).catch((e) => e);
  expect(error).toMatchObject({ status: 500, requestId: 'R1', method: 'POST', path: '/p' });
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe('https://api.github.com/p');
  expect(init.headers.authorization).toBe('Bearer t');
  expect(init.body).toBe('{"a":1}');
});

test('the OIDC token is requested like core.getIDToken', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(Response.json({ value: 'jwt' }));
  const env = { ACTIONS_ID_TOKEN_REQUEST_URL: 'https://token', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'req' };
  await expect(oidcToken({ env, fetchImpl })()).resolves.toBe('jwt');
  expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer req');
  await expect(oidcToken({ env: {}, fetchImpl })()).rejects.toThrow('id-token: write');
});

test('a failure is one encoded error annotation', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const before = process.exitCode;
  fail(new Error('50% done\nsecond line'));
  expect(spy).toHaveBeenCalledWith('::error::50%25 done%0Asecond line');
  expect(process.exitCode).toBe(1);
  process.exitCode = before;
  spy.mockRestore();
});
