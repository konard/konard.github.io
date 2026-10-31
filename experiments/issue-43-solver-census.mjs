// Compare the previous solver (default 30° range, gap-first) with the staged
// solver (default 180° range, turns before gaps) on every 1–2-link network and
// a seeded sample of 3-link networks. Writes JSON lines to the given file.
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
const [out = 'docs/case-studies/issue-43/data/solver-census.json', sample = '40'] = process.argv.slice(2);
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
try {
  const fresh = await server.ssrLoadModule('/src/links/collisions.js');
  const old = await server.ssrLoadModule('/experiments/issue-43-collisions-before.js');
  const { normalizeStyle, shapeOfStyle } = await server.ssrLoadModule('/src/links/style.js');
  const { decode } = await server.ssrLoadModule('/src/links/configurations.js');
  const codes = [];
  const all = (n) => {
    const out = [];
    const total = (n + 1) ** (2 * n);
    for (let k = 0; k < total; k++) out.push(k.toString(n + 1).padStart(2 * n, '0'));
    return out;
  };
  codes.push(...all(1), ...all(2));
  let seed = 43;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const three = all(3);
  for (let k = 0; k < Number(sample); k++) codes.push(three[Math.floor(random() * three.length)]);
  const gapChange = (shape, gaps) =>
    gaps.reduce(
      (s, row) =>
        s +
        row.slice(0, 2).reduce((t, v, k) => t + (v == null ? 0 : Math.abs(v - [shape.startGap, shape.endGap][k])), 0),
      0,
    );
  const rows = [];
  for (const code of codes) {
    const links = decode(code.match(/../g).join(' '));
    const row = { code };
    for (const [name, module, range] of [
      ['old', old, 30],
      ['new', fresh, 180],
    ]) {
      const style = normalizeStyle({});
      const shape = shapeOfStyle(style, links);
      const t = performance.now();
      const r = module.solveCollisions(links, shape, {
        adjustGaps: true,
        range,
        step: 1,
        gapRange: 0.2,
        middleRange: 0,
      });
      row[name] = {
        before: +(r.before - fresh.turningCost(shape.turns)).toFixed(3),
        after: +(r.after - fresh.turningCost(r.turns)).toFixed(3),
        maxTurn: Math.max(0, ...r.delta.flat().map(Math.abs)),
        gapChange: +gapChange(shape, r.linkGaps).toFixed(3),
        ms: Math.round(performance.now() - t),
        turns: r.turns,
      };
    }
    rows.push(row);
    console.log(
      code,
      JSON.stringify(row.old.after),
      '→',
      JSON.stringify(row.new.after),
      'gaps',
      row.old.gapChange,
      '→',
      row.new.gapChange,
      'ms',
      row.old.ms,
      row.new.ms,
    );
  }
  const summary = {};
  for (const name of ['old', 'new'])
    summary[name] = {
      networks: rows.length,
      clean: rows.filter((r) => r[name].after <= 1e-9).length,
      cleanWithoutGapChanges: rows.filter((r) => r[name].after <= 1e-9 && r[name].gapChange === 0).length,
      totalCollisions: +rows.reduce((s, r) => s + r[name].after, 0).toFixed(3),
      totalGapChange: +rows.reduce((s, r) => s + r[name].gapChange, 0).toFixed(3),
      maxMs: Math.max(...rows.map((r) => r[name].ms)),
      totalMs: rows.reduce((s, r) => s + r[name].ms, 0),
    };
  summary.newWorse = rows.filter((r) => r.new.after > r.old.after + 1e-9).map((r) => r.code);
  console.log(JSON.stringify(summary, null, 2));
  writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));
} finally {
  await server.close();
}
