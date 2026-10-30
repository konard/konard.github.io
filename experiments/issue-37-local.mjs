// Compare bounded local adjustments without enabling the rejected layout search.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { randomNetworks } from './issue-37-networks.mjs';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { solveCollisions, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const records = [];
  for (const code of ['34442132', '2222', ...randomNetworks()]) {
    const links = decode(code.match(/../g).join(' '));
    const shape = shapeOfStyle(normalizeStyle(), links.length);
    for (const range of [15, 30, 60, 180]) {
      const start = performance.now();
      const result = solveCollisions(links, shape, { adjustGaps: true, search: false, range });
      const record = {
        code,
        range,
        result,
        residual: result.after - turningCost(result.turns),
        ms: performance.now() - start,
      };
      records.push(record);
      console.log(JSON.stringify(record));
    }
  }
  await writeFile('docs/case-studies/issue-37/data/local-adjustments.json', JSON.stringify(records, null, 2) + '\n');
} finally {
  await server.close();
}
