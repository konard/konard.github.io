// Offline reproduction of the pinned SDK's immediate DNS failure, followed by
// recovery through our adapter. No real credentials or network requests are used.
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpClient } from '@actions/http-client';
import { uploadWithRetry } from '../scripts/upload-artifact.mjs';

const sdk = path.resolve(import.meta.dirname, '../node_modules/@actions/artifact/lib');
const { internalArtifactTwirpClient } = await import(
  pathToFileURL(path.join(sdk, 'internal/shared/artifact-twirp-client.js'))
);
const { CreateArtifactRequest } = await import(pathToFileURL(path.join(sdk, 'generated/results/api/v1/artifact.js')));
const originalPost = HttpClient.prototype.post;
const originalEnvironment = {
  ACTIONS_RUNTIME_TOKEN: process.env.ACTIONS_RUNTIME_TOKEN,
  ACTIONS_RESULTS_URL: process.env.ACTIONS_RESULTS_URL,
};
let calls = 0;
try {
  process.env.ACTIONS_RUNTIME_TOKEN = 'offline-placeholder';
  process.env.ACTIONS_RESULTS_URL = 'https://artifact.invalid';
  HttpClient.prototype.post = async function () {
    calls++;
    if (calls === 1) throw Object.assign(new Error('DNS unavailable'), { code: 'ENOTFOUND' });
    return {
      message: { statusCode: 200, headers: {} },
      readBody: async () => JSON.stringify({ ok: true, signedUploadUrl: 'https://artifact.invalid/upload' }),
    };
  };
  const sdkClient = internalArtifactTwirpClient({ maxAttempts: 3, retryIntervalMs: 1 });
  const create = () => sdkClient.CreateArtifact(CreateArtifactRequest.create({ name: 'offline-evidence', version: 4 }));
  await assert.rejects(create(), /Failed to CreateArtifact: Unable to make request: ENOTFOUND/);
  assert.equal(calls, 1, 'SDK transport errors bypass its HTTP retry loop');
  console.log('Reproduced: SDK failed after one request despite maxAttempts=3.');

  calls = 0;
  const client = {
    uploadArtifact: async () => {
      assert.equal((await create()).ok, true);
      return { id: 7 }; // No blob upload follows the reproduced CreateArtifact RPC.
    },
    deleteArtifact: async () => {
      throw Object.assign(new Error('not finalized'), { name: 'ArtifactNotFoundError' });
    },
  };
  const result = await uploadWithRetry(client, 'offline-evidence', [], '.', {}, { sleep: async () => {} });
  assert.equal(result.id, 7);
  assert.equal(calls, 2);
  console.log('Verified: bounded adapter recovered on request two.');
} finally {
  HttpClient.prototype.post = originalPost;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
