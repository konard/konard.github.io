// One-time import of the frozen palette CSS; generated CSS is now framework output.
import { readFile, writeFile } from 'node:fs/promises';
import { formatLinks } from '@link-foundation/ui-core';
const css = await readFile('src/skins.palettes.css', 'utf8');
const records = [];
for (const match of css.matchAll(
  /:root\[data-skin-name='futuristic'\]\[data-future-palette='([^']+)'\](\[data-theme='light'\])?\s*\{([^}]+)\}/g,
)) {
  const [, palette, light, body] = match;
  const tokens = [...body.matchAll(/--(fx-[\w-]+):\s*([^;]+);/g)].map(([, key, raw]) => {
    const value = key.endsWith('-rgb') ? ['rgb', ...raw.trim().split(' ')] : raw.trim();
    return ['token', key, value];
  });
  records.push({ id: palette + (light ? '-light' : '-dark'), values: ['theme', ...tokens] });
}
await writeFile('src/ui/palettes.lino', formatLinks(records));
