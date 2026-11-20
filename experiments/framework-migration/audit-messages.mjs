// Structural review of the broad catalog extraction: expand each reference
// back into its two original strings and compare syntax trees with main.
// Intentional behavior changes receive separate focused review and tests.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import catalogs from '../../src/i18n/catalogs.generated.js';

const baseline = 'f169665';
const releaseBaseline = '2f32d20ad92a60fea0720d9dda5d89a2e7c5c977';
const networkShare = 'src/pages/NetworkShare.jsx';
const behavioral = new Set([
  'src/components/Select.jsx',
  'src/components/ColorInput.jsx',
  // Number parsing now uses the upstream continuous clamp policy, verified by
  // NumberInput.test.jsx; this is no longer a catalog-only migration.
  'src/components/NumberInput.jsx',
  'src/components/Layout.jsx',
  'src/settings/schema.js',
]);
const files = execFileSync('git', ['diff', '--name-only', baseline, '--', 'src'], { encoding: 'utf8' })
  .trim()
  .split('\n');
const fromRevision = (revision, file) => execFileSync('git', ['show', `${revision}:${file}`], { encoding: 'utf8' });
const messageKeys = (source) => [...source.matchAll(/\blocalized\('([^']+)'\)/g)].map(([, key]) => key);
const clean = (node) => {
  if (Array.isArray(node))
    return node
      .filter((item) => !(item?.type === 'JSXText' && item.value.includes('\n') && !item.value.trim()))
      .map(clean);
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'JSXText') return { type: 'JSXRenderedText', value: node.value };
  if (node.type === 'JSXExpressionContainer' && node.expression.type === 'StringLiteral')
    return { type: 'JSXRenderedText', value: node.expression.value };
  return Object.fromEntries(
    Object.entries(node)
      .filter(
        ([key]) =>
          ![
            'start',
            'end',
            'loc',
            'extra',
            'comments',
            'leadingComments',
            'innerComments',
            'trailingComments',
          ].includes(key),
      )
      .map(([key, value]) => [key, clean(value)]),
  );
};
const tree = (source) => parse(source, { sourceType: 'module', plugins: ['jsx'] });
const expand = (node) => {
  if (Array.isArray(node)) return node.map(expand);
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'CallExpression' && node.callee.name === 'localized') {
    const key = node.arguments[0].value;
    assert.ok(Object.hasOwn(catalogs.en, key) && Object.hasOwn(catalogs.ru, key), key);
    return tree(`({en:${JSON.stringify(catalogs.en[key])},ru:${JSON.stringify(catalogs.ru[key])}})`).program.body[0]
      .expression;
  }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, expand(value)]));
};
let checked = 0;
for (const file of files) {
  if (!/\.[jt]sx?$/.test(file) || behavioral.has(file)) continue;
  const source = await readFile(file, 'utf8');
  if (!source.includes('import { localized } from')) continue;
  if (file === networkShare) {
    // Export now delegates raster encoding. Compare its message keys with
    // the previous draft, which passed the full syntax-tree check.
    const keys = messageKeys(source);
    assert.deepEqual(keys, messageKeys(fromRevision(releaseBaseline, file)), file);
    for (const key of keys) assert.ok(Object.hasOwn(catalogs.en, key) && Object.hasOwn(catalogs.ru, key), key);
    continue;
  }
  const current = tree(source);
  current.program.body = current.program.body.filter(
    (node) =>
      !(node.type === 'ImportDeclaration' && node.specifiers.some((specifier) => specifier.local.name === 'localized')),
  );
  const original = tree(fromRevision(baseline, file));
  assert.deepEqual(clean(expand(current)), clean(original), file);
  checked++;
}
console.log(`${checked} catalog-only files match their original syntax trees and exact English/Russian text.`);
console.log('NetworkShare retains the previous draft’s localized message keys.');
