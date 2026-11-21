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

it('installs framework packages from versioned releases with registry integrity', () => {
  const { dependencies } = JSON.parse(read('package.json'));
  const { packages } = JSON.parse(read('package-lock.json'));
  const isFramework = (name) => name.startsWith('@link-foundation/ui-');
  const direct = Object.entries(dependencies).filter(([name]) => isFramework(name));
  expect(direct.map(([name]) => name)).toContain('@link-foundation/ui-components');
  for (const [name, version] of direct) {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packages[`node_modules/${name}`].version).toBe(version);
  }
  for (const [path, pkg] of Object.entries(packages)) {
    if (!isFramework(path.split('node_modules/').at(-1))) continue;
    expect(pkg.resolved).toMatch(/^https:\/\/registry\.npmjs\.org\/@link-foundation\/ui-/);
    expect(pkg.integrity).toMatch(/^sha512-/);
  }
});
