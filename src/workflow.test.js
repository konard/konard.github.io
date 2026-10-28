import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

const workflowsDir = path.join(__dirname, '..', '.github', 'workflows');

describe('GitHub Actions workflows', () => {
  const files = fs.readdirSync(workflowsDir).filter((f) => /\.ya?ml$/.test(f));

  test.each(files)('%s is valid YAML with jobs', (file) => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, file), 'utf8'));
    expect(doc).toHaveProperty('jobs');
    Object.values(doc.jobs).forEach((job) => {
      expect(Array.isArray(job.steps)).toBe(true);
      job.steps.forEach((step) => expect(typeof (step.name || step.uses)).toBe('string'));
    });
  });

  // Issue #5: GitHub Pages is set to deploy from GitHub Actions ("build_type": "workflow"),
  // so a commit to docs/ never reaches the site. Only actions/deploy-pages publishes it.
  describe('GitHub Pages deployment from Actions', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    const { deploy, test: testJob } = doc.jobs;
    const scripts = Object.values(doc.jobs)
      .flatMap((job) => job.steps.map((s) => s.run || ''))
      .join('\n');

    test('the tested build is uploaded as the Pages artifact', () => {
      const upload = testJob.steps.find(
        (s) => s.uses === './.github/actions/upload-artifact' && s.with?.pages === 'true',
      );
      expect(upload).toBeDefined();
      expect(upload.with.path).toBe('build/');
      const build = testJob.steps.findIndex((s) => s.run === 'npm run build');
      expect(build).toBeGreaterThanOrEqual(0);
      expect(testJob.steps.indexOf(upload)).toBeGreaterThan(build);
    });

    // Issue #11: the "Download PDF" links point at PDFs printed after the build.
    test('the CV PDFs are printed into the build before it is uploaded', () => {
      const index = (run) => testJob.steps.findIndex((s) => s.run === run);
      const upload = testJob.steps.findIndex(
        (s) => s.uses === './.github/actions/upload-artifact' && s.with?.pages === 'true',
      );
      expect(index('npx playwright install --with-deps chromium')).toBeGreaterThan(index('npm run build'));
      expect(index('npm run build:cv')).toBeGreaterThan(index('npx playwright install --with-deps chromium'));
      expect(upload).toBeGreaterThan(index('npm run build:cv'));
    });

    test('deploy publishes with actions/deploy-pages to the github-pages environment', () => {
      expect(deploy.steps.some((s) => (s.uses || '').startsWith('actions/deploy-pages@'))).toBe(true);
      expect(deploy.permissions).toEqual({ contents: 'read', pages: 'write', 'id-token': 'write' });
      expect(deploy.environment.name).toBe('github-pages');
      expect(deploy.environment.url).toBe('${{ steps.deployment.outputs.page_url }}');
    });

    test('nothing commits the build to the repository any more', () => {
      expect(scripts).not.toMatch(/git (commit|push)/);
      expect(scripts).not.toMatch(/cp -r build/);
      Object.values(doc.jobs).forEach((job) => expect((job.permissions || {}).contents).not.toBe('write'));
    });

    test('deploy fails unless the deployed URL serves the app', () => {
      const deployStep = deploy.steps.findIndex((s) => s.id === 'deployment');
      const verify = deploy.steps.findIndex((s) => (s.run || '').includes('scripts/check-deployed-site.sh'));
      expect(verify).toBeGreaterThan(deployStep);
      expect(deploy.steps[verify].env.PAGE_URL).toBe('${{ steps.deployment.outputs.page_url }}');
      expect(fs.existsSync(path.join(__dirname, '..', 'scripts', 'check-deployed-site.sh'))).toBe(true);
    });

    test('docs/ holds no stale site build that looks deployed', () => {
      const docsDir = path.join(__dirname, '..', 'docs');
      expect(fs.readdirSync(docsDir).filter((f) => f !== 'case-studies')).toEqual([]);
    });
  });
});

