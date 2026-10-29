import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { randomNetworks } from './issue-37-networks.mjs';
const server = await createServer({ root: process.env.BASELINE_ROOT, server: { middlewareMode: true } });
const phase = process.env.PHASE || 'after';
try {
  const { solveCollisions, turningCost } = await server.ssrLoadModule('/src/links/collisions.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const { networkSvg } = await server.ssrLoadModule('/src/links/render.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const records = [];
  const pictures = [];
  for (const code of randomNetworks()) {
    const links = decode(code.match(/../g).join(' '));
    const style = normalizeStyle();
    const shape = shapeOfStyle(style, links.length);
    const start = performance.now();
    const result = solveCollisions(links, shape, {
      adjustGaps: true,
      range: style.solveRange,
      step: style.solveStep,
      gapRange: style.solveGapRange,
    });
    const record = {
      code,
      result,
      collisionCost: result.after - turningCost(result.turns),
      ms: performance.now() - start,
    };
    records.push(record);
    console.log(JSON.stringify(record));
    pictures.push(
      `<article><h2>${code}: ${record.collisionCost.toFixed(3)}</h2><div>${networkSvg(links, style)}${networkSvg(links, style, { extraTurns: result.delta, extraGaps: result.linkGaps, extraLayout: result.layout })}</div></article>`,
    );
  }
  await writeFile(`docs/case-studies/issue-37/data/random-${phase}.json`, JSON.stringify(records, null, 2) + '\n');
  await writeFile(
    `docs/case-studies/issue-37/data/random-${phase}.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Issue 37: ${phase}</title><style>body{background:#10141d;color:#fff;font:16px sans-serif;margin:20px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}article div{display:flex}svg{width:50%;height:auto}h2{font-size:16px}</style><h1>20 seeded networks: original / automatic (${phase})</h1><main>${pictures.join('')}</main></html>`,
  );
} finally {
  await server.close();
}
