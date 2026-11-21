import fs from 'node:fs';
import vm from 'node:vm';
import * as yaml from 'js-yaml';
import { galleryScreenshot } from '../experiments/issue-23-display-capture.mjs';

const workflow = yaml.load(fs.readFileSync('.github/workflows/github-pages.yml', 'utf8'));
const job = workflow.jobs['network-browsers'];

// Evaluate the actual workflow conditions so changing a shard cannot silently
// drop, duplicate or cancel another shard's original browser coverage.
const enabled = (step, matrix) =>
  !step.if ||
  vm.runInNewContext(step.if.replace(/^\$\{\{|\}\}$/g, ''), {
    matrix,
    steps: { browser: { outcome: 'success' } },
    cancelled: () => false,
  });

test.each(['chromium', 'firefox', 'webkit'])('%s retains every browser suite exactly once', (engine) => {
  const entries = job.strategy.matrix.include.filter((entry) => entry.engine === engine);
  const commands = entries.flatMap((matrix) =>
    job.steps
      .filter((step) => enabled(step, matrix))
      .flatMap((step) => [...new Set(step.run?.match(/npm run test:[\w:]+/g) || [])]),
  );
  const expected = [
    'network:browser',
    'network:issue19',
    'network:issue21',
    'network:issue23',
    'network:issue25',
    'network:issue27',
    'network:issue29',
    'network:issue35',
    'network:issue37',
    'ui:issue39',
    'network:issue41',
    'network:issue43',
    'ui:issue45',
    'ui:migration',
    ...(engine === 'chromium' ? ['indicators:browser'] : []),
  ].map((name) => `npm run test:${name}`);
  expect(commands.sort()).toEqual(expected.sort());
  expect(new Set(entries.map((entry) => entry.suite)).size).toBe(entries.length);
  for (const matrix of entries) {
    const upload = job.steps.find((step) => step.uses === './.github/actions/upload-artifact');
    expect(enabled(upload, matrix)).toBe(true);
    expect(upload.with.name).toContain('${{ matrix.suite }}');
    expect(job.concurrency.group).toContain('${{ matrix.suite }}');
  }
});

test('the long WebKit keyboard audit has its own runner and the original timeout', () => {
  const entries = job.strategy.matrix.include.filter((entry) => entry.engine === 'webkit');
  expect(entries).toHaveLength(2);
  const keyboard = entries.find((entry) => entry.suite === 'keyboard');
  expect(keyboard).toMatchObject({ os: 'macos-15-intel', timeout: 30 });
  const tests = job.steps.filter((step) => step.run?.includes('npm run test:') && enabled(step, keyboard));
  expect(tests.map((step) => step.run)).toEqual(['npm run test:network:issue27']);
});

test('display gallery evidence reaches native capture even if the screenshot API stalls', async () => {
  const page = {
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockImplementation(() => {
      throw new Error('page.screenshot: Timeout 15000ms exceeded; waiting for fonts to load');
    }),
  };
  const capture = vi.fn().mockResolvedValue(Buffer.from('native compositor pixels'));
  const pixels = await galleryScreenshot(page, 'gallery-display.png', { display: true }, capture);
  expect(pixels).toEqual(Buffer.from('native compositor pixels'));
  expect(capture).toHaveBeenCalledWith('gallery-display.png');
  expect(page.screenshot).not.toHaveBeenCalled();
});

test('headless gallery evidence still uses the browser screenshot API', async () => {
  const page = { screenshot: vi.fn().mockResolvedValue(Buffer.from('browser pixels')) };
  await expect(galleryScreenshot(page, 'gallery.png', { display: false })).resolves.toEqual(
    Buffer.from('browser pixels'),
  );
  expect(page.screenshot).toHaveBeenCalledWith({ path: 'gallery.png' });
});