describe('GitHub Actions best practices', () => {
  const files = fs.readdirSync(workflowsDir).filter((f) => /\.ya?ml$/.test(f));
  const docs = files.map((file) => [file, yaml.load(fs.readFileSync(path.join(workflowsDir, file), 'utf8'))]);
  const steps = (doc) => Object.values(doc.jobs).flatMap((job) => job.steps);

  test.each(docs)('%s sets a timeout on every job', (_file, doc) => {
    Object.values(doc.jobs).forEach((job) => expect(job['timeout-minutes']).toBeGreaterThan(0));
  });

  test.each(docs)('%s defaults to read-only permissions', (_file, doc) => {
    expect(doc.permissions).toEqual({ contents: 'read' });
  });

  // Actions that still target the deprecated Node.js 20 runtime print a warning on every run.
  test.each(docs)('%s uses actions that run on Node.js 24', (_file, doc) => {
    const minimum = {
      'actions/checkout': 6,
      'actions/setup-node': 6,
      'actions/upload-artifact': 7,
      'actions/download-artifact': 8,
      'actions/upload-pages-artifact': 5,
      'actions/deploy-pages': 5,
    };
    steps(doc)
      .filter((s) => s.uses && !s.uses.startsWith('docker://'))
      .forEach((s) => {
        const [name, ref] = s.uses.split('@');
        if (minimum[name]) expect(Number(ref.replace(/^v/, ''))).toBeGreaterThanOrEqual(minimum[name]);
      });
  });

  test.each(docs)('%s only keeps checkout credentials where it pushes', (_file, doc) => {
    Object.values(doc.jobs).forEach((job) => {
      const writes = job.permissions && job.permissions.contents === 'write';
      job.steps
        .filter((s) => (s.uses || '').startsWith('actions/checkout@'))
        .forEach((s) => {
          if (!writes) expect(s.with && s.with['persist-credentials']).toBe(false);
        });
    });
  });

  test('main deploys are never cancelled by a newer push', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    expect(doc.concurrency).toBeUndefined();
    expect(doc.jobs.deploy.concurrency['cancel-in-progress']).toBe(false);
    expect(doc.jobs.deploy.concurrency.group).toBe('main-writer-${{ github.repository }}-main');
  });

  test('CodeQL scans all maintained source when a PR exceeds the diff API limit', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    const job = doc.jobs.codeql;
    expect(job.strategy.matrix.language).toEqual(['javascript-typescript', 'python', 'actions']);
    expect(job.env?.CODEQL_ACTION_DIFF_INFORMED_QUERIES).toBe('false');
    const config = yaml.load(fs.readFileSync(path.join(workflowsDir, '../codeql/codeql-config.yml'), 'utf8'));
    expect(config['disable-default-queries']).not.toBe(true);
    expect(config['paths-ignore']).not.toContain('src');
    expect(config['paths-ignore']).not.toContain('scripts');
  });

  test('security findings fail the workflow as well as the separate GitHub check', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    const steps = doc.jobs.codeql.steps;
    const analyze = steps.findIndex((step) => step.uses === 'github/codeql-action/analyze@v4');
    const gate = steps.findIndex((step) => step.run?.includes('scripts/check-codeql-results.mjs'));
    expect(gate).toBeGreaterThan(analyze);
    expect(steps[analyze].with.output).toBe(steps[gate].env.SARIF_DIR);
  });

  test('deploy publishes the tested build instead of rebuilding it', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    expect(doc.jobs.deploy.needs).toContain('test');
    expect(doc.jobs.deploy.steps.some((s) => (s.run || '').includes('npm run build'))).toBe(false);
    expect(doc.jobs.deploy.steps.some((s) => (s.uses || '').startsWith('actions/deploy-pages@'))).toBe(true);
  });

  test.each(docs)('%s has a terminal gate covering every job and no success overrides', (_file, doc) => {
    const { 'pipeline-status': gate, ...required } = doc.jobs;
    expect([...gate.needs].sort()).toEqual(Object.keys(required).sort());
    expect(gate.if).toContain('!cancelled()');
    expect(doc.on.pull_request).not.toHaveProperty('paths-ignore');
    expect(doc.on.schedule).toHaveLength(1);
    Object.values(doc.jobs).forEach((job) => {
      expect(job['continue-on-error']).toBeUndefined();
      job.steps.forEach((step) => expect(step['continue-on-error']).toBeUndefined());
    });
  });
});
