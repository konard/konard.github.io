import { uploadWithRetry, artifactFiles, packagePages, isTransient } from '../scripts/upload-artifact.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

test.each(['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'HTTP 429', 'HTTP 503'])(
  'recovers %s without repeating tests or accepting missing artifacts',
  async (message) => {
    const client = {
      uploadArtifact: vi.fn().mockRejectedValueOnce(new Error(message)).mockResolvedValue({ id: 7 }),
      deleteArtifact: vi.fn().mockResolvedValue({}),
    };
    const sleep = vi.fn();
    await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep })).resolves.toEqual({ id: 7 });
    expect(client.uploadArtifact).toHaveBeenCalledTimes(2);
    expect(client.deleteArtifact).toHaveBeenCalledWith('test');
    expect(sleep).toHaveBeenCalledWith(5000);
  },
);

test.each([
  'HTTP 403 Forbidden',
  'HTTP 401 Unauthorized',
  'HTTP 404 Not Found',
  'Invalid artifact name',
  'Resource not accessible by integration',
])('permanent failures fail on the first attempt: %s', async (message) => {
  const client = { uploadArtifact: vi.fn().mockRejectedValue(new Error(message)) };
  await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep: vi.fn() })).rejects.toThrow(message);
  expect(client.uploadArtifact).toHaveBeenCalledTimes(1);
});

test('exhausted transient failures fail closed after three attempts', async () => {
  const client = {
    uploadArtifact: vi.fn().mockRejectedValue(new Error('ENOTFOUND')),
    deleteArtifact: vi.fn().mockResolvedValue({}),
  };
  await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep: vi.fn() })).rejects.toThrow('ENOTFOUND');
  expect(client.uploadArtifact).toHaveBeenCalledTimes(3);
});

test('nested transport errors are classified but explicit refusals never are', () => {
  expect(isTransient(new Error('Unable to make request', { cause: { code: 'ENOTFOUND' } }))).toBe(true);
  expect(isTransient({ statusCode: 503 })).toBe(true);
  expect(isTransient({ statusCode: 403, message: 'ECONNRESET' })).toBe(false);
});

test('a retry reconciles missing artifacts but never hides reconciliation or empty-result failures', async () => {
  const client = {
    uploadArtifact: vi.fn().mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValue({ id: 8 }),
    deleteArtifact: vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { name: 'ArtifactNotFoundError' })),
  };
  await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep: vi.fn() })).resolves.toEqual({ id: 8 });
  client.uploadArtifact.mockReset().mockRejectedValueOnce(new Error('ENOTFOUND'));
  client.deleteArtifact.mockRejectedValue(new Error('HTTP 403'));
  await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep: vi.fn() })).rejects.toThrow('403');
  expect(client.uploadArtifact).toHaveBeenCalledTimes(1);
  client.uploadArtifact.mockResolvedValue({});
  await expect(uploadWithRetry(client, 'test', ['file'], '/root', {}, { sleep: vi.fn() })).rejects.toThrow(
    'no artifact ID',
  );
});

test('the pinned official SDK produces a readable ZIP with the nondeprecated glob override', async () => {
  // Exercise the real archiver path locally without needing runner credentials.
  const sdk = path.resolve(import.meta.dirname, '../node_modules/@actions/artifact/lib');
  const { getUploadZipSpecification } = await import(
    pathToFileURL(path.join(sdk, 'internal/upload/upload-zip-specification.js'))
  );
  const { createZipUploadStream } = await import(pathToFileURL(path.join(sdk, 'internal/upload/zip.js')));
  const dir = mkdtempSync(path.join(tmpdir(), 'artifact-zip-'));
  try {
    const file = path.join(dir, 'evidence.txt');
    writeFileSync(file, 'real evidence');
    const stream = await createZipUploadStream(getUploadZipSpecification([file], dir), 6);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const zip = path.join(dir, 'upload.zip');
    writeFileSync(zip, Buffer.concat(chunks));
    expect(execFileSync('unzip', ['-p', zip, 'evidence.txt'], { encoding: 'utf8' })).toBe('real evidence');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('missing and empty evidence fail; Pages tar includes .nojekyll and strips git metadata', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'artifact-files-'));
  try {
    await expect(artifactFiles(dir)).rejects.toThrow(/empty/i);
    await expect(artifactFiles(path.join(dir, 'missing'))).rejects.toThrow();
    mkdirSync(path.join(dir, '.git'));
    writeFileSync(path.join(dir, '.git', 'config'), 'private');
    writeFileSync(path.join(dir, '.nojekyll'), '');
    writeFileSync(path.join(dir, 'index.html'), '<div>app</div>');
    expect(await artifactFiles(dir)).toEqual([path.join(dir, 'index.html')]);
    const archive = await packagePages(dir);
    try {
      const listing = execFileSync('tar', ['-tf', archive.file], { encoding: 'utf8' });
      expect(listing).toContain('./.nojekyll');
      expect(listing).toContain('./index.html');
      expect(listing).not.toContain('.git');
    } finally {
      await archive.cleanup();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
