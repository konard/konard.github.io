// An API error is unknown configuration, never evidence that Pages is ready.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function pagesReady(data) {
  return data?.build_type === 'workflow' && typeof data.html_url === 'string' && data.html_url.startsWith('https://');
}
function main() {
  let ready = false;
  try {
    const data = JSON.parse(
      execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/pages`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    ready = pagesReady(data);
  } catch {
    console.log('Pages configuration could not be verified with this workflow token.');
  }
  if (ready) {
    console.log('Pages is configured to publish from GitHub Actions.');
    return;
  }
  const message =
    'Set Settings → Pages → Build and deployment → Source to GitHub Actions, and grant the preflight job pages: read. PRs can validate without deployment; main must be able to publish.';
  if (process.env.REQUIRE_PAGES === 'true') throw new Error(message);
  console.log(`::notice::${message}`);
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
