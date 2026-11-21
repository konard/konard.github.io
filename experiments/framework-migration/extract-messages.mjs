// One-time, reproducible extraction from the pre-migration revision.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { createHash } from 'node:crypto';
import { relative, dirname } from 'node:path';
const traverse = traverseModule.default;
const catalogs = { en: {}, ru: {} };
async function visit(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) {
      await visit(path);
      continue;
    }
    if (!/\.[jt]sx?$/.test(path) || /\.test\.|catalog|localizer/.test(path)) continue;
    const source = await readFile(path, 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
    const edits = [];
    traverse(ast, {
      ObjectExpression(nodePath) {
        const node = nodePath.node;
        if (node.properties.length !== 2) return;
        const pairs = Object.fromEntries(node.properties.map((p) => [p.key?.name, p.value]));
        if (pairs.en?.type !== 'StringLiteral' || pairs.ru?.type !== 'StringLiteral') return;
        const key =
          'm' +
          createHash('sha256')
            .update(pairs.en.value + '\0' + pairs.ru.value)
            .digest('hex')
            .slice(0, 12);
        catalogs.en[key] = pairs.en.value;
        catalogs.ru[key] = pairs.ru.value;
        edits.push({ start: node.start, end: node.end, text: `localized('${key}')` });
        nodePath.skip();
      },
    });
    if (!edits.length) continue;
    let output = source;
    for (const edit of edits.sort((a, b) => b.start - a.start))
      output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    let from = relative(dirname(path), 'src/i18n/localizer.js');
    if (!from.startsWith('.')) from = './' + from;
    await writeFile(path, `import { localized } from '${from}';\n` + output);
  }
}
await visit('src/components');
await visit('src/pages');
await visit('src/settings');
await mkdir('src/i18n/catalogs', { recursive: true });
for (const locale of ['en', 'ru']) {
  const text =
    locale +
    ':\n' +
    Object.entries(catalogs[locale])
      .map(([key, value]) => `  ${key} ${JSON.stringify(value)}`)
      .join('\n') +
    '\n';
  await writeFile(`src/i18n/catalogs/${locale}.lino`, text);
}
console.log(Object.keys(catalogs.en).length, 'messages extracted');
