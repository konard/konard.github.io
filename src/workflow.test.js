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
    const scripts = Object.values(doc.jobs).flatMap((job) => job.steps.map((s) => s.run || '')).join('\n');
    expect(scripts).not.toMatch(/rm -rf docs\s*($|;|&)/m);
    expect(scripts).toMatch(/case-studies/);
  });
});
