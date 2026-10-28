// Same SDK/protocol as actions/upload-artifact; retry the operation that failed,
// never the test suite. Permanent refusals and missing evidence fail immediately.
import { DefaultArtifactClient } from '@actions/artifact';
import { readdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export function isTransient(error) {
  const chain = [];
  for (let item = error; item && !chain.includes(item); item = item.cause) chain.push(item);
  const statuses = chain.map((e) => Number(e.statusCode || e.status || e.response?.status)).filter(Boolean);
  const message = chain.map((e) => `${e.code || ''} ${e.message || ''}`).join(' ');
  if (
    statuses.some((n) => n >= 400 && n < 500 && n !== 429) ||
    /\b(400|401|403|404|409|422)\b|forbidden|unauthorized|not accessible by integration/i.test(message)
  )
    return false;
  return (
    statuses.some((n) => n === 429 || n >= 500) ||
    /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH|EPIPE|socket hang up|\b(429|5\d\d)\b/i.test(
      message,
    )
  );
}

export async function uploadWithRetry(client, name, files, root, options, { sleep = delay } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        // A lost finalize response may have left a completed artifact. Replace
        // only our own uniquely named artifact, so retrying cannot conflict.
        try {
          await client.deleteArtifact(name);
        } catch (error) {
          if (error.name !== 'ArtifactNotFoundError') throw error;
        }
      }
      const result = await client.uploadArtifact(name, files, root, options);
      if (!result.id) throw new Error(`Upload returned no artifact ID for ${name}`);
      console.log(`Uploaded ${name}: artifact ${result.id} (attempt ${attempt}/3).`);
      return result;
    } catch (error) {
      if (!isTransient(error) || attempt === 3) throw error;
      console.log(
        `Transient artifact transport failure (${error.message}); retrying ${name} in ${attempt * 5}s (${attempt}/3).`,
      );
      await sleep(attempt * 5000);
    }
  }
}

export async function artifactFiles(directory) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.push(file);
      // Evidence never follows symlinks outside the output directory.
    }
  }
  await walk(directory);
  if (!files.length) throw new Error(`Artifact evidence directory is empty: ${directory}`);
  return files.sort();
}

export async function packagePages(directory) {
  await artifactFiles(directory); // A missing/empty build must never upload.
  const root = await mkdtemp(path.join(tmpdir(), 'pages-artifact-'));
  const file = path.join(root, 'artifact.tar');
  const cleanup = () => rm(root, { recursive: true, force: true });
  try {
    // Matches upload-pages-artifact's GNU tar format, including .nojekyll.
    execFileSync(
      process.platform === 'darwin' ? 'gtar' : 'tar',
      [
        '--dereference',
        '--hard-dereference',
        '--directory',
        directory,
        '-cf',
        file,
        '--exclude=.git',
        '--exclude=.github',
        '.',
      ],
      { stdio: 'pipe' },
    );
    return { root, file, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

export async function main({ name, input, pages = false } = {}) {
  if (!name) {
    const args = process.argv.slice(2);
    [name, input] = args;
    pages = args[2] === '--pages';
  }
  const mode = pages;
  if (!name || !input) throw new Error('Usage: upload-artifact.mjs <name> <directory> [--pages]');
  const directory = path.resolve(input);
  const archive = mode ? await packagePages(directory) : null;
  try {
    await uploadWithRetry(
      new DefaultArtifactClient(),
      name,
      archive ? [archive.file] : await artifactFiles(directory),
      archive?.root || directory,
      { retentionDays: mode ? 1 : 14, compressionLevel: mode ? 0 : 6 },
    );
  } finally {
    await archive?.cleanup();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
