import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

// Finite audit of every topology up to three links, using the existing scorer.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { codeAt, decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { overlapCost, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const result = { networks: 0, previouslyClear: 0, failures: [] };
  for (let n = 1; n <= 3; n++) {
    for (let index = 0; index < (n + 1) ** (2 * n); index++) {
      const code = codeAt(n, BigInt(index));
      const links = decode(code);
      const style = normalizeStyle();
      const before = shapeOfStyle(style, n);
      const cost = overlapCost(links, before);
      result.networks++;
      if (cost > 1e-8) continue;
      result.previouslyClear++;
      const after = shapeOfStyle(style, links);
      const next = overlapCost(links, after) - turningCost(after.turns);
      if (next > 1e-8) result.failures.push({ code, before: cost, after: next, turns: after.turns });
    }
  }
  await writeFile('docs/case-studies/issue-41/data/perfect-audit.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  assert.deepEqual(result.failures, []);
} finally {
  await server.close();
}
