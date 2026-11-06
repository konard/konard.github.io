import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { readCatalogs } from '@link-foundation/ui-i18n';
import { DEFAULTS, RULES } from '../settings/schema';
import catalogs from '../i18n/catalogs.generated.js';

const read = (path) => readFileSync(path, 'utf8');
const fixture = (file) => read(`docs/case-studies/issue-54/data/${file}`);

it('keeps every one of the 608 field defaults and validation rules', () => {
  const { rules } = JSON.parse(fixture('settings-before.json'));
  expect(RULES).toEqual(rules);
  expect(DEFAULTS).toEqual(Object.fromEntries(Object.entries(rules).map(([key, rule]) => [key, rule.d])));
});

it('ships matching framework catalogs and reproducible generated data', () => {
  const compiled = readCatalogs(['en', 'ru'].map((lang) => read(`src/i18n/catalogs/${lang}.lino`)).join('\n'));
  expect(compiled).toEqual(catalogs);
  expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs.ru).sort());
  expect(Object.keys(catalogs.en)).toHaveLength(809);
});

const cssRules = (text) =>
  Object.fromEntries(
    [...text.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(([, selector, body]) => [
      selector.replace(/\/\*[\s\S]*?\*\//g, '').trim(),
      Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()])),
    ]),
  );

it('generates all 24 palettes with exactly the original color channels', () => {
  execFileSync(process.execPath, ['scripts/build-ui-palettes.mjs']);
  expect(cssRules(read('src/skins.palettes.css'))).toEqual(cssRules(fixture('palettes-before.css')));
});

it('pins every framework tarball to the audited source snapshot', () => {
  const manifest = JSON.parse(read('vendor/link-ui/manifest.json'));
  expect(manifest.revision).toBe('27d580f4bac4ebb4e70de3f78671153c2ef5dab9');
  for (const pkg of manifest.packages) {
    const browserPackage = ['ui-i18n', 'ui-convert', 'ui-devmode'].includes(pkg.name.split('/')[1]);
    expect(pkg.revision).toBe(browserPackage ? 'e37935ea195fca55cb2ee6a5d2c1723858cd7f81' : manifest.revision);
    expect(pkg.source).toBe(`${manifest.repository}/tree/${pkg.revision}/packages/${pkg.name.split('/')[1]}`);
    expect(
      createHash('sha256')
        .update(readFileSync(`vendor/link-ui/${pkg.file}`))
        .digest('hex'),
    ).toBe(pkg.sha256);
  }
});
