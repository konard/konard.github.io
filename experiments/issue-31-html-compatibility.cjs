// Compare all archived post text with the pre-security-fix implementation.
// Run with Node --max-old-space-size=128; no network requests are made.
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const current = require('./post-html.cjs');

const baseline = process.argv[2] || 'dfb1f91a842ba3c699699ba94353e7d572e0b65f';
const source = execFileSync('git', ['show', `${baseline}:experiments/archive-posts.cjs`], {
  encoding: 'utf8',
  maxBuffer: 2 ** 21,
});
const helpers = source.slice(
  source.indexOf('// ---------- HTML helpers ----------'),
  source.indexOf('function detectLang'),
);
const context = { module: { exports: {} } };
vm.runInNewContext(`${helpers}\nmodule.exports={sanitize,htmlToText};`, context);
const before = context.module.exports;
const { posts } = JSON.parse(fs.readFileSync('src/data/posts.json', 'utf8'));
const changes = [];
const nullNormalizations = [];
for (const post of posts) {
  const input = post.html || '';
  const oldText = before.htmlToText(before.sanitize(input));
  const normalized = current.sanitize(input);
  const newText = current.htmlToText(normalized);
  if (oldText !== newText) {
    // HTML5 parsing ignores literal NULs, as browsers already do for these posts.
    if (oldText.replace(/\0/g, '') === newText) nullNormalizations.push(post.id);
    else changes.push({ id: post.id, oldText, newText });
  }
  assert.equal(current.sanitize(normalized), normalized, `idempotent sanitization: ${post.id}`);
}
console.log(
  JSON.stringify({ baseline, posts: posts.length, nullNormalizations, changedText: changes.length, changes }, null, 2),
);
assert.equal(changes.length, 0, 'archived post text must be preserved');
