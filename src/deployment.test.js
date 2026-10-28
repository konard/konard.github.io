import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
test.each(['valid', 'stale', 'html-pdf', 'html-js', 'missing-pdf', 'missing-build-info'])(
  'deployment probe validates %s response',
  async (scenario) => {
    const server = createServer((req, res) => {
      if (req.url.startsWith('/build-info.json')) {
        if (scenario === 'missing-build-info') res.statusCode = 404;
        res.end(JSON.stringify({ sha: scenario === 'stale' ? 'old' : 'current' }));
      } else if (req.url.startsWith('/assets/'))
        res.end(scenario === 'html-js' ? '<!DOCTYPE html><html>404</html>' : 'console.log("app")');
      else if (req.url.startsWith('/cv/pdf/')) {
        if (scenario === 'missing-pdf') res.statusCode = 404;
        res.end(scenario === 'html-pdf' ? '<html>404</html>' : '%PDF-1.7\n');
      } else res.end('<div id="root"></div><script src="/assets/index-app.js"></script>');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const call = run(
        'bash',
        ['scripts/check-deployed-site.sh', `http://127.0.0.1:${server.address().port}`, '1', '0'],
        { env: { ...process.env, GITHUB_SHA: 'current' } },
      );
      if (scenario === 'valid') await expect(call).resolves.toMatchObject({ stderr: '' });
      else await expect(call).rejects.toMatchObject({ code: 1 });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
