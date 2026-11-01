// Issue #47: checks that the Vite dev server serves `import x from './data/*.lino'`
// as the object the file holds (the build and vitest are covered by src/lino-47.test.js).
import { createServer } from 'vite';
const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
try {
  for (const name of ['github', 'indicators']) {
    const mod = await server.ssrLoadModule(`/src/data/${name}.lino`);
    console.log(name, Object.keys(mod).join(','));
  }
  const res = await server.transformRequest('/src/data/habr.lino?import');
  console.log('client habr.lino ->', res.code.slice(0, 60));
} finally {
  await server.close();
}
