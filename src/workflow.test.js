import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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

  test('deploy keeps docs/case-studies when replacing the site build', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    const scripts = Object.values(doc.jobs)
      .flatMap((job) => job.steps.map((s) => s.run || ''))
      .join('\n');
    expect(scripts).not.toMatch(/rm -rf docs\s*($|;|&)/m);
    expect(scripts).toMatch(/case-studies/);
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
    expect(doc.concurrency['cancel-in-progress']).toBe("${{ github.event_name == 'pull_request' }}");
  });

  test('deploy publishes the tested build instead of rebuilding it', () => {
    const doc = yaml.load(fs.readFileSync(path.join(workflowsDir, 'github-pages.yml'), 'utf8'));
    expect(doc.jobs.deploy.needs).toBe('test');
    expect(doc.jobs.deploy.steps.some((s) => (s.run || '').includes('npm run build'))).toBe(false);
    expect(doc.jobs.deploy.steps.some((s) => (s.uses || '').startsWith('actions/download-artifact@'))).toBe(true);
  });
});
