import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { parseFragment } from 'parse5';
import { inlineJSON } from '../scripts/inline-json.mjs';
import { delayedStylesheets } from '../experiments/delayed-stylesheets.mjs';
import { networkExampleUrls } from '../experiments/network-example-urls.mjs';
import { parseMath } from './links/edit.js';

const require = createRequire(import.meta.url);
const { npmMetadataUrl } = require('../experiments/registry-network.cjs');
const { sanitize, htmlToText, findElements, innerOf, attr } = require('../experiments/archive-posts.cjs');
const scripts = (html) => parseFragment(html).childNodes.filter((node) => node.tagName === 'script');

test.each(['math', 'html'])('%s parsing bounds malicious backtracking inputs', (kind) => {
  const result = spawnSync(
    process.execPath,
    ['--max-old-space-size=128', '--stack-size=512', 'experiments/issue-31-security-probe.mjs', kind],
    { encoding: 'utf8', timeout: 2000, maxBuffer: 65536 },
  );
  expect(result.error?.message, result.stderr).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('without hanging');
});

test.each([' ', ', ', '\t,\n', ''])('math pairs preserve supported separators %j', (separator) => {
  expect(parseMath(`{(0, 1)${separator}(2, 0)}`).links).toEqual([
    [0, 1],
    [2, 0],
  ]);
});

test.each([', (0, 0)', '(0, 0),', '(0, 0),, (0, 0)', '(0, 0) ! (0, 0)'])(
  'math pairs reject extra punctuation: %s',
  (input) => expect(parseMath(input).error).toBeTruthy(),
);

test.each(['plain-package', '@scope/package', '@scope/a/b?x=1#fragment', 'x%2Fy'])(
  'npm metadata names form exactly one URL component: %s',
  (name) => {
    const url = new URL(npmMetadataUrl(name));
    expect(url.origin).toBe('https://registry.npmjs.org');
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    expect(url.pathname.split('/')).toHaveLength(3);
    expect(decodeURIComponent(url.pathname.split('/')[1])).toBe(name);
    expect(url.pathname.endsWith('/latest')).toBe(true);
  },
);

test('inline JSON preserves data without terminating the containing script', () => {
  const value = { text: '</script><script>globalThis.injected=true</script>\u2028\u2029', path: 'a\\b"\n&<>' };
  const encoded = inlineJSON(value);
  expect(encoded).not.toMatch(/[<>&\u2028\u2029]/);
  expect(JSON.parse(encoded)).toEqual(value);
  const nodes = scripts(`<script>globalThis.settings=${encoded}</script>`);
  expect(nodes).toHaveLength(1);
  expect(nodes[0].childNodes[0].value).toBe(`globalThis.settings=${encoded}`);
});

test('the delayed stylesheet probe keeps a hostile href as data', () => {
  const href = '/style.css?</script><script>globalThis.injected=true</script>';
  const html = delayedStylesheets(`<link rel="stylesheet" href="${href}">`);
  const nodes = scripts(html);
  expect(nodes).toHaveLength(1);
  const append = vi.fn();
  const document = { createElement: () => ({}), head: { append } };
  const schedule = vi.fn((callback) => callback());
  new Function('document', 'setTimeout', nodes[0].childNodes[0].value)(document, schedule);
  expect(schedule).toHaveBeenCalledWith(expect.any(Function), 300);
  expect(append).toHaveBeenCalledWith({ rel: 'stylesheet', href });
});

test('issue example extraction accepts the exact hostname and Markdown boundaries', () => {
  const urls = networkExampleUrls(
    '`https://konard.github.io/network/?code=0120`\n' +
      'https://konard.github.io/network/?code=00&width=256\n' +
      'https://konardXgithubYio/network/?code=11\n' +
      'https://konard.githubXio/network/?code=11\n' +
      'https://konard.github.io.evil.test/network/?code=11',
  );
  expect(urls.map((url) => url.href)).toEqual([
    'https://konard.github.io/network/?code=0120',
    'https://konard.github.io/network/?code=00&width=256',
  ]);
});

test('archive HTML retains formatting and safe absolute links, dropping active content', () => {
  const input = '<p>Hello <del>old</del> <a href="https://example.test/?a=1&amp;b=2" onclick="bad()">link</a></p>';
  expect(sanitize(input)).toBe('<p>Hello <s>old</s> <a href="https://example.test/?a=1&amp;b=2">link</a></p>');
  expect(
    sanitize('<script>bad()</script><style>bad</style><svg>bad</svg><template>bad</template><button>bad</button>OK'),
  ).toBe('OK');
  expect(sanitize('<a href="java&#x73;cript:bad()">text</a>')).toBe('text');
  expect(sanitize('<i class="emoji"><b>emoji</b></i>')).toBe('emoji');
});

test('archive text uses HTML parsing, while retaining encoded literal markup as text', () => {
  expect(htmlToText('<p>A<br>B</p><blockquote>C</blockquote><pre>D</pre>')).toBe('A\nB\nC\nD');
  expect(htmlToText('<a href="https://example.test/full?x=1&amp;y=2">example…</a>')).toBe(
    'https://example.test/full?x=1&y=2',
  );
  expect(htmlToText('<script')).toBe('');
  expect(htmlToText('&lt;script&gt;literal&lt;/script&gt;')).toBe('<script>literal</script>');
  expect(htmlToText('before\0after')).toBe('beforeafter');
});

test('archive element extraction respects quoted angle brackets and real elements', () => {
  const outer = '<div title="a > b" data-testid="post"><p>Text</p></div>';
  expect(findElements(outer + '<p>data-testid="post"</p>', 'data-testid="post"')).toEqual([outer]);
  expect(innerOf(outer)).toBe('<p>Text</p>');
  expect(attr('href="https://example.test/?a=1&amp;b=2"', 'href')).toBe('https://example.test/?a=1&b=2');
});

test('all archived posts preserve their text through repeated sanitization', () => {
  const { posts } = JSON.parse(readFileSync('src/data/posts.json', 'utf8'));
  expect(posts.length).toBeGreaterThan(0);
  for (const post of posts) {
    const html = post.html || '';
    const clean = sanitize(html);
    expect(htmlToText(clean), post.id).toBe(htmlToText(html));
    expect(sanitize(clean), post.id).toBe(clean);
  }
});
